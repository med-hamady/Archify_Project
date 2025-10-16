# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package.json ./
COPY backend/package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy backend source code
COPY backend/ ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port (Railway assigns dynamically via PORT env var)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
