# Prontuendo — Especificação UI/UX do MVP (Web EHR)

> Idioma da interface: **Português (Brasil)**  
> Contexto técnico: **Next.js + API REST/JSON + PostgreSQL**  
> Foco: **velocidade clínica, segurança, consistência e implementabilidade**.

---

## 0) Leitura crítica dos prints enviados (Cadastro de Paciente)

### Intenção percebida
- Tela rica em dados cadastrais e clínico-administrativos, com abas por domínio (Cadastro, Saúde, Atendimentos, Anexos, Aceites, Mensagens, Histórico).
- Uso de blocos expansíveis para reduzir poluição visual (ex.: Dados socioeconômicos, Urgências, Outras informações).
- Ações diretas úteis no contexto (WhatsApp, copiar e-mail, anexar foto, convidar para área do paciente).

### Oportunidades objetivas de melhoria (sem complicar)
1. **Agrupar por prioridade de uso**: deixar acima da dobra apenas os campos realmente necessários para primeira consulta/agendamento.
2. **Padronizar obrigatoriedade**: usar asterisco e mensagem de erro consistente (hoje há variação de estilo).
3. **Reduzir repetição de “Salvar”**: manter CTA primário fixo (rodapé sticky) + autosave de rascunho em seções não críticas.
4. **Diminuir ambiguidade de toggles**: “Interditado”, “Possui convênio”, “Situação de rua” com labels de estado explícito e ajuda contextual.
5. **Melhorar hierarquia visual**: título da seção > subtítulo > campos, reduzindo ruído de bordas e ícones.
6. **Consolidar metadados do paciente** (idade, sexo, CPF, prontuário) em um “patient header” fixo.
7. **Compatibilizar densidade com legibilidade**: grid 12 col + alinhamento rígido de labels e inputs.
8. **Ações perigosas isoladas**: “Excluir” sempre separada, com confirmação em 2 etapas + motivo opcional.

---

## A) Princípios de UX (guia do produto)

1. **Rapidez clínica primeiro**: reduzir cliques/teclas para tarefas frequentes (agendar, iniciar consulta, prescrever).
2. **Segurança por padrão**: bloquear acessos indevidos e registrar ações sensíveis automaticamente.
3. **Consistência operacional**: mesmos padrões de componente/validação/microcopy em todo o sistema.
4. **Densidade útil, não poluição**: mostrar muita informação com ordem e escaneabilidade.
5. **Prevenção de erro > correção**: máscaras, validações em tempo real e confirmações para ações críticas.
6. **Rastreabilidade total**: toda alteração relevante com autoria, data/hora e contexto.
7. **Progressive disclosure**: detalhes avançados em acordeões/drawers, preservando foco na tarefa principal.
8. **Acessibilidade prática**: foco visível, contraste adequado, navegação por teclado.
9. **Resiliência de fluxo**: autosave, recuperação de rascunho e proteção contra perda de dados.
10. **Design implementável**: componentes simples, previsíveis e reutilizáveis em Next.js.

---

## B) Arquitetura de navegação (IA)

## 1. Mapa principal (Sidebar)
- Dashboard
- Agenda
- Pacientes
- Consultas
- Prescrições
- Documentos (Atestados / Solicitações)
- Auditoria
- Configurações

## 2. Topbar global
- Busca global (paciente, CPF, prontuário, telefone)
- Atalhos: Novo paciente, Nova consulta, Nova prescrição
- Notificações
- Perfil/sessão

## 3. Rotas/páginas (MVP)
- `/login`
- `/recuperar-senha`
- `/dashboard`
- `/agenda` (visões dia/semana)
- `/pacientes`
- `/pacientes/novo`
- `/pacientes/:id` (tabs: cadastro, saúde, atendimentos, anexos, aceites, mensagens, histórico)
- `/consultas/:encounterId`
- `/prescricoes/:id` e `/prescricoes/nova?encounterId=...`
- `/atestados/novo?encounterId=...`
- `/configuracoes/usuarios`
- `/configuracoes/permissoes`
- `/configuracoes/templates`
- `/auditoria`

## 4. Permissões por perfil (RBAC inicial)

| Tela/ação | Médico | Secretária |
|---|---:|---:|
| Dashboard | Ver completo | Ver operacional |
| Agenda | CRUD completo | CRUD completo |
| Pacientes (lista/cadastro) | Ver/editar | Ver/editar cadastro |
| Saúde / evolução / CID / medicação | Completo | Oculto |
| Consulta (encounter) | Completo | Sem acesso |
| Prescrição / exames / atestado | Criar/assinar (futuro) | Rascunho administrativo (opcional) |
| Anexos clínicos | Ver/upload | Upload administrativo limitado |
| Configuração de usuários/permissões | Opcional (admin médico) | Sem acesso |
| Auditoria | Ver | Sem acesso (ou somente próprios acessos) |

**Regra de visibilidade**: menus e CTAs não permitidos devem **sumir da UI**; acesso direto por URL retorna tela “Sem permissão”.

## 5. Estados globais
- **Loading**: skeleton por bloco (não spinner global bloqueante em telas longas).
- **Empty state**: mensagem + CTA (“Nenhum anexo ainda” + “Adicionar anexo”).
- **Erro**: bloco inline com “Tentar novamente” + código amigável.
- **Sem permissão**: página dedicada com orientação e botão “Voltar ao Dashboard”.

---

## C) Wireframes textuais por tela (MVP)

## 1) Login / Recuperação
**Layout**: card central (logo, formulário, ações).  
**Componentes**: Input, Button, Alert inline.  
**Campos**: e-mail, senha; recuperação por e-mail.  
**Validações**: e-mail válido, senha obrigatória.  
**CTAs**: Entrar (primário), Esqueci senha (secundário).  
**Estados**: loading submit, credencial inválida, bloqueio por tentativas.

## 2) Dashboard
**Layout**: 3 blocos horizontais + lista de tarefas.  
- Bloco 1: resumo do dia (consultas, encaixes, no-show)
- Bloco 2: próximos pacientes
- Bloco 3: pendências (rascunhos, exames sem revisão)

**Componentes**: cards, tabela compacta, badges de status.  
**CTAs**: Iniciar consulta, Ver agenda, Novo paciente.

## 3) Agenda (dia/semana)
**Layout**: header com filtros + grade temporal + painel lateral de detalhes.  
**Componentes**: calendar grid, drawer de agendamento, modal confirmação, badges status.  
**Regras**:
- Drag/drop para remarcação com confirmação.
- Status: confirmado, aguardando, em atendimento, finalizado, no-show, cancelado.
- Encaixe destacado visualmente.

## 4) Pacientes (lista)
**Layout**: toolbar + tabela + paginação.  
**Componentes**: busca, filtros (tags/status/convênio), table, chips.  
**CTAs**: Novo paciente, Ver perfil.  
**Estados**: sem resultados (sugestão de limpar filtros).

## 5) Paciente (perfil com tabs)
**Layout-base**:
- Header fixo: nome, idade, sexo, CPF mascarado, prontuário, contatos rápidos.
- Tabs: Cadastro | Saúde | Atendimentos | Anexos | Aceites | Mensagens | Histórico.
- Rodapé sticky: Salvar / Cancelar alterações.

### 5.1 Aba Cadastro (baseado nos prints)
**Blocos**:
1. Dados essenciais (nome, nascimento, CPF, sexo, convênio)
2. Contatos
3. Endereço
4. Responsáveis (lista + modal)
5. Dados socioeconômicos (accordion)
6. Urgências (accordion)
7. Outras informações (accordion)
8. Observações + status + ações finais

**Componentes**: form grid, accordion, modal contato responsável, dropdown com autocomplete, upload foto.  
**Regras**:
- Primeiro salvamento exige mínimo obrigatório.
- Campos avançados opcionais e colapsados por padrão.
- Autosave a cada 15s (rascunho) quando houver edição.
- “Excluir” só para perfis autorizados + modal de confirmação forte.

### 5.2 Aba Saúde (expandida com base nos novos prints)
**Layout**: sub-sidebar interna à esquerda com 3 subabas: **Saúde geral**, **Saúde mental**, **Histórico de vacinação**.  

#### 5.2.1 Saúde geral
**Blocos**:
1. Diagnósticos (chips + lista estruturada)
2. Medicamentos clínicos utilizados
3. Alergias e intolerâncias
4. Órteses e próteses

**Componentes**: chips removíveis, accordion por bloco, botão “Adicionar ...”, tabela compacta opcional para itens detalhados.  
**Regras**:
- Diagnósticos rápidos via chips (macro-categorias) + detalhamento em lista (CID + descrição + status).
- “Outros problemas de saúde” abre área expandida para itens não mapeados em chips.
- Botão Salvar único no rodapé da página (evitar múltiplos pontos de persistência).

#### 5.2.2 Saúde mental
**Blocos**:
1. Contexto assistencial (já consultou especialistas? já consultou outros profissionais? internação psiquiátrica prévia?)
2. Diagnósticos de saúde mental
3. Medicamentos psicotrópicos utilizados

**Componentes**: checkbox group para histórico assistencial, chips diagnósticos, modal “Cadastrar Diagnóstico”, lista detalhada de diagnósticos com ação de editar.  
**Regras**:
- Estado do diagnóstico deve ser explícito: **Suspeita** ou **Confirmado**.
- Lista detalhada exibe: código CID, descrição, situação e método (clínico/relato/teste).
- Ao salvar diagnóstico, atualizar imediatamente chips + lista (consistência visual instantânea).

#### 5.2.3 Histórico de vacinação
**Blocos**:
1. Lista de vacinas aplicadas
2. Modal “Vacinas” para inclusão

**Componentes**: autocomplete de vacina (catálogo extenso com busca), toggle “imunobiológico administrado anteriormente?”, anexo opcional (comprovante), tabela/histórico de aplicações.  
**Regras**:
- Autocomplete deve suportar grande volume com virtualização/paginação de opções.
- Exigir ao menos “Vacina” + “Data de aplicação” (quando houver esse campo na versão final).
- Permitir anexar comprovante (PDF/JPG/PNG) e visualizar em preview.

#### 5.2.4 Modal “Cadastrar Diagnóstico” (especificação)
**Campos mínimos**:
- Tipo de código: CID-10 (select)
- Diagnóstico (autocomplete)
- Como foi realizado: Relato do paciente | Clínico | Teste neuropsicológico | MINI | SCID
- Situação: Suspeita | Confirmado
- Observações
- Status do registro
- Data do registro

**Campos avançados (accordion “Especificadores”)**:
- Grau de severidade (leve/moderado/grave)
- Especificadores clínicos (chips)
- Início / Data da realização / Fim
- Tipo

**Validações**:
- Diagnóstico obrigatório.
- Situação obrigatória.
- Data inválida deve bloquear inclusão.

### 5.3 Aba Atendimentos (expandida com Agendar Atendimento + Pagamento)
**Layout**:
- Sidebar interna com módulos: Atendimentos, Prescrições, Atestados, Encaminhamentos, Relatórios, Exames, Procedimentos, Escalas, Sinais, Medidas, Recibos, Auxílio diagnóstico, Diários, Calculadoras.
- Área principal com tab “Lista de atendimentos”.
- Ação primária “Novo Atendimento” abre modal **Agendar Atendimento**.

#### 5.3.1 Lista de atendimentos
**Componentes**: toolbar com “Novo Atendimento”, botão atualizar, filtro avançado, tabela/lista cronológica.  
**Estados**:
- Vazio: “Nenhum item registrado” + CTA Novo Atendimento.
- Carregando: skeleton de lista.
- Erro: alerta inline com reprocessar.

**Regras**:
- “Novo Atendimento” inicia Encounter em rascunho quando clicar em “Iniciar atendimento”.
- Filtros por período, tipo e status.
- Itens finalizados abrem em modo leitura, com ação de retificação auditada.

#### 5.3.2 Modal “Agendar Atendimento”
**Abas internas**:
- **Agenda** (fluxo principal para consulta)
- **Tarefa** (registro operacional não clínico)
- **Financeiro** (resumo rápido com atalho para modal de pagamento)

**Blocos de campos (aba Agenda)**:
1. Paciente (pré-preenchido quando origem é perfil do paciente)
2. Serviço
3. Valor
4. Agendamento (data/hora)
5. Tempo previsto
6. Modalidade (Presencial / On-line)
7. Recorrência
8. Contratação (Particular/Convênio/SUS/Voluntário)
9. Botão “Pagamento” (abre modal financeira)
10. Profissional
11. Especialidade
12. Status (ex.: Agendado)
13. Mais opções (select pesquisável de tipos/procedimentos rápidos)
14. Observações

**Barra de ações (rodapé do modal)**:
- **Voltar para agendamento** (retorna ao fluxo de agenda sem descartar automaticamente)
- **Cancelar**
- **Salvar** (persistir alterações sem iniciar)
- **Salvar e fechar** (persiste e fecha modal)
- **Iniciar atendimento** (abre confirmação antes de criar encounter/abrir atendimento)

**Regras de comportamento**:
- “Iniciar atendimento” só habilita com campos mínimos válidos (paciente, serviço, data/hora, profissional).
- “Salvar” mantém apenas o agendamento sem iniciar encounter.
- Quando modalidade = On-line, exibir campo/link de sala virtual (preparado para fase futura).
- Recorrência abre lista extensa de presets (nunca, diária, dias alternados, semanal, quinzenal, mensal e personalizados) com busca rápida.
- Recorrência personalizada deve permitir: intervalo, unidade (dias/semanas/meses), dias da semana e condição de término (data fixa ou número de ocorrências).
- Alterar contratação deve refletir em regras de pagamento e documentos fiscais.
- Botão “Pagamento” deve mostrar indicador visual quando houver lançamento parcial/completo (ex.: badge com total lançado).
- Se valor do atendimento for alterado após lançamento financeiro, marcar o pagamento como “revisar” até nova reconciliação.
- Exibir ação de **Reagendar** quando o atendimento já existir, preservando histórico do horário anterior e registrando motivo da mudança.
- Validar conflito de agenda (profissional/paciente) em tempo real e bloquear salvar sem ação de override autorizada.
- Campo “Mais opções” deve suportar busca incremental em catálogo longo (procedimentos/consultas por especialidade) com scroll virtual e seleção única por item.
- Ao selecionar item de “Mais opções”, exibir resumo em linha (nome + categoria + marcador de origem) com ação de limpar.
- Ação “Salvar” mantém modal aberto e exibe toast de sucesso (“Dados salvos com sucesso.”).
- Ação “Salvar e fechar” persiste e fecha o modal, retornando para Agenda com refresh pontual do slot afetado.
- Ao clicar em “Iniciar atendimento”, abrir modal de confirmação: “Deseja realmente iniciar este atendimento?”.
- Confirmando início, registrar status em atendimento e mostrar estado de carregamento (spinner inline) até concluir sincronização.

#### 5.3.3 Modal “Pagamento” (subfluxo do atendimento)
**Objetivo**: registrar composição financeira do atendimento sem sair do contexto clínico-operacional.

**Campos principais**:
- Forma de contratação (readonly vindo do agendamento)
- Valor normal
- Valor total cobrado
- Linhas de pagamento (forma, tipo pagador, valor, parcela, comprovante, quitado/pago)
- Emissão de documento: Recibo / Nota Fiscal (+ número da nota quando ativo)
- Ação “+ Adicionar forma de pagamento” para composição multi-linha

**Regras e validações**:
- Somatório das linhas deve bater com “Valor total cobrado”.
- Exibir erro explícito quando houver divergência (“Difere do total lançado!”).
- Botão “Adicionar forma de pagamento” cria nova linha parcial.
- Campo “Forma de pagamento” deve ser catálogo pesquisável (dinheiro, pix, débito, crédito, transferência, boleto e outros configuráveis).
- Quando forma = cartão de crédito, exibir “parcelas” e opção de taxa/juros configurável.
- Upload de comprovante por linha (quando aplicável).
- Totais no rodapé: **Total lançado** e **Total quitado**.
- Não permitir salvar com linha inválida obrigatória (forma de pagamento/valor).
- Ao marcar linha como “Não pago”, exibir modal de confirmação antes de salvar: “Confirma valor no pago? Sua planilha financeira receberá esse apontamento.”
- Permitir remover linha de pagamento com ícone de exclusão, desde que ao menos uma linha válida permaneça quando houver valor lançado.

**Microinterações**:
- Highlight de erro em vermelho no bloco divergente.
- Toast de sucesso ao salvar pagamento.
- Tooltip em ícones ambíguos (ex.: comprovante).
- Badge “Pago/Não pago” por linha para leitura rápida do status financeiro.

### 5.3.4 Submódulo Prescrições (dentro de Atendimentos)
**Tela de lista**:
- CTA “Nova Prescrição”, atualizar, filtro.
- Lista cronológica com badges de medicamento principal e status (rascunho/assinado).
- Ações rápidas por item (ver, copiar, imprimir, compartilhar, excluir conforme RBAC).

**Tela de edição**:
- Modos: Prescrição inteligente e Prescrição tradicional.
- Inclusão por modal “Inserir Medicamento”.
- Bloco de ações com salvar/finalizar/assinar/finalizar e imprimir.

**Integrações e regras**:
- Exibir painel “Medicamentos em uso” para evitar duplicidade terapêutica.
- Quando houver repetição, exigir confirmação específica e assinatura individual por data.
- Após assinatura concluída, bloquear edição direta e habilitar somente retificação auditada.

### 5.3.5 Submódulo Relatórios (dentro de Atendimentos)
**Tela de lista**:
- CTA “Novo Relatório”, atualizar e filtro.
- Lista de relatórios por data/status (rascunho/finalizado/assinado).
- Estado vazio com mensagem “Nenhum item registrado!”.

**Tela “Novo Relatório”**:
- Campo principal “Título do relatório” com modelos pré-definidos e entrada livre.
- Editor de conteúdo textual do relatório.
- Data do documento com atalho “Agora”.
- Barra de ações padrão de documentos: Fechar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir.

**Regras**:
- Título obrigatório para finalização.
- Ao finalizar, bloquear edição direta e liberar apenas retificação auditada.
- Assinatura e impressão seguem o mesmo padrão de atestado/encaminhamento.

### 5.3.6 Submódulo Exames (primeira parte)
**Tela de lista de exames**:
- CTAs: “Nova solicitação de exame” e “Novo resultado”.
- Filtros por período (data inicial/final) e tipo.
- Lista cronológica de solicitações/resultados.
- Estado vazio com mensagem “Nenhum item registrado!”.

**Tela “Nova Solicitação de Exame”**:
- Bloco de seleção de exames pré-definidos por abas de categoria:
  - Gerais, Alergia, Cardiologia, Genética, Ginecologia, Hormonal, Imagem, Microbiologia, Neonatologia, Pneumologia, Psicofármacos, Reumatologia, Toxicológico, Vitaminas e Outros.
- Lista de checkboxes por categoria para marcação múltipla.
- Campo “Texto livre” para exames não encontrados.
- Data da solicitação com atalho “Agora”.
- Barra de ações: Fechar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir.

**Tela “Novo Resultado de Exame”**:
- Campo “Exame” (select/autocomplete) vinculado ao pedido existente quando houver.
- Campo “Observações”.
- Upload de anexo de resultado (imagem/PDF).
- **Campo/ação “Ler com IA”** para enviar imagem/PDF e extrair texto/valores para o sistema.
- Data da coleta.
- Lista interna de resultados adicionados + anexo de resultado geral.
- Campo “Conclusão ou parecer diagnóstico”.
- Data de registro com atalho “Agora”.
- Ações: Cancelar resultado, Incluir resultado, Fechar, Salvar, Finalizar.

**Regras de UX**:
- Permitir multi-seleção de exames em categorias diferentes sem perda de estado ao trocar aba.
- Contador de exames selecionados visível (ex.: “8 exames selecionados”).
- “Finalizar” exige pelo menos 1 exame marcado OU texto livre preenchido.
- No “Novo Resultado”, “Incluir resultado” exige exame + anexo ou conclusão mínima.
- “Ler com IA” só aceita JPG/PNG/PDF e deve mostrar progresso + status (processando, concluído, erro).
- Resultado extraído por IA entra como rascunho editável, com marcação de origem “Lido por IA”.
- Assinatura digital segue fluxo comum de documentos clínicos.

### 5.3.7 Submódulo Escalas
**Tela de lista**:
- CTA “Nova Escala”, atualizar e filtro.
- Estado vazio padrão.

**Tela “Nova Escala”**:
- Campo de busca/seleção de escala (catálogo extenso, com rolagem e busca incremental).
- Renderização dinâmica do questionário (perguntas com radio/checkbox conforme escala).
- Bloco de resultado automático (“Responda todas as perguntas para obter o resultado”).
- Ação “Enviar escala” com canais: WhatsApp Web, WhatsApp API, E-mail, Copiar, Copiar Link.
- Data de registro com atalho “Agora”.
- Ações: Cancelar, Salvar, Imprimir.

**Regras**:
- Não calcular resultado enquanto houver perguntas obrigatórias sem resposta.
- Mostrar claramente quando a escala enviada ao paciente não terá vínculo automático com atendimento.
- Persistir respostas em rascunho durante preenchimento para evitar perda por navegação/timeout.

### 5.3.8 Submódulo Sinais vitais
**Tela de lista**:
- CTA “Adicionar Sinais vitais”, atualizar e filtro.
- Estado vazio padrão.

**Tela “Adicionar Sinais vitais”**:
- Pressão arterial (PAS/PAD + unidade), temperatura corporal, FC, FR, SaO2, glicemia capilar.
- Escala de dor visual.
- Nível de consciência (alerta/agitação/confusão/resposta à voz/resposta à dor/não responsivo).
- Escore de alerta (MEWS) calculado automaticamente.
- Observações + data do registro + ações Fechar/Salvar/Finalizar.

**Regras**:
- Calcular MEWS em tempo real conforme campos preenchidos.
- Destacar visualmente valores críticos e sugerir revisão antes de finalizar.

### 5.3.9 Submódulo Medidas antropométricas
**Tela de lista**:
- CTA “Adicionar Medidas Antropométricas”, atualizar e filtro.
- Estado vazio padrão.

**Tela “Adicionar Medidas Antropométricas”**:
- Peso e altura (com unidade configurável), cintura, quadril, circunferência abdominal.
- Cálculos automáticos: IMC, RCQ, superfície corpórea, obesidade central.
- Observações + data de registro + ações Fechar/Salvar/Finalizar.

**Regras**:
- Recalcular indicadores instantaneamente ao alterar peso/altura/cintura/quadril.
- Exibir classificação clínica associada (ex.: obesidade grau III) com semântica de cor discreta.

### 5.3.10 Submódulo Recibos
**Tela de lista**:
- CTA “Novo Recibo”, atualizar e filtro.
- Banner informativo regulatório (RFB/Receita Saúde) e aviso de escopo financeiro.
- Estado vazio padrão.

**Tela “Novo Recibo”**:
- Nome do paciente (pré-preenchido), CPF, nome do pagador, CPF do pagador, valor.
- Data do pagamento com atalho “Agora”.
- Ações: Cancelar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir.

**Regras**:
- Exibir mensagem fixa de compliance quando recibo emitido manualmente tiver limitação regulatória.
- CPF com máscara/validação e alerta de inconsistência.

### 5.3.11 Submódulo Auxílio diagnóstico
**Tela de lista**:
- CTA “Novo Diagnóstico”, lista de itens e bloco de insights de IA/pré-consulta.
- Sugestões de diagnósticos frequentes com ação rápida de inclusão.
- CTA contextual “Ir para prescrição”.

**Tela “Novo Diagnóstico/Diagnóstico”**:
- Campo CID + autocomplete de diagnóstico.
- Como foi realizado (relato, clínico, teste neuropsicológico, MINI, SCID).
- Situação (suspeita/confirmado), especificadores, observações, status e data.
- Blocos de apoio: sintomas do diagnóstico e fármacos indicados para o diagnóstico.
- Clique em fármaco abre drawer/modal de detalhe farmacológico (metabolização, interações, mecanismos).

**Regras**:
- Confirmar diagnóstico deve habilitar sugestões terapêuticas e trilha de decisão.
- Toda sugestão de IA deve ser explicável e nunca auto-confirmada sem ação humana.


### 5.3.12 Submódulo Procedimentos
**Tela de lista**:
- CTA “Novo Procedimento”, atualizar e filtro por tipo/status/período.
- Tabela com colunas: data, procedimento, profissional, valor, status de execução, vínculo com atendimento.
- Estado vazio padrão com orientação para cadastrar o primeiro procedimento.

**Tela “Novo Procedimento”**:
- Tipo de procedimento (autocomplete/catálogo interno).
- Lado/região anatômica (quando aplicável).
- Data/hora, profissional responsável e local de realização.
- Valor base, desconto e valor final.
- Observações clínicas e administrativas separadas.
- Ações: Fechar, Salvar, Finalizar, Finalizar e imprimir.

**Regras**:
- Procedimento finalizado não pode ser alterado sem retificação auditada.
- Procedimentos vinculados à cobrança devem sincronizar status com módulo financeiro/recibos.
- Exigir confirmação para cancelar procedimento já realizado.

### 5.3.13 Submódulo Diários
**Tela de lista**:
- CTA “Novo Diário”, atualizar e filtros por período, autor e tipo (clínico/administrativo).
- Timeline de registros com título, data/hora, autor e badge de privacidade.
- Busca textual por conteúdo com destaque de termos.

**Tela “Novo Diário”**:
- Tipo do diário: evolução livre, nota administrativa, devolutiva.
- Título opcional + editor de texto estruturado.
- Checkbox “Somente equipe clínica” para restringir visualização.
- Campo de referência opcional (consulta, exame, prescrição, procedimento).
- Ações: Fechar, Salvar rascunho, Finalizar.

**Regras**:
- Diário finalizado mantém versionamento (v1, v2...) em edições futuras.
- Registros restritos não aparecem para perfis sem permissão clínica.
- Busca respeita RBAC (não indexar conteúdo inacessível para o usuário).

### 5.3.14 Submódulo Calculadoras
**Tela de lista**:
- Grade de cards com calculadoras clínicas mais usadas (IMC, Cockcroft-Gault, CHA2DS2-VASc, etc.).
- Campo de busca por nome/sigla.
- Histórico recente de cálculos com atalho “Reutilizar dados”.

**Tela “Executar Calculadora”**:
- Formulário de parâmetros de entrada com ajuda contextual por campo.
- Resultado principal com faixa de interpretação (baixo/moderado/alto) e texto de apoio.
- Ações: Salvar no atendimento, Copiar resultado, Inserir na evolução.

**Regras**:
- Toda calculadora deve mostrar fórmula/referência clínica em tooltip ou drawer.
- Salvar resultado cria registro auditável com parâmetros utilizados.
- Não permitir conclusão sem parâmetros mínimos obrigatórios.

### 5.4 Aba Anexos
Dropzone + tabela de arquivos (tipo, data, origem, tamanho, autor). Preview em drawer.

### 5.5 Aba Aceites
Histórico de consentimentos (LGPD, termos), data/hora/IP/versão.

### 5.6 Aba Mensagens
Comunicações operacionais (convites, lembretes); sem chat clínico no MVP.

### 5.7 Aba Histórico
Audit trail focado no paciente (visualização resumida).

## 6) Tela de Consulta / Encounter
**Layout 3 colunas (desktop)**:
- Esquerda: resumo do paciente + sinais vitais + atalhos.
- Centro: Evolução (SOAP/livre), diagnóstico, conduta.
- Direita: anexos do encontro, prescrições rascunho, exames solicitados.

**CTAs principais**: Salvar rascunho, Finalizar consulta.  
**CTAs secundários**: Gerar prescrição, Gerar atestado, Solicitar exame.  
**Regras críticas**:
- Autosave contínuo (5–10s).
- Sair da tela: aviso “há alterações não sincronizadas”.
- Após finalizar: bloqueio de edição + ação “Retificar” com log.

## 7) Prescrição (expandida com base nos novos prints)

### 7.1 Lista de prescrições (no perfil do paciente)
**Layout**:
- Sidebar esquerda no módulo Atendimentos com item “Prescrições”.
- Header com CTA principal **Nova Prescrição**, ação **Atualizar** e filtro.
- Lista de prescrições por data com status (rascunho/assinada), medicamento principal em badge e ações por item.

**Ações por linha**:
- Ver detalhes
- Duplicar/repetir
- Imprimir/gerar documento
- Compartilhar (quando aplicável)
- Excluir (conforme permissão)

**Estado vazio**:
- “Nenhum item registrado!” + CTA “Nova Prescrição”.

### 7.2 Tela “Nova Prescrição”
**Layout**:
1. Cabeçalho com botão Voltar.
2. Seletor de modo: **Prescrição inteligente** | **Prescrição tradicional**.
3. Card/lista de medicamentos da prescrição em edição.
4. Data da prescrição + ação de repetição.
5. Barra de ações: Cancelar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir.
6. Blocos de apoio: Prescrições recentes, Fármacos indicados para cada diagnóstico, Medicamentos em uso.

**Regras**:
- “Finalizar” muda estado para pronto para assinatura.
- “Assinar” só habilita com prescrição finalizada e dados obrigatórios válidos.
- “Finalizar e imprimir” exige documento gerado sem erros de validação.

### 7.3 Modal “Inserir Medicamento”
**Campos observados/esperados**:
- Nome do medicamento (autocomplete)
- Tipo de receita (simples/controle especial, conforme catálogo)
- Dosagem
- Apresentação
- Quantidade (com controles + / -)
- Fracionamento (botão “Fracionar”)
- Via de aplicação (lista extensa)
- Posologia (frequência)
- Primeira dose (horário)
- Toggle “Ocultar horários”
- Duração do medicamento (cálculo automático e previsão de término)
- Observações (limite de caracteres)
- Opções extras: “Gerar em folha separada”, “Repetir”

**Regras de UX**:
- Autocomplete deve retornar nome comercial + princípio ativo.
- Alterar posologia/dose recalcula duração/previsão em tempo real.
- Via de aplicação e posologia devem usar catálogos padronizados para reduzir texto livre.

### 7.4 Visualização de impressão
**Objetivo**: pré-visualizar documento final (receita simples) antes de imprimir/assinar.  
**Conteúdo mínimo**:
- Identificação do paciente
- Lista de medicamentos e orientações
- Data de emissão
- Identificação do emitente (nome, CRM, endereço, contato)
- Área de carimbo/assinatura

### 7.5 Repetição de prescrição (compliance operacional)
**Comportamento**:
- Ao detectar repetição, exibir modal de confirmação com aviso regulatório.
- Ação primária: “Gerar repetições e Assinar”.
- Ação secundária: “Cancelar”.

**Regra crítica**:
- Cada repetição gera documento próprio para assinatura individual por data.

### 7.6 Assinatura digital (nuvem/local)
**Fluxo de assinatura**:
1. Abrir modal “Selecione o certificado”.
2. Escolher aba **Nuvem** ou **Local**.
3. Selecionar certificado.
4. (Opcional) informar OTP / autenticar via app.
5. Confirmar assinatura digital.
6. Tratar prompt de segurança do sistema operacional, quando existir.

**Regras**:
- Logar tentativa, sucesso e falha de assinatura.
- Exibir feedback claro em caso de certificado indisponível/expirado.
- Bloquear conclusão “Assinado” sem retorno positivo do provedor de assinatura.

## 8) Atestado e Encaminhamentos (expandido com base nos novos prints)

### 8.1 Lista de Atestados
**Layout**:
- Submódulo “Atestados” na sidebar de Atendimentos.
- Header com CTA **Novo Atestado**, botão Atualizar e Filtro.
- Lista cronológica de documentos com status e ações rápidas.

**Estado vazio**:
- “Nenhum item registrado!” + CTA “Novo Atestado”.

### 8.2 Tela “Novo Atestado”
**Blocos**:
1. Seletor de modelos de texto pré-definidos
2. Editor principal de texto (com placeholders)
3. Data do documento (com atalho “Agora”)
4. Barra de ações: Cancelar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir

**Componentes-chave**:
- Combobox de modelos com busca
- Editor multilinha com suporte a variáveis/template tags
- Botão para inserir o texto como novo modelo
- Modal “Modelo de documento” para salvar template

**Regras**:
- “Finalizar” bloqueia edição direta (exceto retificação auditada).
- “Assinar” segue mesmo fluxo de certificado (nuvem/local) já definido para prescrição.
- “Finalizar e imprimir” requer documento válido + finalizado.
- Se data não for informada, considerar data de finalização (regra explícita nos prints).

### 8.3 Modal “Modelo de documento”
**Campos**:
- Modelo para (Documento)
- Tipo (Atestado)
- Calendários/tags opcionais
- Título (obrigatório)
- Texto padrão (obrigatório)

**CTA**:
- “Salvar e incluir”

**Regras**:
- Salvar modelo deve disponibilizar imediatamente no seletor da tela atual.
- Permitir versionamento simples de modelo (v1, v2...) para evitar sobrescrita acidental.

### 8.4 Lista de Encaminhamentos
**Layout**:
- Submódulo “Encaminhamentos” com CTA **Novo Encaminhamento**, Atualizar e Filtro.
- Lista de documentos por data/status com ações padrão (visualizar, assinar, imprimir, excluir conforme RBAC).

**Estado vazio**:
- “Nenhum item registrado!” + CTA “Novo Encaminhamento”.

### 8.5 Tela “Novo Encaminhamento”
**Blocos**:
1. Categoria profissional (ex.: CRM, COREN, CRP, CREFITO...)
2. Especialidade médica/profissional (catálogo extenso com busca)
3. Ação “Adicionar opções selecionadas na descrição/motivo”
4. Modelos de texto pré-definidos
5. Campo de Descrição/Motivo
6. Data do documento (com atalho “Agora”)
7. Barra de ações: Cancelar, Salvar, Visualizar, Finalizar, Assinar, Finalizar e imprimir

**Regras**:
- Especialidade deve depender da categoria profissional selecionada quando aplicável.
- Inserção automática de opções no texto deve ser rastreável (marcação visual temporária).
- Fluxo de finalização/assinatura/impressão replica o padrão de Prescrição/Atestado.
- Validar coerência mínima de conteúdo (descrição/motivo não vazio antes de finalizar).

## 9) Configurações
- Usuários (CRUD)
- Perfis/permissões (RBAC matrix)
- Templates (prescrição, atestado, textos)

## 10) Auditoria
**Layout**: filtros avançados + tabela de eventos + drawer detalhe.  
**Filtros**: período, usuário, paciente, ação, módulo.  
**Eventos**: visualizar, criar, editar, excluir, exportar, login falho.

---

## D) Design System mínimo (implementável)

## 1. Tipografia
- Fonte base: Inter/Roboto (sans).
- Escala:
  - H1 24/32 semibold
  - H2 20/28 semibold
  - H3 16/24 semibold
  - Body 14/20 regular
  - Label 12/16 medium
  - Caption 12/16 regular

## 2. Espaçamento e grid
- Grid desktop: 12 colunas, gutter 16px.
- Escala spacing: 4, 8, 12, 16, 24, 32.
- Altura padrão inputs: 40px (compacto 36px).
- Raio borda: 8px (cards/modais), 6px (inputs/botões).

## 3. Paleta
- Neutros (cinzas) para base.
- 1 cor de destaque primária (teal clínico, semelhante aos prints).
- Estados semânticos:
  - sucesso (verde)
  - alerta (âmbar)
  - erro (vermelho)
  - info (azul neutro)

## 4. Componentes base e variações
- Button: primário, secundário, ghost, perigo; tamanhos sm/md/lg.
- Input/Textarea: normal, erro, disabled, readonly.
- Select/Autocomplete: single/multi, com busca.
- Table: densa, linha selecionável, ações por linha.
- Tabs: horizontal com indicador claro.
- Drawer: detalhes sem perder contexto.
- Modal: confirmações e formulários curtos.
- Badge/Chip: status e tags.
- Timeline: histórico clínico/auditoria.
- Stepper: fluxos multi-etapa (ex.: cadastro assistido).

## 5. Estados interativos
- Hover: contraste leve.
- Focus: anel de foco visível (2px).
- Disabled: opacidade + cursor not-allowed.
- Erro: borda/vermelho + mensagem abaixo.
- Sucesso: feedback discreto via toast/inline.

## 6. Acessibilidade
- Contraste mínimo WCAG AA.
- Navegação por teclado em todos componentes críticos.
- Labels sempre visíveis (não depender de placeholder).
- Ícones com tooltip e texto acessível.

---

## E) Fluxos críticos (passo a passo)

## 1. Criar paciente → agendar → iniciar consulta → finalizar → prescrição/atestado
1. Secretária cria paciente mínimo obrigatório.
2. Agenda consulta (status inicial “confirmado” ou “aguardando”).
3. Médico abre agenda e inicia atendimento.
4. Encounter abre com dados essenciais já preenchidos.
5. Médico salva rascunho durante evolução (autosave ativo).
6. Médico finaliza consulta (confirmação modal).
7. Sistema bloqueia edição direta e habilita saída para prescrição/atestado.
8. Eventos são auditados em cada etapa.

## 2. Abrir consulta e sair
1. Usuário altera conteúdo.
2. Autosave tenta persistir periodicamente.
3. Ao fechar/voltar, sistema verifica pendências.
4. Se houver pendência: modal com opções “Continuar editando”, “Salvar e sair”, “Sair sem salvar”.

## 3. Anexar exame (PDF/imagem) → visualizar → referenciar na evolução
1. Upload por drag-and-drop ou seletor.
2. Mostrar progresso + validação tipo/tamanho.
3. Arquivo entra na lista com status “processando”/“pronto”.
4. Preview em drawer.
5. Na evolução, ação “Referenciar anexo” insere referência estruturada.

## 4. Usuário sem permissão
1. Tenta acessar rota protegida.
2. Middleware retorna 403.
3. UI mostra tela “Sem permissão” com orientação e ação de retorno.
4. Evento fica registrado na auditoria.

## 5. Auditoria: ver quem acessou/alterou
1. Usuário autorizado abre Auditoria.
2. Filtra por paciente/período/ação.
3. Visualiza evento resumido e abre detalhe (antes/depois quando aplicável).

## 6. Novo atendimento com pagamento parcial/total
1. Usuário abre “Novo Atendimento” na aba Atendimentos.
2. Preenche campos mínimos de agenda (serviço, data/hora, profissional, modalidade).
3. Define contratação, modalidade, recorrência e valida disponibilidade em tempo real.
4. Se for edição de atendimento existente, usa ação “Reagendar” e informa motivo da alteração.
5. Abre modal de Pagamento quando necessário e lança 1 ou mais formas de pagamento (com possibilidade de combinar formas na mesma cobrança).
6. Para cartão, informa quantidade de parcelas e, se aplicável, taxa/juros.
7. Sistema valida se total lançado == valor total cobrado.
8. Se houver divergência, bloqueia salvar pagamento e mostra erro explícito.
9. Se alguma linha estiver marcada como “Não pago”, abre confirmação explícita antes de persistir.
10. Usuário pode “Salvar” (mantém modal aberto com feedback), “Salvar e fechar” (fecha modal) ou seguir para iniciar.
11. Ao escolher “Iniciar atendimento”, sistema exige confirmação explícita em modal antes da transição.
12. Com confirmação positiva, abre/retoma atendimento, atualiza status e apresenta loading curto de sincronização.
13. Registra auditoria de criação/edição financeira, reagendamento, início de atendimento e alterações de agenda.

## 7. Prescrever → finalizar → assinar → imprimir
1. Médico clica em “Nova Prescrição”.
2. Seleciona modo (inteligente/tradicional) e adiciona medicamentos.
3. Ajusta posologia, via, duração e observações no modal “Inserir Medicamento”.
4. Salva rascunho e revisa preview.
5. Clica em “Finalizar”.
6. Se houver repetição, modal regulatório solicita confirmação explícita.
7. Clica em “Assinar” e seleciona certificado (nuvem/local + OTP opcional).
8. Após assinatura válida, sistema marca como assinada e libera “Finalizar e imprimir”.
9. Registra audit trail completo (criação, edição, finalização, assinatura, impressão/compartilhamento).

## 8. Emitir atestado/encaminhamento → finalizar → assinar → imprimir
1. Usuário abre “Novo Atestado” ou “Novo Encaminhamento”.
2. Seleciona modelo de texto pré-definido (opcional) e ajusta conteúdo.
3. Informa data do documento (ou usa padrão “Agora”).
4. Salva rascunho para revisão clínica.
5. Clica em “Finalizar”.
6. Clica em “Assinar” e escolhe certificado (nuvem/local).
7. Com assinatura válida, documento muda para estado assinado.
8. Clica em “Finalizar e imprimir” para emissão final.
9. Sistema registra trilha completa (modelo usado, alterações, finalização, assinatura, impressão).

## 9. Solicitar exame → finalizar → assinar → imprimir
1. Usuário abre “Nova solicitação de exame”.
2. Seleciona exames pré-definidos por categorias (checkboxes).
3. Complementa em “Texto livre” quando necessário.
4. Informa data da solicitação (ou usa “Agora”).
5. Salva rascunho e revisa visualização.
6. Finaliza solicitação.
7. Assina digitalmente (nuvem/local).
8. Finaliza e imprime o documento.
9. Sistema registra trilha de auditoria completa do processo.

## 10. Novo resultado de exame com “Ler com IA”
1. Usuário abre “Novo resultado”.
2. Seleciona exame alvo e anexa resultado em imagem/PDF.
3. Aciona “Ler com IA”.
4. Sistema processa arquivo e retorna extração estruturada (texto/valores) com status.
5. Usuário revisa e edita os campos extraídos.
6. Clica em “Incluir resultado” para adicionar na lista do documento.
7. Salva e finaliza o resultado.
8. Sistema registra origem IA, usuário revisor e timestamp de confirmação.

## 11. Escalas, sinais e medidas em sequência clínica
1. Usuário seleciona uma escala e responde o questionário.
2. Sistema calcula o resultado automaticamente ao completar respostas obrigatórias.
3. Usuário registra sinais vitais e revisa escore MEWS.
4. Usuário registra medidas antropométricas e valida IMC/RCQ/superfície corpórea.
5. Salva/Finaliza cada bloco com trilha de auditoria.
6. Caso necessário, envia escala ao paciente por canal escolhido (WhatsApp/E-mail/Link).

---


## 12. Registrar procedimento/diário e usar calculadora no atendimento
1. Usuário acessa Atendimentos > Procedimentos e cria novo registro com dados clínicos e financeiros mínimos.
2. Salva como rascunho ou finaliza; ao finalizar, status fica bloqueado para edição direta.
3. Na aba Diários, registra nota clínica/administrativa vinculada ao atendimento.
4. Define privacidade do diário (“Somente equipe clínica”) quando o conteúdo for sensível.
5. Em Calculadoras, executa ferramenta clínica, revisa interpretação e salva resultado.
6. Insere resultado da calculadora na evolução com citação automática da data/hora.
7. Todas as ações geram log de auditoria (criação, finalização, retificação e visualização restrita).

## F) Segurança e compliance na UI (sem juridiquês)

1. **Privacidade por padrão**: exibir apenas o necessário para a tarefa atual.
2. **Mascaramento inteligente**: CPF/telefone parcialmente mascarados em listas.
3. **Sessão e timeout**: aviso de expiração + lock screen opcional por inatividade.
4. **Confirmações de alto risco**: finalizar consulta, excluir, revogar acesso, editar registro finalizado.
5. **Rastro de ação sensível**: visualização/impressão/exportação registradas.
6. **Soft-delete visível**: item marcado como inativo/arquivado, com opção de restauração (se permitido).
7. **Sem permissão clara**: feedback sem expor detalhes internos de segurança.
8. **Assinatura digital segura**: exigir certificado válido (nuvem/local), com confirmação explícita antes da assinatura.
9. **Ações irreversíveis com 2 passos**: finalizar, assinar e imprimir exigem confirmação contextual.
10. **Trilha de assinatura**: registrar provedor, certificado (mascarado), data/hora e resultado (sucesso/falha).
11. **IA com revisão humana obrigatória**: todo conteúdo lido por IA em exames deve ser marcado e confirmado pelo profissional antes de persistir como resultado final.

---

## G) Checklist de implementação para Codex (priorizado)

## 1. Ordem de implementação
1. Fundação: layout app + autenticação + RBAC básico.
2. Design system base (Button/Input/Select/Table/Modal/Drawer/Tabs/Toast).
3. Pacientes (lista + cadastro mínimo + perfil/tabs).
4. Agenda (dia/semana + status + encaixe + no-show).
5. Encounter (evolução + diagnósticos + anexos + finalizar).
6. Prescrição e atestado com templates.
7. Auditoria + configurações (usuários/permissões/templates).

## 2. Convenções de rotas/páginas
- Entidades no plural (`/pacientes`, `/consultas`, `/prescricoes`).
- Detalhe por id (`/:id`).
- Subseções via tabs por query ou subrota (`/pacientes/:id?tab=saude`).
- Ações de criação em `/novo`.

## 3. Bibliotecas e padrões recomendados
- UI: shadcn/ui (base), Tailwind para consistência.
- Formulários: React Hook Form + Zod.
- Tabelas densas: TanStack Table.
- Data fetching/cache: React Query.
- Datas: date-fns (pt-BR).
- Máscaras: biblioteca de input mask para CPF/telefone/data/CEP.

---

## 4) Especificação de formulários (campos + validações)

## 4.1 Cadastro de Paciente (mínimo obrigatório)

| Campo | Tipo | Obrigatório | Máscara | Validação | Exemplo |
|---|---|---:|---|---|---|
| Nome completo | texto | Sim | - | min 3 caracteres | Maria Silva |
| Data de nascimento | data | Sim | dd/mm/aaaa | data válida e <= hoje | 15/08/1988 |
| CPF | texto | Sim (ou documento alternativo) | 000.000.000-00 | CPF válido/único | 123.456.789-09 |
| Sexo | rádio | Sim | - | uma opção | Feminino |
| Celular | texto | Sim | (00) 00000-0000 | DDD + número válidos | (11) 98765-4321 |
| E-mail | texto | Não | - | formato e-mail | nome@dominio.com |
| CEP | texto | Não | 00000-000 | CEP válido | 37130-193 |
| Convênio | select | Não | - | lista cadastrada | Unimed |
| Status | select | Sim | - | Ativo/Inativo | Ativo |

**Mensagens de erro (texto exato)**
- “Informe o nome completo do paciente.”
- “Data de nascimento inválida.”
- “CPF inválido. Verifique os números informados.”
- “Este CPF já está cadastrado.”
- “Informe um celular válido com DDD.”

## 4.2 Contato responsável (modal)

| Campo | Tipo | Obrigatório | Máscara | Validação |
|---|---|---:|---|---|
| Nome | texto | Sim | - | min 3 |
| Parentesco | select | Sim | - | valor da lista |
| CPF | texto | Não | CPF | CPF válido se preenchido |
| Telefone/WhatsApp | texto | Sim | telefone | número válido |
| Data de nascimento | data | Não | dd/mm/aaaa | data válida |
| Observações | textarea | Não | - | max 500 |

## 4.3 Encounter (consulta)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Queixa principal | texto | Sim | min 5 |
| Evolução (SOAP ou livre) | editor | Sim | não vazio |
| Diagnóstico (CID) | autocomplete | Não no rascunho / Sim no fechamento (regra configurável) | código válido |
| Conduta | textarea | Sim no fechamento | min 5 |

## 4.4 Prescrição

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Medicamento | autocomplete | Sim | item existente/cadastrado |
| Posologia | texto | Sim | min 3 |
| Via | select | Sim | valor permitido |
| Frequência | select/texto | Sim | valor válido |
| Duração | texto | Sim | min 1 |
| Observações | texto | Não | max 300 |

## 4.5 Diagnóstico em saúde mental/geral (modal)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Código (CID-10) | select | Sim | lista permitida |
| Diagnóstico | autocomplete | Sim | termo válido do catálogo |
| Como foi realizado | radio group | Sim | 1 opção obrigatória |
| Situação | radio group | Sim | Suspeita/Confirmado |
| Especificadores | chips/radios | Não | coerência com diagnóstico |
| Data do registro | data/hora | Sim | não futura (regra configurável) |
| Observações | textarea | Não | max 1000 |

**Mensagens de erro (texto exato)**
- “Selecione um diagnóstico válido para continuar.”
- “Informe a situação do diagnóstico.”
- “Data do registro inválida.”

## 4.6 Vacinas (modal)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Vacina | autocomplete | Sim | item do catálogo |
| Administrado anteriormente? | toggle | Sim | Sim/Não |
| Data da aplicação | data | Sim (quando administrado) | data válida |
| Lote | texto | Não | max 60 |
| Anexo da vacina | upload | Não | PDF/JPG/PNG até limite |

**Mensagens de erro (texto exato)**
- “Selecione uma vacina da lista.”
- “Informe a data de aplicação.”
- “Arquivo inválido. Envie PDF, JPG ou PNG.”

## 4.7 Atendimentos (filtros da lista)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Período inicial/final | date range | Não | início <= fim |
| Tipo de atendimento | select | Não | valores cadastrados |
| Status | multi-select | Não | rascunho/finalizado/cancelado |
| Profissional | select | Não | usuário ativo |

## 4.8 Agendar Atendimento (modal)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Paciente | select/search | Sim | paciente ativo |
| Serviço | select | Sim | item de catálogo |
| Data/hora | datetime (segmentado) | Sim | >= agora (regra configurável) |
| Tempo previsto | número/select | Sim | > 0 (5–480 min) |
| Modalidade | select | Sim | presencial/online |
| Contratação | select | Sim | particular/convênio/SUS/voluntário |
| Profissional | select | Sim | profissional ativo |
| Especialidade | select | Não | valor de lista |
| Status | select | Sim | agendado/confirmado/... |
| Recorrência | select + parâmetros | Não | preset ou personalizada com intervalo válido |
| Reagendar (ação) | botão | Condicional | disponível quando edição de atendimento existente |
| Motivo do reagendamento | textarea curta | Condicional | obrigatório no reagendamento |
| Mais opções | select pesquisável | Não | item válido do catálogo de opções clínicas/operacionais |
| Observações | textarea | Não | max 1000 |
| Salvar e fechar (ação) | botão | Não | persiste com sucesso antes de fechar |
| Iniciar atendimento (ação) | botão + confirmação | Condicional | exige confirmação explícita e campos mínimos válidos |

**Mensagens de erro (texto exato)**
- “Selecione um serviço para continuar.”
- “Informe data e hora válidas para o atendimento.”
- “Selecione um profissional responsável.”
- “Tempo previsto deve ser maior que zero.”
- “Há conflito de agenda para este horário. Escolha outro horário ou profissional.”
- “Informe o motivo do reagendamento.”
- “Selecione uma opção válida em Mais opções.”
- “Deseja realmente iniciar este atendimento?”

## 4.9 Pagamento do atendimento (modal)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Valor total cobrado | moeda | Sim | >= 0 |
| Forma de pagamento | select pesquisável | Sim (por linha) | valor da lista |
| Tipo pagador | select | Sim (por linha) | física/jurídica |
| Valor da linha | moeda | Sim (por linha) | > 0 |
| Parcelas | inteiro | Condicional (cartão) | >= 1 e <= 24 |
| Juros/Taxa | moeda/% | Não | >= 0 |
| Pago/Quitado | toggle | Sim | boolean |
| Comprovante | upload | Não | tipo permitido |
| Recibo/Nota fiscal | toggle | Não | boolean |
| Nº da nota fiscal | texto | Sim (se nota ativa) | min 3 |

**Mensagens de erro (texto exato)**
- “Informe uma forma de pagamento.”
- “Informe o valor da forma de pagamento.”
- “Informe uma quantidade de parcelas válida.”
- “O total das formas de pagamento difere do valor total cobrado.”
- “Confirma valor no pago? Sua planilha financeira receberá esse apontamento.”
- “Informe o número da nota fiscal.”

## 4.10 Inserir Medicamento (modal de prescrição)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Nome do medicamento | autocomplete | Sim | item do catálogo |
| Tipo de receita | select | Sim | simples/controle especial/etc |
| Dosagem | select/texto | Sim | valor permitido |
| Apresentação | texto/select | Sim | item padronizado |
| Quantidade | stepper numérico | Sim | > 0 |
| Via de aplicação | select | Sim | valor da lista clínica |
| Posologia | select/texto | Sim | padrão válido |
| Horário da 1ª dose | hora | Não | HH:mm válido |
| Duração | cálculo | Sim | derivada de posologia + quantidade |
| Observações | textarea | Não | max 255 |
| Ocultar horários | toggle | Não | boolean |
| Gerar em folha separada | toggle | Não | boolean |
| Repetir | toggle | Não | boolean |

**Mensagens de erro (texto exato)**
- “Selecione um medicamento para continuar.”
- “Informe a posologia do medicamento.”
- “Informe uma via de aplicação válida.”
- “Quantidade do medicamento deve ser maior que zero.”

## 4.11 Assinatura digital de prescrição

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Ambiente de certificado | tabs | Sim | nuvem/local |
| Certificado | select | Sim | certificado válido e não expirado |
| OTP / token | texto | Não (dependente do provedor) | formato do provedor |
| Confirmação de assinatura | ação | Sim | retorno de sucesso do provedor |

**Mensagens de erro (texto exato)**
- “Selecione um certificado para assinar.”
- “Não foi possível validar o certificado selecionado.”
- “Falha na assinatura digital. Tente novamente.”

## 4.12 Atestado (editor de documento)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Modelo de texto | select/search | Não | item cadastrado |
| Conteúdo do atestado | editor/textarea | Sim | min 20 caracteres |
| Data do documento | data/hora | Não | válida; padrão data finalização |
| Status | sistema | Sim | rascunho/finalizado/assinado |

**Mensagens de erro (texto exato)**
- “Informe o conteúdo do atestado.”
- “Data do documento inválida.”
- “Finalize o documento antes de assinar.”

## 4.13 Encaminhamento (editor de documento)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Categoria profissional | select | Sim | valor da lista oficial |
| Especialidade | select/search | Sim | compatível com categoria |
| Modelo de texto | select/search | Não | item cadastrado |
| Descrição/Motivo | editor/textarea | Sim | min 20 caracteres |
| Data do documento | data/hora | Não | válida; padrão data finalização |

**Mensagens de erro (texto exato)**
- “Selecione a categoria profissional.”
- “Selecione a especialidade para o encaminhamento.”
- “Informe a descrição/motivo do encaminhamento.”
- “Finalize o documento antes de assinar.”

## 4.14 Relatório (editor de documento)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Título do relatório | select/texto | Sim | min 3 caracteres |
| Conteúdo do relatório | editor/textarea | Sim | min 20 caracteres |
| Data do documento | data/hora | Não | válida; padrão data finalização |
| Status | sistema | Sim | rascunho/finalizado/assinado |

**Mensagens de erro (texto exato)**
- “Informe o título do relatório.”
- “Informe o conteúdo do relatório.”
- “Finalize o documento antes de assinar.”

## 4.15 Solicitação de exame

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Exames pré-definidos | checkbox group | Não* | pelo menos 1 item ou texto livre |
| Categoria de exame | tabs | Não | estado persistente entre abas |
| Texto livre | textarea | Não* | min 5 quando usado como único conteúdo |
| Data da solicitação | data/hora | Não | válida; padrão data finalização |

\* Obrigatório em conjunto: deve haver ao menos um exame marcado ou texto livre preenchido.

**Mensagens de erro (texto exato)**
- “Selecione pelo menos um exame ou preencha o texto livre.”
- “Data da solicitação inválida.”
- “Finalize o documento antes de assinar.”

## 4.16 Novo resultado de exame (com Ler com IA)

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Exame | select/search | Sim | exame válido/cadastrado |
| Observações | textarea | Não | max 1000 |
| Anexo do resultado | upload | Recomendado | JPG/PNG/PDF até limite |
| Ler com IA | ação/botão | Não | disponível após upload válido |
| Data da coleta | data | Não | data válida |
| Conclusão/Parecer | textarea | Não* | min 10 quando sem anexo |
| Data do registro | data/hora | Não | padrão “Agora” |

\* Obrigatório em conjunto para incluir resultado: anexo válido **ou** conclusão mínima preenchida.

**Mensagens de erro (texto exato)**
- “Selecione um exame para incluir o resultado.”
- “Envie um arquivo JPG, PNG ou PDF para leitura por IA.”
- “A leitura por IA falhou. Revise o arquivo e tente novamente.”
- “Revise os dados extraídos pela IA antes de incluir o resultado.”

## 4.17 Escala clínica

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Escala | select/search | Sim | item do catálogo |
| Respostas da escala | radio/checkbox | Sim* | todas obrigatórias da escala |
| Data do registro | data/hora | Não | padrão “Agora” |

\* Para cálculo final, todas as perguntas obrigatórias precisam ser respondidas.

**Mensagens de erro (texto exato)**
- “Selecione uma escala para continuar.”
- “Responda todas as perguntas obrigatórias para calcular o resultado.”

## 4.18 Sinais vitais

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| PAS/PAD | número + unidade | Não | faixa fisiológica |
| Temperatura | número | Não | faixa fisiológica |
| FC/FR | número | Não | > 0 |
| SaO2 | número | Não | 0–100 |
| Glicemia capilar | número | Não | >= 0 |
| Dor | escala visual | Não | 0–10 |
| Nível de consciência | radio group | Não | valor da lista |
| Data do registro | data/hora | Não | padrão “Agora” |

**Mensagens de erro (texto exato)**
- “Valor de sinal vital fora da faixa esperada. Confirme a medição.”

## 4.19 Medidas antropométricas

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Peso | número + unidade | Sim | > 0 |
| Altura | número + unidade | Sim | > 0 |
| Cintura | número | Não | >= 0 |
| Quadril | número | Não | >= 0 |
| Circunferência abdominal | número | Não | >= 0 |
| Data do registro | data/hora | Não | padrão “Agora” |

**Mensagens de erro (texto exato)**
- “Informe peso e altura válidos para calcular os indicadores.”

## 4.20 Recibo

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Nome do paciente | texto | Sim | min 3 |
| CPF do paciente | texto | Sim | CPF válido |
| Nome do pagador | texto | Sim | min 3 |
| CPF do pagador | texto | Não | CPF válido se preenchido |
| Valor | moeda | Sim | > 0 |
| Data do pagamento | data/hora | Não | padrão data de impressão/finalização |

**Mensagens de erro (texto exato)**
- “Informe o valor do recibo.”
- “CPF inválido. Verifique os números informados.”

## 4.21 Auxílio diagnóstico

| Campo | Tipo | Obrigatório | Validação |
|---|---|---:|---|
| Diagnóstico (CID) | autocomplete | Sim | código válido |
| Como foi realizado | radio group | Sim | 1 opção |
| Situação | radio group | Sim | suspeita/confirmado |
| Status | select | Sim | ativo/inativo |
| Data do registro | data/hora | Não | padrão “Agora” |

**Mensagens de erro (texto exato)**
- “Selecione um diagnóstico válido.”
- “Informe a situação do diagnóstico.”

---


## 4.22 Procedimento
| Campo | Tipo | Obrigatório | Máscara | Validação | Exemplo |
|---|---|---:|---|---|---|
| Tipo de procedimento | Autocomplete | Sim | - | Deve existir no catálogo ou ser permitido como “outro” | “Infiltração intra-articular” |
| Data/hora | Datetime | Sim | dd/mm/aaaa hh:mm | Não permitir data inválida | 21/02/2026 14:30 |
| Profissional responsável | Select | Sim | - | Obrigatório | “Dr. João Silva” |
| Valor final | Moeda | Sim | R$ 0,00 | Deve ser >= 0 | R$ 350,00 |
| Status de execução | Select | Sim | - | Agendado/Realizado/Cancelado | “Realizado” |
| Observações clínicas | Textarea | Não | - | Limite 2000 caracteres | “Procedimento sem intercorrências.” |

**Mensagens de erro (exatas)**:
- “Selecione o tipo de procedimento.”
- “Informe data e hora válidas.”
- “Selecione o profissional responsável.”
- “Informe um valor válido para o procedimento.”

## 4.23 Diário clínico/administrativo
| Campo | Tipo | Obrigatório | Máscara | Validação | Exemplo |
|---|---|---:|---|---|---|
| Tipo de diário | Select | Sim | - | Clínico/Administrativo/Devolutiva | “Clínico” |
| Conteúdo | Editor rich text | Sim | - | Mín. 10 caracteres | “Paciente relata melhora...” |
| Privacidade restrita | Checkbox | Não | - | Quando ativo, limitar visualização por RBAC | Marcado |
| Referência do registro | Select | Não | - | Pode vincular atendimento/exame/prescrição | “Atendimento #A-1291” |

**Mensagens de erro (exatas)**:
- “Selecione o tipo de diário.”
- “Descreva o conteúdo do diário.”
- “Você não tem permissão para marcar este diário como restrito.”

## 4.24 Calculadora clínica
| Campo | Tipo | Obrigatório | Máscara | Validação | Exemplo |
|---|---|---:|---|---|---|
| Calculadora | Select | Sim | - | Seleção obrigatória | “Cockcroft-Gault” |
| Parâmetros de entrada | Number/Select | Sim | depende | Validar por faixa clínica | Idade 67, peso 72kg |
| Resultado | Readonly | Sim (gerado) | - | Calculado automaticamente | “ClCr 58 mL/min” |
| Inserir na evolução | Checkbox | Não | - | Só habilita após cálculo válido | Marcado |

**Mensagens de erro (exatas)**:
- “Selecione uma calculadora.”
- “Preencha os parâmetros obrigatórios para calcular.”
- “Não foi possível calcular com os dados informados.”


## 5) Contrato de dados para UI (shapes consumidos pelo frontend)

## 5.1 PatientSummary (lista)
- id
- nomeCompleto
- cpfMascarado
- dataNascimento
- idade
- telefonePrincipalMascarado
- status
- tags
- ultimaConsultaEm

## 5.2 PatientDetail (perfil)
- dadosBasicos (nome, nomeSocial, cpf, sexo, nascimento)
- contatos (telefones, email)
- endereco
- convenio
- responsaveis[]
- socioeconomico
- urgencias[]
- observacoes
- metadados (criadoPor, criadoEm, atualizadoEm)

## 5.3 Appointment
- id
- patientId
- profissionalId
- inicioEm / fimEm
- status
- tipo (consulta/retorno/encaixe)
- notasRecepcao

## 5.4 EncounterDraft
- id
- appointmentId
- patientId
- status (rascunho/finalizado)
- soap (S,O,A,P)
- diagnosticos[]
- condutas
- anexosRelacionados[]
- atualizadoEm

## 5.5 PrescriptionItem / Prescription
- Prescription: id, encounterId, status, templateId, criadoPor, criadoEm
- Item: medicamento, apresentacao, via, posologia, frequencia, duracao, observacao

## 5.6 AuditEvent
- id
- dataHora
- usuario
- perfil
- acao
- entidade
- entidadeId
- patientId (quando aplicável)
- origem (web/api)
- ipMascarado
- resumoAlteracao

## 5.7 MentalHealthDiagnosis
- id
- patientId
- cidCodigo
- cidDescricao
- situacao (suspeita|confirmado)
- metodoIdentificacao (relato|clinico|teste_neuropsicologico|mini|scid)
- severidade (leve|moderado|grave|null)
- especificadores[]
- inicioEm
- fimEm
- registradoEm
- status

## 5.8 VaccineRecord
- id
- patientId
- vacinaNome
- fabricante
- lote
- administradoAnteriormente (boolean)
- dataAplicacao
- comprovanteAnexoId
- registradoPor
- registradoEm

## 5.9 AttendanceListItem
- id
- patientId
- encounterId
- tipo
- status
- profissionalNome
- iniciadoEm
- finalizadoEm
- origem (agenda|encaixe)

## 5.10 ScheduleAppointment
- id
- patientId
- servicoId
- dataHora
- tempoPrevistoMin
- modalidade (presencial|online)
- recorrencia (nenhuma|diaria|semanal|quinzenal|mensal|custom)
- contratacao (particular|convenio|sus|voluntario)
- profissionalId
- especialidadeId
- status
- tipoAtendimento
- cor
- observacoes

## 5.11 PaymentEntry
- id
- appointmentId
- formaPagamento
- tipoPagador (fisica|juridica)
- valor
- parcelas (opcional)
- jurosOuTaxa (opcional)
- pago (boolean)
- comprovanteAnexoId

## 5.12 PaymentSummary
- appointmentId
- valorNormal
- valorTotalCobrado
- totalLancado
- totalQuitado
- emitirRecibo (boolean)
- emitirNotaFiscal (boolean)
- numeroNotaFiscal

## 5.13 PrescriptionListItem
- id
- patientId
- encounterId
- dataPrescricao
- status (rascunho|finalizada|assinada)
- medicamentosResumo[]
- assinadaPor
- assinadaEm
- permiteImpressao (boolean)

## 5.14 PrescriptionMedicationItem
- id
- prescriptionId
- medicamentoId
- nomeExibicao
- dosagem
- apresentacao
- quantidade
- viaAplicacao
- posologia
- primeiraDoseEm
- ocultarHorarios (boolean)
- duracaoDias
- repeticaoConfig
- observacoes

## 5.15 SignatureRequest
- id
- entityType (prescription|attestation|referral)
- entityId
- provider (nuvem|local)
- certificadoAliasMascarado
- otpUtilizado (boolean)
- status (pendente|sucesso|falha)
- criadoEm
- concluidoEm
- erroCodigo
- erroMensagem

## 5.16 AttestationDocument
- id
- patientId
- encounterId
- templateId
- titulo
- conteudo
- dataDocumento
- status (rascunho|finalizado|assinado)
- assinadoPor
- assinadoEm

## 5.17 ReferralDocument
- id
- patientId
- encounterId
- categoriaProfissional
- especialidade
- templateId
- descricaoMotivo
- dataDocumento
- status (rascunho|finalizado|assinado)
- assinadoPor
- assinadoEm

## 5.18 TemplateDocument
- id
- tipo (atestado|encaminhamento)
- titulo
- textoPadrao
- tags[]
- versao
- ativo

## 5.19 ReportDocument
- id
- patientId
- encounterId
- titulo
- conteudo
- dataDocumento
- status (rascunho|finalizado|assinado)
- assinadoPor
- assinadoEm

## 5.20 ExamRequest
- id
- patientId
- encounterId
- categoriasSelecionadas[]
- examesSelecionados[]
- textoLivre
- dataSolicitacao
- status (rascunho|finalizado|assinado)
- assinadoPor
- assinadoEm

## 5.21 ExamResult
- id
- patientId
- examRequestId
- tipo
- dataResultado
- anexoId
- resumo
- criadoPor
- leituraIA (boolean)
- leituraIAStatus (pendente|processando|concluido|erro)
- leituraIAExtracaoBruta
- leituraIAResumoEstruturado
- revisadoPor
- revisadoEm

## 5.22 ScaleRecord
- id
- patientId
- escalaId
- escalaNome
- respostas[]
- scoreFinal
- interpretacao
- enviadoParaPaciente (boolean)
- canalEnvio
- registradoEm

## 5.23 VitalSignsRecord
- id
- patientId
- pas
- pad
- temperatura
- fc
- fr
- sao2
- glicemiaCapilar
- dorScore
- nivelConsciencia
- mewsScore
- observacoes
- registradoEm

## 5.24 AnthropometricRecord
- id
- patientId
- peso
- altura
- cintura
- quadril
- circunferenciaAbdominal
- imc
- rcq
- superficieCorporea
- obesidadeCentral
- observacoes
- registradoEm

## 5.25 ReceiptDocument
- id
- patientId
- nomePagador
- cpfPagador
- valor
- dataPagamento
- status (rascunho|finalizado|assinado)
- assinadoPor
- assinadoEm

## 5.26 DiagnosticAssistItem
- id
- patientId
- cidCodigo
- cidDescricao
- situacao
- metodo
- status
- observacoes
- sugeridoPorIA (boolean)
- registradoEm


## 5.28 ProcedureRecord
```json
{
  "id": "proc_01",
  "patientId": "pat_01",
  "attendanceId": "att_01",
  "procedureType": "Infiltração intra-articular",
  "status": "realizado",
  "scheduledAt": "2026-02-21T14:30:00Z",
  "professional": { "id": "usr_01", "nome": "Dr. João Silva" },
  "financial": { "valorBase": 350, "desconto": 0, "valorFinal": 350 },
  "clinicalNote": "Sem intercorrências.",
  "version": 1
}
```

## 5.29 DiaryEntry
```json
{
  "id": "dia_01",
  "patientId": "pat_01",
  "attendanceId": "att_01",
  "type": "clinico",
  "title": "Evolução pós-procedimento",
  "content": "Paciente evolui sem dor intensa.",
  "restrictedToClinicalTeam": true,
  "author": { "id": "usr_01", "nome": "Dr. João Silva" },
  "createdAt": "2026-02-21T15:02:00Z",
  "version": 1
}
```

## 5.30 CalculatorResult
```json
{
  "id": "calc_01",
  "patientId": "pat_01",
  "attendanceId": "att_01",
  "calculatorKey": "cockcroft_gault",
  "inputs": {
    "idade": 67,
    "pesoKg": 72,
    "sexo": "masculino",
    "creatinina": 1.3
  },
  "result": {
    "value": 58,
    "unit": "mL/min",
    "interpretation": "redução moderada"
  },
  "savedToEvolution": true,
  "createdAt": "2026-02-21T15:10:00Z"
}
```

## 5.27 Ordenações e filtros padrão
- Pacientes: ordem por nome A-Z (default) e “atualizado recentemente”.
- Agenda: ordem cronológica.
- Auditoria: mais recente primeiro.
- Anexos: mais recente primeiro, filtro por tipo.
- Atendimentos: mais recente primeiro, filtro por status/tipo/profissional.
- Prescrições: mais recente primeiro, filtro por status (rascunho/finalizada/assinada).
- Atestados/Encaminhamentos/Relatórios: mais recente primeiro, filtro por status e tipo de documento.
- Exames: mais recente primeiro, filtro por período e tipo.
- Escalas/Sinais/Medidas: mais recente primeiro, filtro por período e profissional.
- Procedimentos: por data, status de execução, tipo e profissional.
- Diários: por data, tipo, autor e nível de privacidade (quando permitido).
- Calculadoras: por data e tipo de calculadora, com filtro por vínculo em atendimento.

---

## 6) Microcopy (PT-BR) pronta para uso

## 6.1 Confirmações
- “Finalizar consulta agora? Após finalizar, a edição ficará bloqueada.”
- “Excluir paciente? Esta ação moverá o registro para inativo (soft-delete).”
- “Sair sem salvar? Alterações não sincronizadas poderão ser perdidas.”
- “Deseja prosseguir e criar as repetições da prescrição?”
- “Assinar digitalmente esta prescrição agora?”
- “Finalizar este atestado agora?”
- “Assinar digitalmente este encaminhamento agora?”
- “Assinar digitalmente esta solicitação de exame agora?”
- “Confirmar dados lidos por IA e incluir no resultado?”
- “Enviar esta escala para o paciente pelo canal selecionado?”
- “Finalizar procedimento agora? Alterações futuras exigirão retificação.”
- “Salvar resultado da calculadora na evolução deste atendimento?”
- “Confirma valor no pago? Sua planilha financeira receberá esse apontamento.”
- “Há conflito de agenda para este horário. Deseja ajustar o horário agora?”
- “Dados salvos com sucesso.”
- “Deseja realmente iniciar este atendimento?”

## 6.2 Empty states
- “Nenhum responsável adicionado até o momento.”
- “Nenhum exame anexado ainda.”
- “Nenhum atendimento encontrado para este período.”
- “Nenhum diagnóstico registrado.”
- “Nenhuma prescrição cadastrada para este paciente.”
- “Nenhum medicamento adicionado à prescrição.”
- “Nenhum atestado cadastrado para este paciente.”
- “Nenhum encaminhamento cadastrado para este paciente.”
- “Nenhum relatório cadastrado para este paciente.”
- “Nenhuma solicitação de exame cadastrada para este paciente.”
- “Nenhum resultado de exame cadastrado para este paciente.”
- “Nenhuma escala cadastrada para este paciente.”
- “Nenhum registro de sinais vitais para este paciente.”
- “Nenhuma medida antropométrica cadastrada.”
- “Nenhum recibo cadastrado para este paciente.”
- “Nenhum procedimento registrado neste paciente.”
- “Nenhum diário encontrado para os filtros aplicados.”
- “Nenhum cálculo salvo para este paciente.”

## 6.3 Tooltips rápidos
- Interditado: “Indica restrição legal de autonomia do paciente.”
- No-show: “Paciente não compareceu no horário agendado.”
- Rascunho: “Conteúdo salvo parcialmente, ainda não finalizado.”
- Ocultar horários: “Não exibe horários no documento impresso da prescrição.”
- Repetir: “Cria novas prescrições por data, com assinatura separada.”
- Certificado local: “Usa o certificado digital instalado no computador.”
- Inserir como modelo: “Salva o texto atual como modelo reutilizável de documento.”
- Adicionar opções na descrição: “Insere automaticamente especialidade/categoria no corpo do encaminhamento.”
- Seleção de exames pré-definidos: “Marque os exames desejados por categoria.”
- Texto livre de exames: “Use para exames não encontrados na lista padrão.”
- Ler com IA: “Envia imagem/PDF para extração automática e revisão manual.”
- Enviar escala: “Compartilha a escala com o paciente pelos canais disponíveis.”
- Insights de IA: “Sugestões clínicas baseadas em padrões, sempre com validação profissional.”
- Diário restrito: “Visível apenas para equipe clínica autorizada.”
- Calculadora clínica: “Confira parâmetros e interpretação antes de inserir na evolução.”

---


## 7) Delta aplicado com os novos prints (Saúde/Atendimentos/Prescrições/Documentos/Relatórios/Exames/Escalas/Sinais/Medidas/Recibos/Auxílio/Procedimentos/Diários/Calculadoras)

1. Saúde agora especificada em 3 subabas operacionais (geral, mental, vacinação) com comportamentos distintos.
2. Modal de diagnóstico detalhado com campos obrigatórios, avançados e validações explícitas.
3. Histórico de vacinação ajustado para catálogo grande (autocomplete robusto + anexos).
4. Atendimentos evoluiu para arquitetura modular com sidebar interna e múltiplos artefatos clínicos.
5. Reforço de consistência: chips (resumo) + lista (detalhe) para diagnósticos em saúde mental e geral.
6. Inclusão completa do modal “Agendar Atendimento” (abas Agenda/Tarefa, recorrência, modalidade, contratação, status).
7. Inclusão do subfluxo financeiro via modal “Pagamento” com reconciliação de totais e emissão de recibo/nota fiscal.
8. Novos contratos de dados e formulários para atendimento agendado e pagamentos parciais/multilinha.
9. Expansão completa do fluxo de prescrição: lista, edição (inteligente/tradicional), modal de medicamento, preview de impressão e ações de finalização.
10. Inclusão do fluxo de repetição com confirmação regulatória e assinatura individual por data.
11. Inclusão de assinatura digital com seleção de certificado (nuvem/local), OTP opcional e trilha de auditoria.
12. Expansão completa de Atestados: lista, criação por modelo, editor, modal de novo modelo e fluxo de assinatura/impressão.
13. Expansão completa de Encaminhamentos: categoria profissional, especialidade, modelos, descrição/motivo e ações finais.
14. Novos formulários e shapes para documentos textuais clínicos (atestado/encaminhamento/template).
15. Inclusão do submódulo Relatórios com criação por título/modelo e fluxo completo de finalização/assinatura/impressão.
16. Inclusão da primeira parte do submódulo Exames com seleção pré-definida por categorias, texto livre e assinatura digital.
17. Novos contratos de dados para relatórios e solicitações/resultados de exames.
18. Inclusão do campo/ação “Ler com IA” no fluxo de Novo Resultado de Exame, com upload de imagem/PDF e revisão humana obrigatória.
19. Inclusão de estados e contratos de extração de IA (processamento, erro, revisão e confirmação).
20. Inclusão dos submódulos Escalas, Sinais vitais, Medidas antropométricas, Recibos e Auxílio diagnóstico com regras de interface e fluxo operacional.
21. Inclusão de formulários e contratos de dados para escala, sinais, medidas, recibo e diagnóstico assistido.
22. Inclusão de regras de envio de escala ao paciente e de cálculo automático (MEWS, IMC/RCQ/superfície corpórea).
23. Inclusão dos submódulos Procedimentos, Diários e Calculadoras com wireframes de lista/edição e regras de versionamento.
24. Inclusão dos formulários 4.22–4.24 e contratos 5.28–5.30 para suportar implementação frontend orientada a API.
25. Inclusão do fluxo crítico de registro integrado (procedimento + diário + calculadora) com auditoria e RBAC.
26. Ajuste do modal de Agendar Atendimento para explicitar aba Financeiro e indicador de lançamento parcial/completo.
27. Ajuste do modal de Pagamento para suportar parcelas, taxa/juros, múltiplas formas e remoção de linhas com validação.
28. Inclusão da confirmação obrigatória para status “Não pago” com microcopy de impacto financeiro.
29. Ajuste da recorrência com presets expandidos e configuração personalizada (intervalo, término e dias da semana).
30. Inclusão de regra de reagendamento com motivo obrigatório e validação de conflito de agenda em tempo real.
31. Inclusão de “Mais opções” com busca incremental e seleção assistida para catálogos longos.
32. Inclusão de barra de ações completa (Salvar, Salvar e fechar, Iniciar atendimento) e confirmação explícita antes de iniciar.
33. Inclusão de feedback de persistência (toast) e estado de carregamento na transição para atendimento.

---

## 8) Estrutura das 3 documentações do produto

## 8.1 Negócio (Product/Business)
- Objetivos clínicos e operacionais
- Perfis de usuário e responsabilidades
- Métricas de sucesso (tempo de consulta, taxa de no-show, tempo de emissão de prescrição)

## 8.2 Funcional (Telas/Features)
- IA, wireframes textuais, fluxos críticos
- Formulários + validações
- Regras por perfil/permissão

## 8.3 Técnica (Arquitetura/API/Banco)
- Contratos de API para os shapes definidos
- Estratégia de auditoria e RBAC no backend
- Políticas de versionamento e soft-delete

---

## Próximo passo (quando você enviar os próximos prints)
Vou comparar este baseline com cada tela real e devolver:
1. ajustes cirúrgicos de layout e fluxo,
2. delta de componentes/tokens,
3. regras adicionais de validação e segurança,
4. versão consolidada pronta para implementação por sprint.


---

## 9) Deploy e run das telas (guia operacional para o dev)

> Status no repositório atual: **não há frontend executável** (apenas documentação).  
> Para permitir deploy/run das telas, o projeto precisa incluir uma aplicação (ex.: Next.js) com `package.json` e rotas implementadas.

### 9.1 Pré-requisitos mínimos para execução
1. Projeto Next.js inicializado na raiz (ou em `apps/web`).
2. Script `dev` para execução local (`next dev`).
3. Script `build` (`next build`) e `start` (`next start`).
4. Variáveis `.env` mínimas documentadas (API base URL, auth secret etc.).
5. Rotas do MVP criadas conforme seção de IA/rotas desta especificação.

### 9.2 Comandos padrão (quando o frontend existir)
- Instalação: `npm install`
- Desenvolvimento: `npm run dev`
- Build: `npm run build`
- Produção local: `npm run start`

### 9.3 Checklist de deploy (Vercel ou equivalente)
1. Conectar repositório ao provedor.
2. Definir comando de build (`npm run build`) e output do Next.js.
3. Configurar variáveis de ambiente por ambiente (preview/prod).
4. Habilitar proteção de rota por autenticação e RBAC.
5. Validar smoke test pós-deploy:
   - Login
   - Dashboard
   - Agenda
   - Pacientes
   - Paciente > Atendimentos > Agendar atendimento

### 9.4 Critérios de aceite para “telas rodando”
- Navegação entre rotas sem erro 500.
- Estados de loading/empty/error funcionando nas telas principais.
- Formulário de Agendar Atendimento salva rascunho, salva e fecha, e inicia atendimento com confirmação.
- Fluxo de pagamento parcial/total com reconciliação de somatórios.
- Logs de auditoria gerados para ações críticas.
