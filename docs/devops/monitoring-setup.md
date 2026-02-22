# Monitoring Setup

## Sentry
- Enable Sentry for frontend and backend.
- Release tagging by commit SHA.
- Alerts:
  - New issue in auth, payments, medical records flows.
  - Error rate spike > 2% for 5m.

## Uptime monitoring
- Probe endpoints every 30s:
  - Frontend doctor URL
  - Frontend patient URL
  - Backend `/health`
- Alert channels: PagerDuty + Slack.

## Metrics
- Backend:
  - p95 latency
  - request throughput
  - 5xx rate
  - queue depth (BullMQ)
- Infrastructure:
  - Postgres connections, CPU, storage growth
  - Redis memory usage / evictions

## Logs
- Structured JSON logs with request-id and tenant-id.
- Retention: 180 days for audit-sensitive events.
- Immutable audit stream for access to clinical records.
