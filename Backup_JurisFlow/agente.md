# 🤖 JurisFlow CRM - Guia do Agente & Manual de Desenvolvimento

Este documento é a diretriz oficial para o desenvolvimento, manutenção e evolução do **JurisFlow CRM** (Sistema Integrado de Gestão Comercial Jurídica).

---

## 📌 Diretórios Oficiais do Projeto & Acesso Rápido

- 📁 **Diretório Principal de Trabalho (C:)**: `C:\JurisFlow-ADV`
- 📁 **Diretório Espelho & Backup (E:)**: `E:\JurisFlow-ADV`
- 📁 **Diretório de Configurações dos Agentes**: `E:\Agente1 - Antigraviy`
- 🌐 **URL Oficial do CRM em Produção (Netlify)**: [https://jurisflowcrmofc.netlify.app](https://jurisflowcrmofc.netlify.app)
- 🖥️ **Execução Local Direta (Sem Servidor)**: `C:\JurisFlow-ADV\dist\index.html`
- 🗄️ **Schema SQL do Banco Supabase**: `C:\JurisFlow-ADV\supabase_schema.sql`
- 📦 **Arquivo de Backup Compactado**: `C:\JurisFlow-ADV\BACKUP_JURISFLOW_CRM_ATUALIZADO.zip`

---

## 🏛️ Arquitetura do CRM & Stack Tecnológico

- **Frontend**: React 18, Vite 6, Tailwind CSS 3, Lucide React, Recharts (BI & Gráficos), jsPDF.
- **Backend / Nuvem**: Supabase PostgreSQL Cloud (`https://cbaanfpitqayqraizacv.supabase.co` / Ref: `cbaanfpitqayqraizacv`).
- **Hospedagem & CDN**: Netlify (`jurisflowcrmofc.netlify.app`).
- **Roteamento & Assets**: `base: './'` no `vite.config.js` com redirecionamentos SPA (`public/_redirects` e `netlify.toml`).

---

## 🔑 Regras de Negócio e Funcionalidades Implementadas

1. **Autenticação & Registro de Usuários**:
   - Tela inicial limpa, sem funcionários de teste (`INITIAL_USERS = []`).
   - Abas **Entrar** e **Criar Conta**.
   - Cadastro cria a conta no **Supabase Auth** e sincroniza na tabela `profiles` do Supabase PostgreSQL.
   - Login com fallback inteligente: autentica e salva o perfil local e remotamente sem bloqueios.

2. **Carregamento de Imagens do Dispositivo**:
   - Os campos de foto de perfil (`TeamView.jsx`) e logotipo do escritório (`SettingsView.jsx`) permitem que o usuário escolha qualquer foto diretamente do seu próprio computador ou celular via upload local (Base64 Data URL).

3. **Multi-Escritórios e Permissões (RBAC)**:
   - Suporte a múltiplas filiais (`branches` / `escritorios`) com controle rigoroso de permissões e segurança por papel.

4. **Eventos Personalizados na Agenda (`CalendarView.jsx` e `EventModal.jsx`)**:
   - Suporte tanto a tipos pré-definidos (Consulta, Reunião, Audiência, Prazo, etc.) quanto a tipos 100% personalizados digitados livremente pelo usuário, com destaque visual em degradê dourado, ícone de destaque e edição completa.

---

## 🛠️ Comandos Úteis de Desenvolvimento

- **Iniciar Servidor Dev**: `cd C:\JurisFlow-ADV; npm run dev`
- **Gerar Build de Produção**: `cd C:\JurisFlow-ADV; npm run build`
- **Publicar Atualização no Netlify**: `cd C:\JurisFlow-ADV; npx netlify-cli deploy --prod --dir=dist`
