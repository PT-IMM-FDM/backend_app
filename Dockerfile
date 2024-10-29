# Use Node as base
FROM node:18 AS base

# Install necessary dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libgbm-dev \
    libpango-1.0-0 \
    libcups2 \
    libxss1 \
    libxtst6 \
    libasound2 \
    libatk1.0-0 \
    libx11-6 \
    libxext6 \
    libxft2 \
    fonts-liberation \
    libappindicator3-1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

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

# Run the application
CMD ["sh", "-c", "node build/index.js"]
