from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer
from . import models

User = get_user_model()


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "season",
        )


class HexColorSerializer(ModelSerializer):
    class Meta:
        model = models.HexColor
        fields = (
            "id",
            "hex_code",
        )


class ColorSerializer(ModelSerializer):
    class Meta:
        model = models.Color
        fields = (
            "id",
            "name",
            "hex_codes",
        )


class SeasonSerializer(ModelSerializer):
    class Meta:
        model = models.Season
        fields = (
            "id",
            "name",
            "colors",
        )
