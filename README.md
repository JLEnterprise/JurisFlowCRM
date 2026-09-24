# JurisFlow CRM

CRM jurídico SaaS multi-escritório (multi-tenant) para escritórios de advocacia.

- **Produção:** https://juris-flow-adv.vercel.app (deploy automático da Vercel a partir da branch `main`)
- **Stack:** React 18 + Vite 6 + Tailwind CSS 3 + Supabase (Postgres, Auth, Storage)

## Rodar localmente
1. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. `npm install`
3. `npm run dev` (ou dois cliques em `INICIAR_JURISFLOW.bat`) → http://localhost:3000

## Publicar
Dois cliques em `PUBLICAR.bat` (testa o build, faz commit e push para o GitHub; a Vercel publica).

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `src/` | Código do app (componentes, contextos, serviços, agente AdvJuris) |
| `public/` | Arquivos estáticos (logo) |
| `supabase/migrations/` | Migrações SQL do banco (novas mudanças entram aqui) |
| `supabase/sql-legado/` | Scripts SQL antigos, aplicados manualmente na época do Antigravity |
| `docs/` | Arquitetura multi-tenant e material do agente jurídico AdvJuris |
| `.claude/skills/` | Skills do Claude Code (Supabase) |

Guia de desenvolvimento: [CLAUDE.md](CLAUDE.md).

## Backup do período Antigravity
O estado completo do projeto antes da migração para o Claude Code (incluindo arquivos que foram
removidos daqui) está preservado no GitHub:
- branch `backup/antigravity-2026-09-24`
- tag `antigravity-final`
