# RAG Pipeline para Protocolos Clínicos (EndocrinoPront Pro)

## Objetivo
Implementar recuperação semântica de protocolos clínicos com **pgvector** para alimentar prompts de consenso e suporte à decisão médica.

## Stack sugerida
- PostgreSQL + extensão `vector` (pgvector)
- Embeddings: `text-embedding-004` (Gemini) ou modelo equivalente de alta qualidade em português
- LLM de resposta: Gemini 2.0 Flash (primário) e Claude Sonnet (fallback)

## Esquema de dados (exemplo)
```sql
create table protocol_chunks (
  id uuid primary key,
  source_name text not null,
  source_type text not null, -- uptodate, sbd, aace, ada
  title text,
  section text,
  publication_year int,
  chunk_text text not null,
  chunk_tokens int,
  embedding vector(768),
  metadata jsonb,
  created_at timestamptz default now()
);

create index protocol_chunks_embedding_idx
  on protocol_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

## Pipeline de indexação
1. **Ingestão**
   - Coletar diretrizes licenciadas/permitidas e metadados (fonte, ano, seção).
2. **Normalização**
   - Limpeza de OCR, remoção de duplicatas, preservação de tabelas relevantes.
3. **Chunking semântico**
   - 400-800 tokens por chunk com overlap de 10-15%.
4. **Embedding**
   - Gerar embedding por chunk e salvar em `protocol_chunks`.
5. **Versionamento**
   - Registrar versão/ano da diretriz para auditoria.

## Pipeline de consulta
1. Receber pergunta clínica (ex.: "DM2 com obesidade e DRC estágio 3: primeira linha?").
2. Gerar embedding da pergunta.
3. Buscar top-k (k=8-15) por similaridade vetorial com filtro por fonte/ano quando aplicável.
4. Re-ranking opcional por modelo cross-encoder.
5. Montar contexto final com diversidade de fontes (mínimo 3 fontes).
6. Enviar para prompt `protocol-consensus.ts`.
7. Validar saída JSON + guardrails clínicos antes de entregar ao usuário.

## Estratégia de qualidade
- **Recall@k** de recomendações-chave por diretriz.
- **Source diversity score**: mínimo 3 fontes distintas por resposta.
- **Citation coverage**: cada afirmação importante deve apontar para ao menos um chunk recuperado.
- **Freshness**: penalizar recomendações antigas quando houver versões novas.

## Operação e custo
- Gemini 2.0 Flash para rotina e síntese.
- Claude Sonnet em fallback para falhas de provedor ou baixa confiança.
- Cache de embeddings por hash do chunk para evitar recomputação.
- Cache de respostas por pergunta normalizada + janela temporal curta.

## Segurança e compliance
- Sem inferência de diagnóstico definitivo.
- Sem prescrição automática.
- Logging obrigatório de consulta, chunks usados, versão das fontes e confiança.
- Revisão humana obrigatória antes de qualquer uso assistencial.
