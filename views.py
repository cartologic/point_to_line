import os
import re
import uuid
from datetime import datetime

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.forms import ValidationError
from django.http import JsonResponse
from django.shortcuts import render

from .forms import PointToLineForm
from .utils import table_exist, create_connection_string
from .point_to_multiline import PointsToMultiPath
from .publishers import publish_in_geoserver, publish_in_geonode
from . import APP_NAME


@login_required
def index(request):
    return render(request, template_name="%s/index.html" % APP_NAME,
                  context={'message': 'Hello from %s' % APP_NAME, 'app_name': APP_NAME})


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
                sort_by_attr,
                group_by_attr
            )

            try:
                p.start_connection()
            except:
                json_response = {"status": False,
                                 "message": "Error while connecting to database! Try again or contact the administrator", }
                return JsonResponse(json_response, status=500)
            try:
                p.execute()
                p.close_conn()
            except:
                json_response = {"status": False,
                                 "message": "Error While Creating Line Layer In The Database! Try again or contact the administrator", }
                return JsonResponse(json_response, status=500)
            # 4. Create GeoServer
            try:
                publish_in_geoserver(out_layer_name)
            except:
                # TODO: roll back the database table here!
                json_response = {
                    "status": False, "message": "Could not publish to GeoServer, Try again or contact the administrator", 'warnings': warnings}
                return JsonResponse(json_response, status=500)

            # 5. GeoNode Publish
            try:
                layer = publish_in_geonode(out_layer_name, owner=request.user)
            except:
                # TODO: roll back the delete geoserver record and db name
                json_response = {
                    "status": False, "message": "Could not publish in GeoNode, Try again or contact the administrator", 'warnings': warnings}
                return JsonResponse(json_response, status=500)

            json_response = {"status": True, "message": "Line Layer Created Successfully!",
                             'warnings': warnings, "layer_name": layer.alternate}
            return JsonResponse(json_response, status=200)

        json_response = {"status": False,
                         "message": "Error While Publishing!", }
        return JsonResponse(json_response, status=500)
