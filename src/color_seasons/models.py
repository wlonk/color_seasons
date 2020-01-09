from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    season = models.ForeignKey('Season', on_delete=models.SET_NULL, null=True, related_name="users", blank=True)


class Color(models.Model):
    name = models.CharField(max_length=100, unique=True)


class HexColor(models.Model):
    hex_code = models.CharField(max_length=100, unique=True)
    color = models.ForeignKey(Color, related_name="hex_codes", on_delete=models.CASCADE)


class Season(models.Model):
    name = models.CharField(max_length=100, unique=True)
    colors = models.ManyToManyField(Color, related_name="seasons", blank=True)


class Host(models.Model):
    name = models.CharField(max_length=100, unique=True)
    picture = models.URLField()
    season = models.ForeignKey('Season', on_delete=models.SET_NULL, null=True, related_name="hosts", blank=True)
