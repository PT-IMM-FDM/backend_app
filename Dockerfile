# Use Node as base
FROM node:18 AS base

# Set the working directory
WORKDIR /

# Copy package.json and install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the application
COPY . .

# Run Prisma migration and seed commands (optional)
RUN npx prisma generate

RUN npx prisma db push --force-reset

# Build TypeScript
RUN npm run build

RUN npm run seed

# Run Prisma migrations and seed on the final image entry
CMD ["sh", "-c", "\
    node build/index.js \
"]
