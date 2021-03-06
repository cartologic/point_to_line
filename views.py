import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from geonode.layers.models import Layer

from . import APP_NAME
from .forms import PointToLineForm
from .point_to_multiline import PointsToMultiPath
from .publishers import publish_in_geonode, publish_in_geoserver, cascade_delete_layer
from .utils import create_connection_string, table_exist


@login_required
def index(request):
    return render(request, template_name="%s/index.html" % APP_NAME,
                  context={'message': 'Hello from %s' % APP_NAME, 'app_name': APP_NAME})


@login_required
def get_line_features(request):
    if request.method == 'POST':
        in_layer_name = request.POST.get('in_layer_name')
        sort_by_attr = request.POST.get('sort_by_attr')
        group_by_attr = request.POST.get('group_by_attr')
        # 3. Get current line features
        connection_string = create_connection_string()
        p = PointsToMultiPath(
            connection_string,
            in_layer_name,
            None,
            sort_by_attr=sort_by_attr,
            group_by_attr=group_by_attr,
        )
        p.start_connection()
        p.get_in_layer()
        features_dict = p.create_features_dict()
        if sort_by_attr:
            duplicates_dict = p.get_duplicated_features()
            features_dict_res = [
                {
                    "name": key,
                    "numberOfFeatures": len(value),
                    "duplicated_features": duplicates_dict[key]['duplicate']
                }
                for key, value in features_dict.iteritems()
            ]
        else:
            duplicates_dict = p.get_duplicated_features()
            features_dict_res = [
                {
                    "name": key,
                    "numberOfFeatures": len(value),
                    "duplicated_features": []
                }
                for key, value in features_dict.iteritems()
            ]
        p.close_connection()
        json_response = {
            'status': True,
            'objects': features_dict_res
        }
        return JsonResponse(json_response, status=200)
    json_response = {"status": False,
                     "message": "Error while getting line features, Form is not valid!", }
    return JsonResponse(json_response, status=500)


@login_required
def generate(request):
    warnings = ''
    if request.method == 'POST':
        form = PointToLineForm(request.POST)
        if form.is_valid():
            # 1. Check clean form
            # 2. Check table exist
            in_layer_name = form.cleaned_data['in_layer_name']
            out_layer_name = form.cleaned_data['out_layer_name']
            sort_by_attr = form.cleaned_data['sort_by_attr']
            group_by_attr = form.cleaned_data['group_by_attr']
            line_features = request.POST.get('line_features')
            line_features = [str(f) for f in json.loads(line_features)] if line_features else []
            if table_exist(out_layer_name):
                json_response = {"status": False,
                                 "message": "Layer Already Exists!, Try again with different layer name, If you don't see the existing layer in the layer list, Please contact the administrator", }
                return JsonResponse(json_response, status=500)
            # 3. Start Generating layer
            connection_string = create_connection_string()
            p = PointsToMultiPath(
                connection_string,
                in_layer_name,
                out_layer_name,
                sort_by_attr=sort_by_attr,
                group_by_attr=group_by_attr,
                line_features=line_features,
            )
            try:
                p.start_connection()
            except:
                json_response = {"status": False,
                                 "message": "Error while connecting to database! Try again or contact the administrator", }
                return JsonResponse(json_response, status=500)
            try:
                p.execute()
                p.close_connection()
            except Exception as e:
                # roll back and delete table if exist
                p.start_connection()
                p.delete_layer(str(out_layer_name))
                p.close_connection()
                ogr_error = 'Error while creating Line Layer: {}'.format(e)
                json_response = {"status": False,
                                 "message": "Error While Creating Line Layer In The Database! Try again or contact the administrator \n\n ogr_error:{}".format(
                                     ogr_error), }
                return JsonResponse(json_response, status=500)
            # 4. Create GeoServer
            gs_response = publish_in_geoserver(out_layer_name)
            if gs_response.status_code != 201:
                if gs_response.status_code == 500:
                    # status code 500:
                    # layer exist in geoserver datastore and does not exist in database
                    # hence the database check is done in step 2
                    # cascade delete is a method deletes layer from geoserver and database
                    cascade_delete_layer(str(out_layer_name))
                # delete from database as well
                p.start_connection()
                p.delete_layer(str(out_layer_name))
                p.close_connection()
                json_response = {
                    "status": False, "message": "Could not publish to GeoServer, Error Response Code:{}".format(
                        gs_response.status_code), 'warnings': warnings}
                return JsonResponse(json_response, status=500)

            # 5. GeoNode Publish
            try:
                layer = publish_in_geonode(out_layer_name, owner=request.user)
            except Exception as e:
                # roll back and delete table if exist
                p.start_connection()
                p.delete_layer(str(out_layer_name))
                p.close_connection()
                cascade_delete_layer(str(out_layer_name))
                try:
                    Layer.objects.get(name=str(out_layer_name)).delete()
                finally:
                    print('Layer {} could not be deleted or does not already exist'.format(out_layer_name))
                print('Error while publishing {} in geonode: {}'.format(out_layer_name, e.message))
                json_response = {
                    "status": False, "message": "Could not publish in GeoNode, Try again or contact the administrator",
                    'warnings': warnings}
                return JsonResponse(json_response, status=500)

            json_response = {"status": True, "message": "Line Layer Created Successfully!",
                             'warnings': warnings, "layer_name": layer.alternate}
            return JsonResponse(json_response, status=200)

        json_response = {"status": False,
                         "message": "Error While Publishing!", }
        return JsonResponse(json_response, status=500)
