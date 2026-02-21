# Encryption Configuration (LGPD)

## Campos obrigatórios para criptografia
1. `Diagnosis.diagnosisText` (diagnósticos clínicos)
2. `SOAPRecord.assessment` e `SOAPRecord.plan` (observações + plano terapêutico)
3. `Consultation.aiSummary` e notas clínicas sensíveis
4. Campos livres (`MedicalDocument.contentJson`) quando armazenarem conteúdo clínico completo

## Estratégia recomendada
- **Padrão:** criptografia em nível de aplicação (NestJS) com envelope encryption + KMS.
- **Complemento no banco:** `pgcrypto` (`pgp_sym_encrypt`/`pgp_sym_decrypt`) para trilhas legadas e exportações controladas.
- **Chaves por tenant:** derivação por `tenantId` e rotação semestral.

## Implementação híbrida
- Armazenar versão da chave em coluna (`key_version`) para recriptografia gradual.
- Nunca persistir chave em texto no banco; usar secret manager (Supabase Vault/KMS externo).
- Mascaramento obrigatório em logs (`AuditLog`, `AIInteractionLog`).

## Controles
- RLS + criptografia + trilha de acesso (`AccessLog`) para dados sensíveis.
- Política de acesso mínimo por papel (médico/recepção/paciente).
