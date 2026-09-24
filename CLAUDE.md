# CLAUDE.md — JurisFlow CRM (JurisFlow-ADV)

Guia de desenvolvimento para o Claude. Leia antes de qualquer alteração.
(Obs.: `AGENTS.md` / `AdvJuris.md` NÃO são guias de dev — são o prompt do agente jurídico AdvJuris usado dentro do app.)

## Visão geral
CRM jurídico SaaS multi-escritório (multi-tenant) para escritórios de advocacia.
Interface e textos em **português do Brasil**.

- **Pasta local:** `D:\Projetos\JurisFlow-ADV`
- **GitHub:** https://github.com/JLEnterprise/JurisFlowCRM (branch `main`)
- **Produção (Vercel):** https://juris-flow-adv.vercel.app — projeto `juris-flow-adv` (time `jl-enterprise`)
- **Supabase:** projeto `cbaanfpitqayqraizacv` (Postgres + Auth + Storage bucket `jurisflow-docs`)

## Stack
React 18 + Vite 6 (JS/JSX, sem TypeScript) · Tailwind CSS 3 · lucide-react · Recharts · jsPDF · date-fns · @supabase/supabase-js v2.
Sem React Router: a navegação é por estado (`currentTab`) em `src/App.jsx` (`switch (currentTab)`).
`vite.config.js` usa `base: './'`; `vercel.json` reescreve tudo para `/index.html` (SPA).

## Estrutura
```
src/
  App.jsx                  # shell: sidebar, header, roteamento por aba, modais globais
  main.jsx                 # providers (Theme, Auth, CRM)
  context/
    AuthContext.jsx        # login/cadastro Supabase Auth, perfil, RBAC (permissions)
    CRMContext.jsx         # estado central + CRUD + sync com Supabase (arquivo grande, ~85 KB)
    ThemeContext.jsx
  lib/supabase.js          # cliente Supabase (env VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, com fallback)
  services/
    storageService.js      # persistência (Supabase + fallback local), escritorio_id
    aiService.js, deepLegalEngine.js, systemPrompts.js   # copiloto jurídico AdvJuris
    pdfService.js, exportService.js, signatureService.js, whatsappService.js, brasilApiService.js
  agents/                  # framework do agente AdvJuris (core, specialists, tools, prompts)
  components/<modulo>/     # dashboard, leads, clients, contracts, proposals, processes,
                           # attendance, agenda, tasks, documents, financial, reports,
                           # team, security, settings, ai, whatsapp, layout, common, auth
  data/, utils/
supabase/migrations/, scripts/*.sql, *.sql na raiz   # SQL de schema/RLS (aplicado manualmente)
```

## Banco (Supabase, schema public — todas com RLS)
users, escritorios, office_settings, leads, clients, contracts, proposals, processes, tasks,
appointments, attendances, installments, documents, activity_logs, notifications, legal_areas, lead_sources.

## Regras de ouro
1. **Multi-tenant:** todo registro tem `escritorio_id`. Toda query/insert deve respeitar o escritório do usuário logado; RLS usa `public.current_user_escritorio_id()`. Nunca remover/afrouxar políticas RLS sem pedido explícito.
2. **Storage:** arquivos em `jurisflow-docs/{escritorio_id}/...`.
3. **Sem dados fictícios:** nada de usuários/clientes/contratos de exemplo (`INITIAL_USERS = []`).
4. **Mudanças no banco:** inspecionar tabelas antes; aplicar via migração e salvar o SQL em `supabase/migrations/AAAAMMDD_descricao.sql`.
5. **Segredos:** `.env` é ignorado pelo git; nunca commitar chaves (só a anon key é pública por design).
6. Manter o padrão visual existente (Tailwind, tema claro/escuro, ícones lucide).
7. Commits em português, estilo Conventional Commits (`feat(modulo): ...`, `fix(modulo): ...`).

## Comandos
- `npm install` · `npm run dev` (porta 3000) · `npm run build` · `npm run preview`
- Publicar: dar dois cliques em `PUBLICAR.bat` (git add/commit/push → Vercel faz o deploy automático a partir do GitHub).

## Fluxo de trabalho com o Claude (Cowork)
- O Claude edita os arquivos direto em `D:\Projetos\JurisFlow-ADV`.
- O Claude não roda comandos no PC do usuário: o usuário testa com `npm run dev` e publica com `PUBLICAR.bat`.
- O Claude tem acesso aos conectores Supabase (tabelas, SQL, logs, advisors) e Vercel (deploys, logs).

## Pendências conhecidas
- `BACKUP_JURISFLOW_CRM_ATUALIZADO.zip` (41 MB) está versionado no git — remover do repositório.
- Scripts avulsos na raiz (`check_*.js`, `fix_logo.js`, `embed_logo.js`, `purge_supabase.js`, `write_crm.cjs`, `test_ai_module.mjs`) — legado do Antigravity; mover para `scripts/` ou apagar.
- `agente.md` e `README.md` citam caminhos antigos (`C:\`, `E:\`).
- `netlify.toml` / `.netlify` são legado (hospedagem atual é Vercel).
