FROM miserylee/ubuntu-yarn-pm2:latest
MAINTAINER MiseryLee<miserylee@foxmail.com>

RUN mkdir /app
WORKDIR /app

COPY . /app

RUN yarn
RUN yarn build

EXPOSE 3000

CMD pm2-docker start ./build/index.js
