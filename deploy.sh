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

# Detectar Docker Compose V2
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "🐳 Usando Docker Compose V2"
else
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "⚠️  Usando Docker Compose V1 (Legacy). Recomendamos atualizar para V2 para evitar erros."
fi

# Construir imagens Docker
echo "🔨 Construindo imagens Docker..."

if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    echo "☁️  Token do Cloudflare Tunnel detectado! (Iniciando: ${CLOUDFLARE_TUNNEL_TOKEN:0:5}...)"
    echo "    -> Incluindo arquivo de configuração do Cloudflare."
    $DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.cloudflare.yml build
else
    echo "⚠️  Nenhum token do Cloudflare Tunnel encontrado. O serviço não será iniciado."
    $DOCKER_COMPOSE_CMD build
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
    $DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.cloudflare.yml up -d
else
    $DOCKER_COMPOSE_CMD up -d
fi

# Aguardar PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Executar migrações do banco de dados
echo "📊 Executando migrações do banco de dados..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma migrate deploy

# Gerar Cliente Prisma (se necessário)
echo "🔧 Gerando Cliente Prisma..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma generate

echo ""
echo "✅ Implantação concluída com sucesso!"
echo ""
echo "📊 Status do Serviço:"
$DOCKER_COMPOSE_CMD ps
echo ""
echo "🌐 A aplicação está rodando em:"
echo "   - Local: http://localhost:3000"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 Comandos úteis:"
echo "   - Ver logs: $DOCKER_COMPOSE_CMD logs -f app"
echo "   - Parar serviços: $DOCKER_COMPOSE_CMD down"
echo "   - Reiniciar: $DOCKER_COMPOSE_CMD restart app"
echo ""
