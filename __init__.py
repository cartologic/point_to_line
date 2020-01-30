import os

APP_NAME = os.path.basename(os.path.dirname(__file__))

default_app_config = '{}.apps.PointToLineConfig'.format(APP_NAME)
