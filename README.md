<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pyNjetdrdqmXXjm2SCFxjspQUw3uk58F

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Configuração de API (`VITE_API_BASE_URL`)

A aplicação frontend usa **apenas** a variável `VITE_API_BASE_URL` para definir a base das chamadas HTTP.

- **Formato esperado:** URL completa já com prefixo de versão, por exemplo `http://localhost:3001/api/v1`.
- **Desenvolvimento (Vite `dev`):** se `VITE_API_BASE_URL` não estiver definida, o fallback é `http://localhost:3001/api/v1`.
- **Produção (build/preview):** `VITE_API_BASE_URL` é obrigatória; sem ela a aplicação falha na inicialização.

Exemplos:

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3001/api/v1

# .env.production
VITE_API_BASE_URL=https://api.seu-dominio.com/api/v1
```

> Observação: não use `VITE_API_URL`. Essa variável legada foi descontinuada para evitar inconsistências entre ambientes.

## Docker notes

- The provided container image starts `nginx` in the foreground.
- If you see log lines like `signal 3 (SIGQUIT) received, shutting down` followed by many `gracefully shutting down` worker messages, that means the container received a stop signal and exited cleanly.
- To keep it running for local checks, start it in detached mode (`docker compose up -d`) and inspect logs with `docker compose logs -f`.
