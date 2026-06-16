FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install OpenSSL for Prisma compatibility on Alpine
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
