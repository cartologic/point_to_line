from osgeo import ogr, osr, gdal

class PointsToMultiPath(object):
    def __init__(self, connection_string, in_layer_name, out_layer_name, sort_by_attr, group_by_attr):
        self.in_layer_name = in_layer_name
        self.out_layer_name = out_layer_name
        self.sort_by_attr = sort_by_attr
        self.group_by_attr = group_by_attr
        self.conn = ogr.Open(connection_string)

        self.get_in_layer()
        self.create_out_layer()

        self.group_by_index = self.get_field_index(group_by_attr)
        self.sort_by_index = self.get_field_index(sort_by_attr)
        
        self.features_dict = self.create_features_dict()
        self.out_features = self.create_out_features()

        self.commit_transactions()
        self.close_conn()


    def get_in_layer(self):
        self.in_layer = self.conn.GetLayer( self.in_layer_name )
        self.in_layerDefn = self.in_layer.GetLayerDefn()
        self.srs = self.in_layer.GetSpatialRef()
            
    def create_out_layer(self):
        # create an out layer in postgres
        self.conn.CreateLayer(
            self.out_layer_name, 
            geom_type=ogr.wkbLineString, 
            srs=self.srs, 
            options=['OVERWRITE=YES']
        )
        self.out_layer = self.conn.GetLayer( self.out_layer_name )
        self.out_featureDefn = self.out_layer.GetLayerDefn()
    

    def get_field_index(self, attr):
        for i in range( self.in_layerDefn.GetFieldCount() ):
            if (self.in_layerDefn.GetFieldDefn( i ).GetName() == attr):
                return i
        
    def create_features_dict(self):
        features_dict = {}
        for f in self.in_layer:
            line_name = f[self.group_by_index]
            try:
                # if the list of features
                features_dict[line_name].append(f)
            except:
                # create list of features if not existing
                features_dict[line_name] = []
                features_dict[line_name].append(f)
        return features_dict
    

    def create_out_features(self):
        # Lines Creation Process:
        out_features = []
        for i, key in enumerate(self.features_dict, start=1):
            # sort features by sort attr inside the dict:
            feat = self.features_dict[key][0][self.sort_by_index]
            sorted_features = self.features_dict[key]
            sorted_features.sort(key=lambda f: f[self.sort_by_index])
            ids = [f[self.sort_by_index] for f in sorted_features]

            # create a new line geometry
            line = ogr.Geometry(ogr.wkbLineString)
            for feat in sorted_features:
                geom = feat.GetGeometryRef()
                line.AddPoint(geom.GetX(), geom.GetY())
            
            # Create a new feature 
            out_feature = ogr.Feature(self.out_featureDefn)
            
            # Set Feature Geometry
            out_feature.SetGeometry(line)
            
            out_features.append(out_feature)
        return out_features


    def commit_transactions(self):
        # Start transaction with postgres and create feature(table row)
        for feature in self.out_features:
            self.out_layer.StartTransaction()
            self.out_layer.CreateFeature(feature)
            self.out_layer.CommitTransaction()

    def close_conn(self):
        self.conn = None


# p = PointsToMultiPath(
#     connString,
#     'cable_points',
#     'just123',
#     'id',
#     'type'
# )
# print(p)
# p.close_conn()



databaseServer = "localhost"
databaseName = "te_data"
databaseUser = "postgres"
databasePW = "123456"
connString = "PG: host=%s dbname=%s user=%s password=%s" % (databaseServer,databaseName,databaseUser,databasePW)

def multi_point_to_paths( lyr_name ):
    conn = ogr.Open(connString)
    in_lyr = conn.GetLayer( lyr_name )
    in_lyrDefn = in_lyr.GetLayerDefn()
    srs = in_lyr.GetSpatialRef()

    # create an out layer in postgres
    out_layer_name = "line_test_2"
    conn.CreateLayer(out_layer_name, geom_type=ogr.wkbLineString, srs=srs, options=['OVERWRITE=YES'])
    out_lyr = conn.GetLayer( out_layer_name )
    out_featureDefn = out_lyr.GetLayerDefn()

    group_by_attr = 'type'  
    group_by_index = None

    sort_by_attr = 'id'
    sort_by_index = None
    
    # Get group_by_index:
    for i in range( in_lyrDefn.GetFieldCount() ):
        if (in_lyrDefn.GetFieldDefn( i ).GetName() == group_by_attr):
            group_by_index = i
            break
    
    # Get sort_by_index:
    for i in range( in_lyrDefn.GetFieldCount() ):
        if (in_lyrDefn.GetFieldDefn( i ).GetName() == sort_by_attr):
            sort_by_index = i
            break

    # Create Features Dict:
    features_dict = {}
    for f in in_lyr:
        line_name = f[group_by_index]
        try:
            # if the list of features
            features_dict[line_name].append(f)
        except:
            # create list of features if not existing
            features_dict[line_name] = []
            features_dict[line_name].append(f)
    
    # Add an ID field
    idField = ogr.FieldDefn("id", ogr.OFTInteger)
    out_lyr.CreateField(idField)
    
    # Lines Creation Process:
    out_features = []
    for i, key in enumerate(features_dict, start=1):
        # sort features by sort attr inside the dict:
        feat = features_dict[key][0][sort_by_index]
        sorted_features = features_dict[key]
        sorted_features.sort(key=lambda f: f[sort_by_index], reverse=True)
        ids = [f[sort_by_index] for f in sorted_features]

        # create a new line geometry
        line = ogr.Geometry(ogr.wkbLineString)
        for feat in sorted_features:
            geom = feat.GetGeometryRef()
            line.AddPoint(geom.GetX(), geom.GetY())
        
        # Create a new feature 
        out_feature = ogr.Feature(out_featureDefn)
        
        # Set Feature Geometry
        out_feature.SetGeometry(line)

        # Set fields, for example id
        out_feature.SetField("id", i)
        
        out_features.append(out_feature)

    # Start transaction with postgres and create feature(table row)
    for feature in out_features:
        out_lyr.StartTransaction()
        out_lyr.CreateFeature(feature)
        out_lyr.CommitTransaction()
        
    # Close the connection
    conn = None

in_lyr_name = 'cable_points'
out_lyr_name = 'test_line_2'
lyr = multi_point_to_paths(in_lyr_name)
