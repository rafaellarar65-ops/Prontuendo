# EndocrinoPront Pro — Master Test Plan (QA / Segurança / Compliance)

## 1) Objetivo e criticidade
Validar funcionalidade clínica, segurança, conformidade LGPD e rastreabilidade legal do prontuário eletrônico em cenário real de produção controlada.

## 2) Escopo por módulo
- **Auth**: login médico/paciente, MFA, refresh, expiração e revogação de sessão.
- **RBAC**: segregação por perfil (MEDICO, RECEPCAO, PACIENTE, ADMIN).
- **Pacientes**: cadastro, atualização, histórico e timeline.
- **Consultas**: SOAP completo, auto-save, assinatura digital, versionamento.
- **Bioimpedância**: upload, extração IA, validação humana, evolução, PDF.
- **Glicemia**: registro no portal paciente e visualização no prontuário médico.
- **Exames**: upload, metadados, vinculação ao paciente, retenção.
- **Documentos**: geração por templates (prescrição, atestado, laudo).
- **Templates**: criação, edição, publicação, versionamento.
- **Protocolos**: consenso clínico e sugestão assistida por IA.
- **Agenda**: criação/edição de consultas, concorrência e conflitos.
- **IA**: extrações, resumo clínico, guardrails e explicabilidade mínima.
- **Portal paciente**: perfil, documentos, questionário e privacidade.
- **LGPD**: consentimento, minimização, trilha de auditoria, isolamento tenant.

## 3) Estratégia
- **Pirâmide**: unitários + integração + E2E + segurança + carga + acessibilidade.
- **Testes independentes**: dados únicos por teste (`makeUniqueId`) e sem dependência de ordem.
- **POM**: Page Objects para login, consulta e bioimpedância.
- **Blockers de release**: falha de segurança/compliance, violação critical/serious de acessibilidade, perda de integridade/auditoria.
- **Meta CI**: suíte crítica em até 10 minutos (sharding + paralelismo + smoke obrigatório).

## 4) Matriz de cobertura (resumo)
| Módulo | Casos principais | Tipo | Severidade |
|---|---|---|---|
| Auth | Login, MFA, refresh, logout, sessão expirada | E2E | Crítica |
| RBAC | Recepção sem acesso clínico; paciente isolado | Segurança | Crítica |
| Consultas | SOAP, auto-save, assinatura, versões | E2E | Crítica |
| Bioimpedância | Upload→IA→confirmação→dashboard→PDF | E2E | Alta |
| Glicemia | Entrada no portal + leitura médica | E2E | Alta |
| Documentos | Templates oficiais com emissão PDF | E2E | Alta |
| LGPD | consentimento, criptografia, audit trail, tenant | Segurança | Crítica |
| SBIS NGS1 | autenticação forte, imutabilidade, integridade | Segurança | Crítica |
| Carga | 50 médicos + 200 pacientes + concorrência | Performance | Alta |
| Acessibilidade | 2 frontends sem serious/critical | A11y | Alta |

## 5) Critérios de entrada/saída
### Entrada
- Ambientes de QA com dados mascarados.
- Chaves e segredos de integração configurados.
- Roles provisionadas por tenant de teste.

### Saída
- 100% dos testes críticos aprovados.
- 0 falhas blocker em segurança/compliance.
- p95 API dentro de SLO sob carga acordada.
- 0 violações axe-core serious/critical.

## 6) Dados de teste e isolamento
- Cada teste cria IDs únicos por execução (paciente, consulta, documento, consentimento).
- Não reutilizar usuários cross-suite quando houver estado mutável sem cleanup.
- Cleanup por API após cenário, sempre que possível.

## 7) Riscos e mitigação
- **Risco legal**: auditoria incompleta → bloquear release e abrir incidente de compliance.
- **Risco clínico**: versionamento inconsistente → rollback e freeze de deploy.
- **Risco segurança**: vazamento cross-tenant → severidade máxima e rotação de credenciais.

## 8) Execução CI/CD sugerida
1. Smoke de autenticação + RBAC + consulta (gate rápido).
2. Suíte E2E funcional paralela.
3. Segurança LGPD/SBIS NGS1.
4. Acessibilidade total.
5. Carga k6 em janela dedicada (pré-release).

## 9) Evidências e auditoria de testes
- Relatórios Playwright (trace/screenshot/video em falhas).
- Relatórios k6 e thresholds versionados.
- Evidências de audit trail e hash de integridade arquivadas por release.
