FROM node:12.15.0

RUN apt-get update && apt-get install -y \
  vim \
  nano

WORKDIR /app
COPY package*.json ./

RUN npm install

COPY . .
