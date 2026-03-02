# ROADMAP — EndocrinoPront Pro

## P0 — Crítico (Próximo sprint)
- [ ] **Adicionar botão criar bioimpedância no perfil do paciente** — Só Exames e Glicemia têm modal de criação. Bioimpedância mostra dados mas sem botão de adicionar registro via UI.

## P1 — Alta Prioridade

### Portal do Paciente PWA
- [ ] Manifest.json + Service Worker (offline first)
- [ ] Push notifications para lembretes de glicemia

### Consulta
- [ ] Melhorar prompt de IA para diagnóstico diferencial (mais contexto de resultados laboratoriais)
- [ ] Histórico de versões de autosave no editor

### Templates
- [ ] Variáveis dinâmicas: `{nome_paciente}`, `{data_consulta}`, `{crm_medico}`
- [ ] Exportação para PDF

## P2 — Média Prioridade

### Segurança e Multi-tenancy
- [ ] Row Level Security (RLS) no Neon/PostgreSQL
- [ ] MFA com Supabase Auth (opcional — substituir JWT atual)

### Assinatura Digital
- [ ] Integrar VIDaaS para assinatura ICP-Brasil nas consultas finalizadas
- [ ] Chamar `integration_playbook_expert_v2` quando pronto

## P3 — Backlog / Futuro

- [ ] CI/CD pipeline (GitHub Actions → deploy automático)
- [ ] Dashboard de analytics para o médico (evolução glicemia/peso/bioimpedância por paciente)
- [ ] Notificações por e-mail/SMS (Twilio / Resend)
- [ ] App mobile nativo (React Native)
- [ ] Integração com TISS/TUSS (convênios)
