# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (with legacy peer deps for compatibility)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl

# Set environment to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/create-finance-user.js ./create-finance-user.js
COPY --from=builder /app/scripts ./scripts

# Create and set permissions for uploads directory
RUN mkdir -p /app/uploads/charges && chown -R nextjs:nodejs /app/uploads

# Set correct permissions for app directory
RUN chown -R nextjs:nodejs /app

# USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
