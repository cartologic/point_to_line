import os
import re
import uuid
import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.forms import ValidationError
from django.http import JsonResponse
from django.shortcuts import render

from . import APP_NAME
from .forms import PointToLineForm
from .point_to_multiline import PointsToMultiPath
from .publishers import publish_in_geonode, publish_in_geoserver
from .utils import create_connection_string, table_exist


@login_required
def index(request):
    return render(request, template_name="%s/index.html" % APP_NAME,
                  context={'message': 'Hello from %s' % APP_NAME, 'app_name': APP_NAME})


@login_required
def get_line_features(request):
    if request.method == 'POST':
        form = PointToLineForm(request.POST)
        if form.is_valid():
            # 1. Check clean form
            # 2. Check table exist
            in_layer_name = form.cleaned_data['in_layer_name']
            out_layer_name = form.cleaned_data['out_layer_name']
            sort_by_attr = form.cleaned_data['sort_by_attr']
            group_by_attr = form.cleaned_data['group_by_attr']
            if table_exist(out_layer_name):
                json_response = {"status": False,
                                 "message": "Layer Already Exists!, Try again with different layer name, If you don't see the existing layer in the layer list, Please contact the administrator", }
                return JsonResponse(json_response, status=500)
            # 3. Get current line features
            connection_string = create_connection_string()
            p = PointsToMultiPath(
                connection_string,
                in_layer_name,
                out_layer_name,
                sort_by_attr=sort_by_attr,
                group_by_attr=group_by_attr,
            )
            p.start_connection()
            p.get_in_layer()
            features_dict = p.create_features_dict()
            features_dict_res = [
                {
                    "name": key,
                    "numberOfFeatures": len(value)
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
                                 "message": "Error While Creating Line Layer In The Database! Try again or contact the administrator \n\n ogr_error:{}".format(ogr_error), }
                return JsonResponse(json_response, status=500)
            # 4. Create GeoServer
            try:
                publish_in_geoserver(out_layer_name)
            except:
                # roll back and delete table if exist
                p.start_connection()
                p.delete_layer(str(out_layer_name))
                p.close_connection()
                json_response = {
                    "status": False, "message": "Could not publish to GeoServer, Try again or contact the administrator", 'warnings': warnings}
                return JsonResponse(json_response, status=500)

            # 5. GeoNode Publish
            try:
                layer = publish_in_geonode(out_layer_name, owner=request.user)
            except:
                # roll back and delete table if exist
                p.start_connection()
                p.delete_layer(str(out_layer_name))
                p.close_connection()
                json_response = {
                    "status": False, "message": "Could not publish in GeoNode, Try again or contact the administrator", 'warnings': warnings}
                return JsonResponse(json_response, status=500)

            json_response = {"status": True, "message": "Line Layer Created Successfully!",
                             'warnings': warnings, "layer_name": layer.alternate}
            return JsonResponse(json_response, status=200)

        json_response = {"status": False,
                         "message": "Error While Publishing!", }
        return JsonResponse(json_response, status=500)
