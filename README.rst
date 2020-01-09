Color Seasons
=============

To read from the API, you only need to issue ``GET`` requests::

   GET /season/

Reply::

   [
     {
       "id": 1,
       "name": "Winter",
       "colors": [1, 2]
     }
   ]

To edit the API, ``POST``, ``PUT`` and ``DELETE`` with the following
header::

   Authorization: Token abc123...

With the appropriate token put in there.

Then, post things like::

   POST /season/

   {
     "name": "Summer",
     "colors": [3, 4]
   }

where the numbers in ``"colors"`` are the IDs of the Color objects at
the ``/color/`` endpoint.
