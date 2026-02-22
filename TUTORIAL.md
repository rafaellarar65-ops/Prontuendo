# Prontuendo - Tutorial Passo a Passo

Sistema de prontuario eletronico endocrinologico com portal do paciente.

---

## Arquitetura do Sistema

```
Prontuendo/
  ├── src/              ← Frontend (React + Vite + TailwindCSS)
  ├── backend/          ← Backend (NestJS + Prisma + PostgreSQL)
  ├── prisma/           ← Schema do banco de dados (Prisma ORM)
  └── docker-compose.yml ← Infraestrutura (Postgres, Redis, MailHog)
```

| Componente  | Tecnologia                     | Porta  |
|------------|-------------------------------|--------|
| Frontend    | React 18 + Vite + TailwindCSS | 5173   |
| Backend API | NestJS 10 + Prisma 5          | 3000   |
| Banco       | PostgreSQL 16                 | 5432   |
| Cache       | Redis 7                       | 6379   |
| Email (dev) | MailHog                       | 8025   |
| Swagger     | NestJS Swagger                | 3000/docs |

---

## Opcao 1: Rodar com Docker Compose (Recomendado)

### Pre-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

### Passo 1: Clonar o repositorio

```bash
git clone https://github.com/rafaellarar65-ops/Prontuendo.git
cd Prontuendo
```

### Passo 2: Criar o arquivo .env

```bash
cp .env.example .env
```

Edite o `.env` se precisar alterar senhas/segredos. Para desenvolvimento local, os valores padrao funcionam.

### Passo 3: Subir todos os servicos

```bash
docker compose up -d
```

Isso inicia:
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379
- **MailHog** na porta 8025 (interface web de email)
- **Backend API** na porta 3000
- **Frontend** na porta 5173

### Passo 4: Rodar as migrations do banco

```bash
docker compose exec backend npx prisma migrate dev --name init
```

### Passo 5: Acessar o sistema

| Servico           | URL                          |
|------------------|------------------------------|
| Portal do Paciente | http://localhost:5173        |
| API Swagger Docs   | http://localhost:3000/docs   |
| MailHog (emails)   | http://localhost:8025        |
| Health Check       | http://localhost:3000/api/v1/health |

### Parar os servicos

```bash
docker compose down
```

Para remover os volumes (apaga dados do banco):
```bash
docker compose down -v
```

---

## Opcao 2: Rodar Localmente (Sem Docker)

### Pre-requisitos

- **Node.js** v20+ (`node --version`)
- **npm** v10+ (`npm --version`)
- **PostgreSQL** 16 rodando localmente
- **Redis** 7 rodando localmente (opcional, necessario para filas)

### Passo 1: Clonar e instalar dependencias

```bash
git clone https://github.com/rafaellarar65-ops/Prontuendo.git
cd Prontuendo

# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### Passo 2: Configurar o banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE prontuendo;
```

### Passo 3: Configurar variaveis de ambiente

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e ajuste o `DATABASE_URL` se necessario:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prontuendo?schema=public
```

**Frontend** (`.env` na raiz):
```bash
cp .env.example .env
```

### Passo 4: Gerar o Prisma Client e rodar migrations

```bash
cd backend
npx prisma generate --schema=../prisma/schema.prisma
npx prisma migrate dev --schema=../prisma/schema.prisma --name init
cd ..
```

Isso cria todas as tabelas no banco de dados.

### Passo 5: Iniciar o backend

```bash
cd backend
npm run start:dev
```

O backend inicia em **http://localhost:3000**.
Swagger docs em **http://localhost:3000/docs**.

### Passo 6: Iniciar o frontend (em outro terminal)

```bash
# Na raiz do projeto
npm run dev
```

O frontend inicia em **http://localhost:5173**.

---

## Criar o Primeiro Usuario (Seed)

Apos o sistema estar rodando, registre um usuario via API:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "email": "medico@clinica.com",
    "password": "SenhaForte123!",
    "fullName": "Dr. Rafael Lara",
    "role": "MEDICO"
  }'
```

A resposta contera o `accessToken` para usar nas demais chamadas da API.

### Fazer login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "email": "medico@clinica.com",
    "password": "SenhaForte123!"
  }'
```

---

## Endpoints Principais da API

Todos os endpoints possuem prefixo `/api/v1` e requerem `Authorization: Bearer <token>` (exceto login/register).

| Metodo | Endpoint                      | Descricao                    |
|--------|-------------------------------|------------------------------|
| POST   | /auth/register                | Registrar usuario            |
| POST   | /auth/login                   | Login                        |
| POST   | /auth/refresh                 | Renovar token                |
| GET    | /patients                     | Listar pacientes             |
| POST   | /patients                     | Criar paciente               |
| GET    | /consultations                | Listar consultas             |
| POST   | /consultations                | Criar consulta               |
| PATCH  | /consultations/:id/autosave   | Autosave da consulta         |
| POST   | /consultations/:id/finalize   | Finalizar consulta           |
| GET    | /health                       | Health check                 |

Documentacao completa no Swagger: **http://localhost:3000/docs**

---

## Estrutura das Roles (Perfis)

| Role      | Descricao                    |
|-----------|------------------------------|
| MEDICO    | Medico - acesso total        |
| RECEPCAO  | Recepcionista                |
| ADMIN     | Administrador do sistema     |
| PATIENT   | Paciente (portal)            |

---

## Rodar os Testes

### Testes do Frontend

```bash
# Na raiz do projeto
npm test              # Roda uma vez
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Testes do Backend

```bash
cd backend
npm test              # Roda uma vez
npm run test:watch    # Modo watch
```

### Type-check (sem executar)

```bash
# Frontend
npm run typecheck

# Backend
cd backend
npm run typecheck
```

---

## Comandos Uteis

```bash
# Verificar saude da API
curl http://localhost:3000/api/v1/health

# Resetar o banco (cuidado: apaga tudo!)
cd backend
npx prisma migrate reset --schema=../prisma/schema.prisma

# Abrir o Prisma Studio (interface visual do banco)
cd backend
npx prisma studio --schema=../prisma/schema.prisma

# Build de producao do frontend
npm run build

# Build de producao do backend
cd backend
npm run build
```

---

## Solucao de Problemas

### "Cannot find module '@prisma/client'"
```bash
cd backend
npx prisma generate --schema=../prisma/schema.prisma
```

### "Connection refused" no banco
Verifique se o PostgreSQL esta rodando:
```bash
# Com Docker
docker compose ps

# Local
pg_isready
```

### Porta ja em uso
```bash
# Verificar quem esta usando a porta
lsof -i :3000
lsof -i :5173
```

### Limpar tudo e recomecar
```bash
# Docker
docker compose down -v
docker compose up -d --build

# Local
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
```
