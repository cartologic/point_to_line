from osgeo import ogr, osr


class PointsToMultiPath(object):
    def __init__(self, connection_string, in_layer_name, out_layer_name, sort_by_attr, group_by_attr):
        self.in_layer_name = str(in_layer_name)
        self.out_layer_name = str(out_layer_name)
        self.sort_by_attr = str(sort_by_attr)
        self.group_by_attr = str(group_by_attr)
        self.connection_string = connection_string

    def start_connection(self):
        self.conn = ogr.Open(self.connection_string)

    def execute(self):
        self.get_in_layer()
        self.group_by_index = self.get_field_index(self.group_by_attr)
        self.sort_by_index = self.get_field_index(self.sort_by_attr)
        
        self.create_out_layer()
        self.features_dict = self.create_features_dict()
        self.out_features = self.create_out_features()

        self.commit_transactions()

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

    def close_connection(self):
        self.conn = None
