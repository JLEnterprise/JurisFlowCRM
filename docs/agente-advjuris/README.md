# Material do agente jurídico AdvJuris

Conteúdo **jurídico** (não é guia de desenvolvimento) criado no Antigravity para o copiloto AdvJuris.
O código que o app usa de fato está em `src/agents/` e `src/services/` (`aiService.js`,
`deepLegalEngine.js`, `systemPrompts.js`); estes arquivos são a fonte de onde aqueles prompts foram escritos.

| Arquivo/pasta | Conteúdo |
|---|---|
| `AdvJuris.md` | Prompt mestre do AdvJuris (52 regras) — fonte de `src/agents/prompts/advJurisPrompt.js` |
| `JurisAI-prompt-antigo.md` | Versão anterior do prompt ("JurisAI") |
| `regras/` | Regras do agente: postura de advogado sênior, prazos processuais, arquitetura do CRM |
| `skills/` | 7 skills jurídicas: prazos, petição/contestação, contratos de honorários, procuração, notificação extrajudicial, SISBAJUD, auditoria de risco |
| `mcp_config.antigravity.json` | Configuração de MCP do Antigravity (Gemini/OpenAI) — não funciona no Claude Code, só referência |

As skills estão no formato `SKILL.md`, o mesmo do Claude Code. Para usar alguma delas no
Claude Code, basta copiar a pasta para `.claude/skills/`.
