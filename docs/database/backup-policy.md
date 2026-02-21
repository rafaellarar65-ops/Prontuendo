# Backup & Disaster Recovery Policy

## Objetivos
- **RPO:** < 1 hora
- **RTO:** < 4 horas
- **Retenção de prontuário:** 20 anos (CFM 1.821/2007)

## Estratégia
1. **PITR contínuo** no Supabase com WAL archiving.
2. **Snapshot diário completo** + retenção de 90 dias para restauração rápida.
3. **Snapshot mensal de compliance** com retenção de 20 anos (armazenamento frio).
4. Cópia offsite em região secundária.

## Testes de restauração
- Exercício mensal de restore parcial (tenant único).
- Exercício trimestral de DR completo (ambiente isolado).
- Evidências auditáveis em repositório de compliance.

## Segurança
- Backups criptografados em repouso (AES-256) e em trânsito (TLS 1.2+).
- Controle de acesso por MFA + least privilege.
- Chaves com rotação periódica.
