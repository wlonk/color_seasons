#!/bin/sh
python src/manage.py migrate
# Replace this line with a gulp task:
python src/manage.py collectstatic
python src/manage.py runserver 0.0.0.0:8000
