# Regra 03: Arquitetura do JurisFlow CRM & Persistência

## Estado e Persistência de Dados
- Toda alteração de dados no CRM (clientes, processos, prazos, contratos, usuários) deve atualizar o estado local e o `localStorage` de forma síncrona e imediata (UI Otimista).
- Os modais de edição e criação devem fechar instantaneamente no momento da submissão/clique, sem depender de respostas lentas de rede.
- A sincronização com a nuvem (Supabase PostgreSQL) ocorre em segundo plano com tratamento resiliente de erros via `storageService.syncToSupabase`.

## Copiloto de IA
- O Copiloto opera no formato ChatGPT com histórico de conversação, suporte a Markdown e motor multi-provedor (Gemini API, OpenAI API e Motor Cognitivo Local AdvJuris).
