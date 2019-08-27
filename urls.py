from django.conf.urls import url, include

from . import views, APP_NAME

urlpatterns = [
    url(r'^$', views.index, name='%s.index' % APP_NAME),
    url(r'^generate/', views.generate, name='%s.generate' % APP_NAME),
    url(r'^get-line-features/', views.get_line_features, name='%s.get_line_features' % APP_NAME),
]
