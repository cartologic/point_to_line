from django import forms

class PointToLineForm(forms.Form):
    in_layer_name = forms.CharField(max_length='200')
    sort_by_attr = forms.CharField(max_length='200', required=False)
    group_by_attr = forms.CharField(max_length='200', required=False)
    out_layer_name = forms.CharField(max_length='63')