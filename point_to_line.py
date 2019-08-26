from osgeo import ogr, osr

databaseServer = "localhost"
databaseName = "te_data"
databaseUser = "postgres"
databasePW = "123456"
connString = "PG: host=%s dbname=%s user=%s password=%s" % (databaseServer,databaseName,databaseUser,databasePW)


def GetPGLayer( lyr_name ):
    conn = ogr.Open(connString)
    lyr = conn.GetLayer( lyr_name )
    # feature_count = lyr.GetFeatureCount()

    # create long line:
    line = ogr.Geometry(ogr.wkbLineString)
    for f in lyr:
        geom = f.GetGeometryRef()
        line.AddPoint(geom.GetX(), geom.GetY())

    # get current layer srs
    srs = lyr.GetSpatialRef()

    # out layer name
    out_layer_name = "line_test"
    
    # Create a layer
    conn.CreateLayer(out_layer_name, geom_type=ogr.wkbLineString, srs=srs, options=['OVERWRITE=YES'])
    
    # Get Created layer
    lyr = conn.GetLayer( out_layer_name )

    # Add an ID field
    # idField = ogr.FieldDefn("id", ogr.OFTInteger)
    # lyr.CreateField(idField)

    # Create the feature and set values
    featureDefn = lyr.GetLayerDefn()
    feature = ogr.Feature(featureDefn)
    feature.SetGeometry(line)
    # feature.SetField("id", 1)
    
    # Start transaction
    lyr.StartTransaction()
    lyr.CreateFeature(feature)
    # Commit Transaction
    lyr.CommitTransaction()
    
    feature = None

    # Delete Layer
    # conn.DeleteLayer(lyr_name)

    # Close connection
    conn = None

# lyr_name = 'pharmacies'
# lyr = GetPGLayer(lyr_name)
