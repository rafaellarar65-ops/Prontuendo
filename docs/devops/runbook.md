# Runbook — EndocrinoPront Pro

## Deploy (zero downtime)
1. Merge PR into `main`.
2. GitHub Actions `CD` runs migrations first (`prisma migrate deploy`).
3. Vercel deploys both frontends with immutable build artifacts.
4. Railway deploys backend with rolling replacement.
5. Validate:
   - `/health` on backend
   - Doctor and Patient login screens
   - Error rate < 1% in Sentry

## Rollback
1. Vercel: promote previous stable deployment.
2. Railway: rollback to previous release.
3. If migration is incompatible, run down migration or restore backup snapshot.
4. Announce status in incident channel and update status page.

## Restore (database)
1. Create PITR restore in Supabase.
2. Restore to isolated project first.
3. Run integrity checks (row counts, critical tenant data, auth tables).
4. Redirect production only after checks pass.

## Incident response
1. Triage severity (SEV1–SEV3).
2. Assign Incident Commander.
3. Freeze deployments.
4. Gather timeline from logs/metrics/traces.
5. Mitigate and recover.
6. Publish postmortem in 48h with corrective actions.
