FROM node:18 as base

WORKDIR /app

COPY package*.json ./

RUN npm i

RUN npx prisma generate

COPY . .

FROM base as production

ENV NODE_PATH=./dist

RUN npm run build
