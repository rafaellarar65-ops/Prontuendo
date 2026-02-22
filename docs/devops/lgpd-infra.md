# LGPD Infra Controls

## Encryption in transit
- Enforce TLS 1.2+ on Vercel, Railway, Supabase.
- Internal service-to-service calls via HTTPS/TLS where applicable.
- HSTS enabled at edge.

## Encryption at rest
- Supabase managed disk encryption.
- Railway volume encryption enabled.
- Object storage encrypted with provider-managed KMS.

## Backups
- Daily automated encrypted backups.
- Point-in-time recovery enabled.
- Quarterly restore drills documented in runbook.

## Access logs
- Log all clinical record reads/exports with actor, timestamp, tenant, IP.
- Store logs in immutable bucket with retention policy.

## Incident response plan
- Breach notification workflow aligned with LGPD timelines.
- Dedicated response squad + legal/privacy contacts.
- Forensic snapshot preservation process before remediation.
