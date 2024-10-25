FROM node:18 AS base

WORKDIR /

COPY package*.json ./

RUN npm i

COPY . .

FROM base AS production

ENV NODE_PATH=./dist

EXPOSE 3333

RUN npm run build && npm run seed && npm run start
