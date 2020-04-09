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
            "name",
            "hex_code",
            "category"
        )


class CategorySerializer(ModelSerializer):
    class Meta:
        model = models.Category
        fields = (
            "id",
            "name",
            "colors",
        )


class SeasonSerializer(ModelSerializer):
    class Meta:
        model = models.Season
        fields = (
            "id",
            "name",
            "colors",
        )


class HostSerializer(ModelSerializer):
    class Meta:
        model = models.Host
        fields = (
            "id",
            "name",
            "picture",
            "happy_picture",
            "season",
        )
