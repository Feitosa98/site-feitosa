#!/bin/bash

# Deploy Script for Portal NFS-e
# This script automates the deployment process

set -e

echo "🚀 Starting Portal NFS-e Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo "📝 Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "✅ Environment variables loaded"

# Build Docker images
echo "🔨 Building Docker images..."
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "☁️  Cloudflare Tunnel Token detected! Including Cloudflare service."
    docker-compose -f docker-compose.yml -f docker-compose.cloudflare.yml build
else
    docker-compose build
fi

# Start services
echo "🚀 Starting services..."
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d
else
    docker-compose up -d
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Generate Prisma Client (if needed)
echo "🔧 Generating Prisma Client..."
docker-compose exec -T app npx prisma generate

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Application is running at:"
echo "   - Local: http://localhost:3000"
echo "   - Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f app"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart app"
echo ""
