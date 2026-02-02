# Portal NFS-e - Feitosa Soluções Tecnológicas

Sistema completo de gestão empresarial com emissão de NFS-e, gestão financeira, recibos e mais.

## 🚀 Funcionalidades

- **Emissão NFS-e**: Sistema integrado com a API Nacional de NFS-e
- **Gestão Financeira**: Cobranças, recibos e controle de despesas
- **Cálculo de Lucro**: Dashboard com receitas, despesas e lucro líquido
- **Assinatura Digital**: Integração ICP-Brasil para PDFs assinados
- **Portal do Cliente**: Área exclusiva para clientes acessarem documentos
- **Cadastro de Serviços**: Gestão de serviços com código LC 116

## 📦 Tecnologias

- **Frontend/Backend**: Next.js 16 (App Router)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js
- **PDF**: PDFKit + @signpdf
- **Estilo**: CSS Moderno com variáveis

## 🐳 Deploy com Docker

```bash
# Configurar ambiente
cp .env.production.example .env.production
# Edite com suas credenciais

# Iniciar serviços
docker-compose up -d

# Executar migrations
docker-compose exec app npx prisma migrate deploy
```

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── admin/          # Painel administrativo
│   ├── api/            # Rotas da API
│   ├── portal/         # Portal do cliente
│   └── login/          # Autenticação
├── lib/                # Utilitários e serviços
└── components/         # Componentes React
```

## 🔒 Variáveis de Ambiente

Consulte `.env.production.example` para a lista completa de variáveis necessárias.

## 📄 Licença

Propriedade de Feitosa Soluções Tecnológicas.
