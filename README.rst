Color Seasons
=============

Set up docker, per
``https://store.docker.com/editions/community/docker-ce-desktop-mac``.

Copy the ``.env`` file::

    mv env.example .env

You can also edit ``.env``, if you have any values that you know should
be different.

Run::

    docker-compose up

If you've made changes and they're not showing up, you may need to force
a rebuild of the Docker images::

    docker-compose build --nocache

Access the running server at http://localhost/ or
http://example.com.hexxie.com/ (these both point to
127.0.0.1).
