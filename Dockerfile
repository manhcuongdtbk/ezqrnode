FROM node:12.16.1-buster

RUN apt-get update && apt-get install -y \
  vim \
  nano

WORKDIR /ezqrnode
COPY package*.json ./
COPY . .

RUN npm install
