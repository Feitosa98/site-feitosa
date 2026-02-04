#!/bin/bash

# Script de Implantação para Portal NFS-e
# Este script automatiza o processo de implantação

set -e

echo "🚀 Iniciando Implantação do Portal NFS-e..."

# Verificar se .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ Erro: .env.production não encontrado!"
    echo "📝 Por favor, copie .env.production.example para .env.production e configure-o."
    exit 1
fi

# Carregar variáveis de ambiente
export $(cat .env.production | grep -v '^#' | xargs)

echo "✅ Variáveis de ambiente carregadas"

# Construir imagens Docker
echo "🔨 Construindo imagens Docker..."
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "☁️  Token do Cloudflare Tunnel detectado! Incluindo serviço Cloudflare."
    docker-compose -f docker-compose.yml -f docker-compose.cloudflare.yml build
else
    docker-compose build
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.cloudflare.yml up -d
else
    docker-compose up -d
fi

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Executar migrações do banco de dados
echo "📊 Executando migrações do banco de dados..."
docker-compose exec -T app npx prisma migrate deploy

# Gerar Cliente Prisma (se necessário)
echo "🔧 Gerando Cliente Prisma..."
docker-compose exec -T app npx prisma generate

echo ""
echo "✅ Implantação concluída com sucesso!"
echo ""
echo "📊 Status do Serviço:"
docker-compose ps
echo ""
echo "🌐 A aplicação está rodando em:"
echo "   - Local: http://localhost:3000"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f app"
echo "   - Parar serviços: docker-compose down"
echo "   - Reiniciar: docker-compose restart app"
echo ""
