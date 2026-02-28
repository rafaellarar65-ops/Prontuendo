# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN if command -v npm >/dev/null 2>&1; then \
      npm install; \
    elif [ -f /usr/local/lib/node_modules/npm/bin/npm-cli.js ]; then \
      node /usr/local/lib/node_modules/npm/bin/npm-cli.js install; \
    else \
      echo "npm executable not found in Node image" >&2; \
      exit 1; \
    fi

FROM deps AS build
COPY . .
RUN node --run build

FROM nginx:1.27-alpine AS runtime
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["nginx", "-g", "daemon off;"]
