# EndocrinoPront Pro API (NestJS)

Estrutura inicial do backend com módulos principais, guards, interceptors, Prisma, Swagger e validação global.

## Rodando localmente

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Swagger: `http://localhost:3001/docs`

## Railway: validar tenant e vínculo do usuário

No backend (Railway), confirme no banco que o tenant existe e que o usuário pertence a ele.

Exemplo SQL:

```sql
-- 1) Tenant existe
SELECT id, name
FROM "Tenant"
WHERE id = 'clitenant0000000000000001';

-- 2) Usuário pertence ao tenant
SELECT id, email, "tenantId", role, "isActive"
FROM "User"
WHERE "tenantId" = 'clitenant0000000000000001'
  AND lower(email) = lower('Rafaellarar65@gmail.com');
```

Se o resultado vier vazio, ajuste seed/migração ou o tenant enviado no frontend (`VITE_TENANT_ID`).

