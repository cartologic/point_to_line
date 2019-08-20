# -*- coding: utf-8 -*-

import requests
from django.conf import settings
from django.db import connections
from requests.adapters import HTTPAdapter
from requests.auth import HTTPBasicAuth
from requests.packages.urllib3.util.retry import Retry
from slugify import slugify

from geonode.geoserver.helpers import (get_store, gs_catalog,
                                       ogc_server_settings)
from geonode.upload.utils import create_geoserver_db_featurestore

DEFAULT_WORKSPACE = settings.DEFAULT_WORKSPACE


def table_exist(name):
    data_db_name = settings.OGC_SERVER['default']['DATASTORE']
    connection = None
    for c in connections.all():
        if c.alias == data_db_name:
            connection = c
    table_names = connection.introspection.table_names()
    exist = name in table_names
    return exist


def SLUGIFIER(text):
    return slugify(text, separator='_')


def get_db_settings():
    settings = ogc_server_settings.datastore_db
    return {
        'db_name': settings.get('NAME'),
        'user': settings.get('USER'),
        'password': settings.get('PASSWORD'),
        'host': settings.get('HOST', 'localhost'),
        'port': settings.get('PORT', 5432),
    }

def create_connection_string():
    settings = get_db_settings()
    databaseServer = settings['host']
    databaseName = settings['db_name']
    databaseUser = settings['user']
    databasePW = settings['password']
    databasePort = settings['port']
    return "PG: host=%s port=%s dbname=%s user=%s password=%s" % (databaseServer, databasePort, databaseName,databaseUser, databasePW)

def get_sld_body(url):
    req = requests.get(
        url,
        auth=HTTPBasicAuth(ogc_server_settings.credentials[0],
                           ogc_server_settings.credentials[1]))
    return req.text


def get_gs_store(storename=None, workspace=DEFAULT_WORKSPACE):
    if not storename:
        storename = ogc_server_settings.datastore_db.get('NAME', None)
    return get_store(gs_catalog, storename, workspace)


def get_store_schema(storename=None):
    if not storename:
        storename = ogc_server_settings.datastore_db.get('NAME')
    store = get_store(gs_catalog, storename, settings.DEFAULT_WORKSPACE)
    return store.connection_parameters.get('schema', 'public')


def create_datastore(store_name=None, store_type=None):
    if not store_name:
        store_name = ogc_server_settings.datastore_db['NAME']
    return create_geoserver_db_featurestore(
        store_type=store_type, store_name=store_name)


def _psycopg2(conn_str):
    try:
        import psycopg2
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        conn.close()
        connected = True
    except BaseException:
        connected = False
    return connected


def _django_connection():
    try:
        from django.db import connections
        ds_conn_name = ogc_server_settings.server.get('DATASTORE', None)
        conn = connections[ds_conn_name]
        conn.connect()
        cur = conn.cursor()
        cur.execute("SELECT version();")
        conn.close()
        connected = True
    except BaseException:
        connected = False
    return connected


def requests_retry_session(retries=3,
                           backoff_factor=0.3,
                           status_forcelist=(500, 502, 504),
                           session=None):
    session = session or requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        method_whitelist=frozenset(['GET', 'POST', 'PUT', 'DELETE', 'HEAD']))
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session


def describe_feature_type(typename):
    username = ogc_server_settings.credentials[0]
    password = ogc_server_settings.credentials[1]
    geoserver_url = ogc_server_settings.LOCATION
    s = requests.Session()
    s.auth = (username, password)
    params = {
        'service': 'wfs',
        'version': '1.1.0',
        'request': 'DescribeFeatureType',
        'typeNames': typename,
        'outputFormat': 'application/json'
    }
    from .helpers import urljoin
    s = requests_retry_session(session=s)
    response = s.get(urljoin(geoserver_url, 'wfs'), params=params)
    return response


def get_geom_attr(typename):
    response = describe_feature_type(typename)
    if response.status_code != 200:
        return None
    data = response.json()
    feature_type = data.get('featureTypes')[0]
    properties = feature_type.get('properties')

    def is_geom_attr(attr):
        if 'gml:' in attr.get('type', ''):
            return True
        return False

    geom_attrs = filter(is_geom_attr, properties)
    if len(geom_attrs) == 0:
        return None
    return str(geom_attrs[0].get('name'))
