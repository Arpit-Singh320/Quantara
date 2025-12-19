# Node.js Backend Dockerfile - Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for build)
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist/

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
CMD ["node", "dist/index.js"]
