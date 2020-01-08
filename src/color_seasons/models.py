from django.db import models


class Color(models.Model):
    name = models.CharField(max_length=100, unique=True)


class Season(models.Model):
    name = models.CharField(max_length=100, unique=True)
    colors = models.ManyToManyField(Color, related_name="seasons")
