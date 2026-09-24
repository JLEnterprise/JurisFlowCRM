# SQL legado (período Antigravity)

Scripts que foram colados manualmente no SQL Editor do Supabase antes da migração para o Claude Code.
Ficam aqui só como **histórico/referência** — o banco atual já reflete o que foi aplicado.
**Não execute de novo sem revisar** (alguns apagam dados ou recriam políticas RLS).

| Arquivo | O que faz |
|---|---|
| `supabase_schema.sql` | Primeiro schema (04/09/2026), ainda com tabela `profiles` — desatualizado |
| `setup-supabase-multitenant.sql` | Cria `escritorios` e estrutura multi-tenant + RLS |
| `FIX_RLS_URGENTE.sql` | Corrige RLS com cast `::text` e `current_user_escritorio_id()` |
| `enable-realtime-all-tables.sql` | Adiciona as tabelas à publicação `supabase_realtime` |
| `clean-and-lock-proposals.sql` | ⚠️ Apaga propostas de teste (DELETE) |

Mudanças novas no banco vão em `supabase/migrations/AAAAMMDD_descricao.sql`.
