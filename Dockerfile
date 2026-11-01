FROM node:18-alpine AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./

ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx prisma generate \
    && npm run build \
    && npx tsc prisma/seed/index.ts \
        --outDir build-seed \
        --target es2016 \
        --module commonjs \
        --esModuleInterop \
        --skipLibCheck

FROM node:18-alpine AS base

RUN apk add --no-cache chromium openssl

WORKDIR /app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/build-seed ./build-seed
COPY --from=build /app/prisma ./prisma

EXPOSE 3030
CMD ["node", "build/index.js"]
