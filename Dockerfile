FROM node:6.10

WORKDIR /app
COPY package.json /app
RUN yarn install

#npm install -g serverless

ENTRYPOINT '/bin/bash'
