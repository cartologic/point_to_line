from osgeo import ogr, osr


class PointsToMultiPath(object):
    def __init__(self,
                 connection_string,
                 in_layer_name,
                 out_layer_name,
                 sort_by_attr,
                 group_by_attr,
                 line_features=None
                 ):
        self.in_layer_name = str(in_layer_name)
        self.out_layer_name = str(out_layer_name)
        self.sort_by_attr = str(
            sort_by_attr) if sort_by_attr is not None else None
        self.group_by_attr = str(
            group_by_attr) if group_by_attr is not None else None
        self.line_features = line_features if line_features is not None else None
        self.connection_string = connection_string

    def start_connection(self):
        self.conn = ogr.Open(self.connection_string)

    def execute(self):
        self.get_in_layer()

        self.create_out_layer()
        self.features_dict = self.create_features_dict()
        self.out_features = self.create_out_features()

        self.commit_transactions()

    def get_in_layer(self):
        self.in_layer = self.conn.GetLayer(self.in_layer_name)
        self.in_layerDefn = self.in_layer.GetLayerDefn()
        self.srs = self.in_layer.GetSpatialRef()
        self.group_by_index = self.get_field_index(
            self.group_by_attr) if self.group_by_attr is not None else None
        self.sort_by_index = self.get_field_index(
            self.sort_by_attr) if self.sort_by_attr is not None else None

    def create_out_layer(self):
        # create an out layer in postgres
        self.conn.CreateLayer(
            self.out_layer_name,
            geom_type=ogr.wkbLineString,
            srs=self.srs,
            options=['OVERWRITE=YES']
        )
        self.out_layer = self.conn.GetLayer(self.out_layer_name)
        self.out_featureDefn = self.out_layer.GetLayerDefn()

    def get_field_index(self, attr):
        for i in range(self.in_layerDefn.GetFieldCount()):
            if (self.in_layerDefn.GetFieldDefn(i).GetName() == attr):
                return i

    def create_features_dict(self):
        features_dict = {}
        # consider all point features in one line feature if not (group by)
        if self.group_by_index is None:
            features_dict['single_feature'] = [f for f in self.in_layer]
            return features_dict
        for f in self.in_layer:
            line_name = str(f[self.group_by_index])
            # If user selected some line features   
            if self.line_features:
                # if line feature in the selected line features
                if line_name in self.line_features:
                    try:
                        # if the list of features
                        features_dict[line_name].append(f)
                    except:
                        # create list of features if not existing
                        features_dict[line_name] = []
                        features_dict[line_name].append(f)
                else:
                    # TODO: raise error or handle skipping
                    pass
            # Consider all line features are selected
            else:
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
            sorted_features = self.features_dict[key]
            if self.sort_by_index is not None:
                sorted_features.sort(key=lambda f: f[self.sort_by_index])

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
    
    def delete_layer(self, layer_name):
        self.conn.DeleteLayer(layer_name)

    def close_connection(self):
        self.conn = None
