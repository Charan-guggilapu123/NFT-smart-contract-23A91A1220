# Use an official Node image
FROM node:20-bullseye

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (to use Docker cache)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy rest of the project
COPY . .

# Prebuild (hardhat doesn't require build step but ensure dependencies)
RUN npx hardhat --version

# Default command: run tests
CMD ["npm", "test"]
