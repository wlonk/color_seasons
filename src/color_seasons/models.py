from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    season = models.ForeignKey('Season', on_delete=models.SET_NULL, null=True, related_name="users", blank=True)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)


class HexColor(models.Model):
    hex_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, related_name="colors", on_delete=models.CASCADE)


class Season(models.Model):
    name = models.CharField(max_length=100, unique=True)
    colors = models.ManyToManyField(HexColor, related_name="seasons", blank=True)


class Host(models.Model):
    name = models.CharField(max_length=100, unique=True)
    picture = models.URLField()
    season = models.ForeignKey('Season', on_delete=models.SET_NULL, null=True, related_name="hosts", blank=True)
