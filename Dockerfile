FROM ubuntu:latest

WORKDIR /home/

COPY package*.json ./

RUN apt-get update -y \
    && apt-get install -y nodejs npm \
    && npm install \
    && npm install express \
    && npm install axios \
    && npm i sqlite3

COPY . .