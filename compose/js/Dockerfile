FROM node:8.5.0

COPY ./package.json /package.json

RUN npm install -gq gulp-cli
RUN yarn

WORKDIR /app

CMD ["gulp", "dev"]
