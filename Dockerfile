# Use Node as base
FROM node:18 AS base

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the application
COPY . .

# Build TypeScript
RUN npm run build

# Run Prisma migration and seed commands (optional)
RUN npx prisma generate

# Run Prisma migrations and seed on the final image entry
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node build/index.js"]
