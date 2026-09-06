# 🏢 Guia de Arquitetura Multi-Tenant & Isolamento de Dados - JurisFlow CRM

Este documento explica detalhadamente como o **JurisFlow CRM** foi desenhado para ser comercializado no modelo **SaaS (Software as a Service)** para dezenas ou centenas de escritórios de advocacia diferentes, garantindo **100% de isolamento de dados, segurança de login e segregação de arquivos no Supabase**.

---

## 🔒 1. Princípio Fundamental de Isolamento

Em uma aplicação SaaS moderna, todos os escritórios clientes compartilham a mesma infraestrutura de banco de dados e aplicação (o que reduz custos de servidor para centavos), porém **nenhum escritório jamais consegue visualizar, consultar ou modificar dados de outro escritório**.

Isso é garantido por 3 camadas de blindagem:

1. **Camada de Identificação (Chave Mestra `escritorio_id`):** Todas as entidades possuem a coluna `escritorio_id UUID NOT NULL`.
2. **Camada de Banco de Dados (Row Level Security - RLS no PostgreSQL):** O próprio motor do banco de dados barra qualquer consulta fora do escritório do usuário.
3. **Camada de Storage (Segregação de Pastas `/jurisflow-docs/{escritorio_id}/...`):** Arquivos físicos são gravados e lidos exclusivamente dentro da subpasta do escritório.

---

## 🔑 2. Como Funciona a Divisão de Logins (Autenticação)

### Fluxo de Login do Usuário:
1. O usuário (ex: `advogado@escritorioalmeida.com.br`) insere seu e-mail e senha.
2. O **Supabase Auth** valida as credenciais criptografadas e emite um **Token JWT** seguro.
3. O sistema consulta a tabela `profiles` através do `auth.uid()`.
4. A tabela `profiles` contém o vínculo permanente:
   ```json
   {
     "id": "uuid-do-usuario-no-auth",
     "escritorio_id": "uuid-do-escritorio-almeida",
     "name": "Dr. Carlos Almeida",
     "roles": ["Advogado(a)", "Comercial/SDR"]
   }
   ```
5. **Imutabilidade:** O `escritorio_id` é gerenciado exclusivamente pelo servidor/admin do SaaS. O usuário não tem como alterar seu `escritorio_id` no navegador.

---

## 🛡️ 3. Como Funciona o Row Level Security (RLS) no Supabase

Mesmo que um usuário mal-intencionado abra o Console do Navegador (F12) e tente disparar um comando direto:
```javascript
// Tentativa de buscar todos os clientes de outro escritório
supabase.from('clients').select('*');
```

O PostgreSQL intercepta a requisição e aplica a política de segurança:
```sql
CREATE POLICY "RLS_clients_all" ON public.clients
    FOR ALL USING (escritorio_id = public.current_user_escritorio_id());
```

**Resultado:** O PostgreSQL só retorna os registros onde `escritorio_id` coincide exatamente com o escritório do usuário logado. **Risco de vazamento: ZERO.**

---

## 📁 4. Como Ficam os Diretórios de Arquivos no Supabase Storage

Quando um escritório faz upload de contratos, procurações ou PDFs, os arquivos são organizados na seguinte estrutura de diretórios no Bucket `jurisflow-docs`:

```text
jurisflow-docs/
├── [escritorio_id_1]/
│   ├── contratos/
│   │   ├── contrato_honorarios_102.pdf
│   │   └── minuta_trabalhista.docx
│   ├── documentos/
│   │   ├── rg_cliente_joao.pdf
│   │   └── comprovante_residencia.pdf
│   └── logos/
│       └── logo_escritorio_1.png
│
├── [escritorio_id_2]/
│   ├── contratos/
│   │   └── contrato_societario_99.pdf
│   └── documentos/
│       └── procuracao_assinada.pdf
```

### Regra de Proteção do Storage:
As políticas RLS do Storage garantem que o usuário autenticado só consiga listar, baixar ou subir arquivos dentro da pasta que começa com o seu próprio `escritorio_id`.

---

## 🚀 5. Como Adicionar um Novo Escritório Contratante (Venda do CRM)

Quando você fechar a venda do CRM para um novo cliente (ex: *Pinheiro & Associados*):

1. **Criação do Escritório:**
   - Inserir na tabela `escritorios` o nome do escritório, plano e limite de usuários.
2. **Cadastro do Primeiro Usuário (Administrador do Cliente):**
   - Criar o login com e-mail do sócio do escritório e vincular o `escritorio_id`.
3. **Gestão Interna da Equipe:**
   - O próprio sócio acessa o menu **Equipe** dentro do CRM e cadastra seus advogados, estagiários e secretárias.
   - Todos os usuários criados dentro do painel herdam automaticamente o `escritorio_id` do escritório contratante.
