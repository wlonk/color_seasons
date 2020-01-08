from rest_framework.serializers import ModelSerializer
from .models import Color, Season


class ColorSerializer(ModelSerializer):
    class Meta:
        model = Color
        fields = (
            "id",
            "name",
        )


class SeasonSerializer(ModelSerializer):
    class Meta:
        model = Season
        fields = (
            "id",
            "name",
            "colors",
        )
