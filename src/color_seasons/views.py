from django.contrib.auth import get_user_model
from rest_framework import viewsets

from . import models, serializers

User = get_user_model()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer


class HexColorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.HexColor.objects.all()
    serializer_class = serializers.HexColorSerializer


class ColorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Color.objects.all()
    serializer_class = serializers.ColorSerializer


class SeasonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Season.objects.all()
    serializer_class = serializers.SeasonSerializer
