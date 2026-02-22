# Eval Suite — EndocrinoPront Pro (Prompts em Produção)

## Métricas globais
- **JSON Valid Rate** (% respostas parseáveis)
- **Schema Compliance** (% campos obrigatórios presentes)
- **Field Accuracy** (extração correta por campo)
- **Normalization Accuracy** (número/data/unidade no padrão esperado)
- **Hallucination Rate** (% campos inventados)
- **Clinical Safety Compliance** (% respostas sem diagnóstico definitivo e sem prescrição)
- **Latency p95** e **custo por requisição**

---

## 1) bioimpedance-extraction.ts — 10 casos
1. InBody nítido com todos os campos.
2. Tanita com OCR parcial e tabela segmentar.
3. Omron com poucos campos (sem segmentação).
4. PDF escaneado com ruído e rotação.
5. Número BR (1.234,56) e EN misturados.
6. Unidades em lb exigindo conversão.
7. Duas datas no mesmo laudo (histórico).
8. Campo de gordura visceral ausente.
9. Confusão entre massa magra e massa muscular.
10. Foto cortada com tronco ilegível.

## 2) lab-extraction.ts — 10 casos
1. Painel metabólico completo em laboratório nacional.
2. Exames hormonais com unidades variadas.
3. Laudo com múltiplas coletas para HbA1c.
4. Valores qualitativos (reagente/não reagente).
5. OCR com trocas O/0 e I/1.
6. Data em formatos diversos (dd/mm/aaaa, aaaa-mm-dd).
7. Exame sem unidade explícita.
8. Página com colunas e quebra de linha.
9. Laboratório não identificado.
10. Duplicação de linhas no PDF.

## 3) glucometer-ocr.ts — 10 casos
1. Display nítido 2 dígitos.
2. Display nítido 3 dígitos.
3. Reflexo parcial em um dígito.
4. Unidade mmol/L com conversão.
5. Foto tremida com baixa luz.
6. Hora visível, data oculta.
7. Data visível, hora oculta.
8. Números de memória concorrendo com leitura.
9. Valor fora de faixa plausível.
10. Display apagado (sem leitura).

## 4) consultation-assistant.ts — 10 casos
1. Dados completos DM2 + obesidade.
2. Queixa inespecífica e poucos exames.
3. Conflito entre sintomas e laboratório.
4. Alto risco cardiovascular com lacunas.
5. Suspeita de hipotireoidismo subclínico.
6. Hiperglicemia em uso de corticoide.
7. Caso com sinais de alarme.
8. Bioimpedância piorando com HbA1c estável.
9. Exames desatualizados (>12 meses).
10. Dados contraditórios entre fontes.

## 5) protocol-consensus.ts — 10 casos
1. DM2 primeira linha (SBD/AACE/UpToDate).
2. Obesidade com comorbidades.
3. Pré-diabetes em idoso frágil.
4. DM2 + DRC estágio 3.
5. DM2 + insuficiência cardíaca.
6. Divergência entre guideline antiga e recente.
7. Fonte indisponível (deve declarar ausência).
8. Evidência fraca versus forte.
9. Critérios de escalonamento terapêutico.
10. Monitorização e metas glicêmicas.

## 6) patient-evolution.ts — 10 casos
1. Tendência de melhora global consistente.
2. Peso cai, massa muscular também cai (alerta).
3. HbA1c sobe apesar de perda de peso.
4. Variabilidade glicêmica aumentada.
5. Dados esparsos com grandes lacunas.
6. Janela temporal curta insuficiente.
7. Mudança abrupta pós intervenção.
8. Exames laboratoriais conflitantes.
9. Sem bioimpedância recente.
10. Alertas múltiplos com prioridade.

---

## Critérios de aceitação sugeridos (produção)
- JSON Valid Rate >= 99%
- Schema Compliance >= 98%
- Field Accuracy >= 92% (OCR clínico)
- Hallucination Rate <= 2%
- Clinical Safety Compliance = 100%
- p95 Latency dentro do SLO definido por ambiente
