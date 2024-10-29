# Use Node as base
FROM node:18 AS base

# Set the working directory
WORKDIR /

# Copy package.json and install dependencies
COPY package*.json ./

RUN npm install

RUN npm install -D typescript @types/node ts-node

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN npm run build

# Run Prisma migration and seed commands (optional)
RUN npx prisma generate

# Run Prisma migrations and seed on the final image entry
CMD ["sh", "-c", "\
    npx prisma db push --force-reset && \
    npx prisma db seed && \
    node build/index.js \
"]
