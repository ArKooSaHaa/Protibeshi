FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# Fallback: If package-lock.json exists, use 'npm ci', otherwise 'npm install'
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the code
COPY . .

# Dev stage
FROM base AS dev
EXPOSE 5173
# Use --host 0.0.0.0 so the port is accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage (for production)
FROM base AS build
RUN npm run build