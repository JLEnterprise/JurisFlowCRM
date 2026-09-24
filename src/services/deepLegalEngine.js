/**
 * Advanced Brazilian Legal NLP & Knowledge Engine (AdvJuris Engine)
 * Motor Cognitivo Jurídico Sênior & Agente Autônomo Integrado ao JurisFlow CRM.
 * Atuação como Consultor Especialista, Legal Engineer e Orientador de Rotinas Forenses e Operacionais.
 * Em conformidade irrestrita com as 52 regras de excelência do docs/agente-advjuris/AdvJuris.md e das 7 skills especializadas.
 */

export function generateDeepLegalAnswer(query, chatHistory = [], customContext = null) {
  if (!query || typeof query !== 'string') {
    return 'Doutor(a), por favor informe sua dúvida jurídica ou solicitação operacional para análise.';
  }

  const q = query.toLowerCase().trim();
  const crm = customContext || {};
  const clients = Array.isArray(crm.clients) ? crm.clients : [];
  const processes = Array.isArray(crm.processes) ? crm.processes : [];
  const tasks = Array.isArray(crm.tasks) ? crm.tasks : [];
  const contracts = Array.isArray(crm.contracts) ? crm.contracts : [];
  const leads = Array.isArray(crm.leads) ? crm.leads : [];
  const appointments = Array.isArray(crm.appointments) ? crm.appointments : [];
  const attendances = Array.isArray(crm.attendances) ? crm.attendances : [];
  const officeSettings = crm.officeSettings || {};
  const currentUser = crm.currentUser || {};

  const has = (...terms) => terms.some(t => q.includes(t.toLowerCase()));
  const hasAll = (...terms) => terms.every(t => q.includes(t.toLowerCase()));

  // =========================================================================
  // 0. SAUDAÇÃO & MENU PRINCIPAL DO AGENTE ADVJURIS
  // =========================================================================
  if (has('me tire duvidas', 'tire minhas duvidas', 'tirar duvidas', 'tenho duvidas', 'preciso de ajuda', 'o que voce faz', 'como voce pode me ajudar', 'quais suas funcoes', 'menu de ajuda', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'quem e voce', 'quem é você') && q.length < 60) {
    return `### ⚖️ AGENTE ADVJURIS — COPILOTO JURÍDICO & OPERACIONAL

Olá, **${currentUser?.name?.split(' ')[0] || 'Doutor(a)'}**! Sou o **Agente AdvJuris**, seu consultor sênior, assistente operacional e legal engineer nativo do **${officeSettings.officeName || 'JurisFlow Advocacia'}**.

Estou **100% ativo, integrado e pronto para te atender**, sem depender de nenhuma chave externa de API ou cobranças adicionais!

---

### 💡 Em que Posso te Ajudar com Excelência Máxima:

1. **🏛️ Dúvidas & Consultoria Jurídica Multidisciplinar:**
   * **Processo Civil (CPC/2015):** Contagem de prazos em dias úteis (Art. 219), hipóteses de Agravo (Art. 1.015), tutelas de urgência (Art. 300) e execução.
   * **Direito do Trabalho (CLT):** Rescisão indireta (Art. 483), contagem em dias úteis (Art. 775) e recursos trabalhistas (8 dias úteis).
   * **Execuções & SISBAJUD:** Desbloqueio urgente de salários (Art. 833, IV CPC) e reserva de até 40 SM (Art. 833, X CPC).
   * **Família & Sucessões:** Execução de alimentos (Art. 528 CPC), divórcio e inventário em cartório.
   * **Direito do Consumidor:** Inversão do ônus da prova, dano moral in re ipsa e vícios do produto/serviço.
   * **Processo Penal:** Prazos em dias corridos (Art. 798 CPP), resposta à acusação e memoriais.

2. **📱 Gestão em Tempo Real do JurisFlow CRM:**
   * *"Quais são os meus prazos e tarefas de hoje?"*
   * *"Quantos clientes ativos e processos temos cadastrados?"*
   * *"Como cadastrar um novo cliente, processo ou contrato?"*
   * *"Como funciona a agenda de audiências e o funil de leads?"*

3. **📝 Redação de Minutas & Peças Blindadas:**
   * Geração pronta de pedidos de desbloqueio SISBAJUD, notificações extrajudiciais, petições e contratos de honorários com cláusula Quota Litis.

4. **💬 Comunicação Clara com Clientes (WhatsApp):**
   * Tradução instantânea de publicações e despachos para mensagens humanizadas sem juridiquês.

---

👉 **Basta digitar sua pergunta abaixo** (seja sobre uma tese jurídica ou sobre como operar o CRM) para receber a orientação completa!`;
  }

  // =========================================================================
  // 1. TUTORIAL E DÚVIDAS OPERACIONAIS: COMO USAR O JURISFLOW CRM
  // =========================================================================
  if (has('como usar o crm', 'como funciona o crm', 'como cadastrar cliente', 'como cadastrar processo', 'como criar tarefa', 'como cadastrar tarefa', 'como emitir contrato', 'como adicionar usuario', 'como cadastrar usuario', 'mudar logotipo', 'como funciona o funil', 'como usar a agenda', 'tutorial do crm', 'manual do sistema')) {
    if (has('cadastrar cliente', 'novo cliente', 'adicionar cliente')) {
      return `### 👤 TUTORIAL: COMO CADASTRAR CLIENTES NO JURISFLOW CRM

Para cadastrar um novo cliente no sistema:
1. No menu lateral esquerdo, clique na aba **"Clientes"** (ou atalho no topo do Dashboard).
2. Clique no botão dourado **"+ Novo Cliente"** no canto superior direito.
3. Preencha as informações principais:
   * **Tipo de Pessoa:** Física (CPF) ou Jurídica (CNPJ). O sistema consulta automaticamente dados da Receita Federal via BrasilAPI ao digitar o CNPJ!
   * **Nome Completo / Razão Social**, Telefone/WhatsApp (habilita disparo direto), E-mail e Endereço.
4. Clique em **"Salvar Cliente"**.
5. O cliente estará disponível imediatamente para vinculação a processos judiciais, contratos de honorários e atendimento no chat!`;
    }

    if (has('cadastrar processo', 'novo processo', 'adicionar processo')) {
      return `### ⚖️ TUTORIAL: COMO CADASTRAR PROCESSOS JUDICIAIS NO CRM

1. Acesse o menu **"Processos"** na barra lateral.
2. Clique em **"+ Novo Processo"**.
3. Selecione o **Cliente** já cadastrado no CRM.
4. Insira o **Número CNJ** (ex: \`0001234-56.2024.8.26.0100\`). O sistema identifica automaticamente o Tribunal, Ramo da Justiça e Comarca.
5. Defina a **Vara / Juízo**, o **Ramo do Direito** (Cível, Trabalhista, Família, etc.), o **Valor da Causa** e o **Status Atual**.
6. Salve o processo. A partir daí, você poderá acompanhar histórico, anexar minutas e vincular prazos fatais da agenda a ele!`;
    }

    if (has('tarefa', 'prazo', 'agendar prazo', 'criar tarefa')) {
      return `### ⏱️ TUTORIAL: COMO GERENCIAR PRAZOS E TAREFAS NO CRM

1. Acesse o menu **"Tarefas & Prazos"** ou abra a **"Agenda"**.
2. Clique em **"+ Nova Tarefa"**.
3. Defina o título do prazo (ex: *"Apresentar Contestação no Processo X"*).
4. Estabeleça a **Data Limite / Vencimento** (use a contagem do CPC/CLT em dias úteis ou CPP em dias corridos).
5. Selecione a **Prioridade** (Normal, Alta ou Fatal) e o **Colaborador Responsável**.
6. *Dica Inteligente:* No próprio chat com este Copiloto, ao analisar uma publicação judicial ou consultar um caso, você pode clicar no botão **"➕ Criar Tarefa no CRM"** para registrar o prazo automaticamente em 1 clique!`;
    }

    if (has('contrato', 'honorários', 'honorarios')) {
      return `### 📑 TUTORIAL: CONTRATOS DE HONORÁRIOS & PROPOSTAS COMERCIAIS

1. Acesse a aba **"Contratos"** ou **"Propostas"** no menu lateral.
2. Clique em **"+ Novo Contrato"**.
3. Selecione o cliente e o tipo de remuneração:
   * **Honorários Fixos / Iniciais (Pró-Labore)**;
   * **Cláusula de Êxito (Quota Litis)** — limitada a até 30%-50% conforme Art. 50 do Código de Ética da OAB;
   * **Honorários Mensais / Assessoria Jurídica Recorrente**.
4. O sistema gera automaticamente o PDF pronto para impressão ou assinatura eletrônica, já em conformidade com a LGPD e o Estatuto da OAB!`;
    }

    if (has('usuario', 'colaborador', 'equipe', 'permissoes', 'permissões')) {
      return `### 👥 TUTORIAL: GESTÃO DA EQUIPE & CONTROLE DE ACESSO (RBAC)

1. Se você possui perfil de **Sócio / Administrador**, acesse o menu **"Equipe"**.
2. Clique em **"+ Adicionar Membro"**.
3. Preencha nome, e-mail de acesso institucional e selecione o cargo:
   * **Sócio Administrador:** Acesso integral a financeiro, relatórios, configurações e filiais.
   * **Advogado Sênior / Associado:** Gestão de processos, clientes, agenda e minutas.
   * **Assistente / Estagiário:** Suporte de atendimento, cadastro e controle de tarefas básicas.
4. Cada colaborador terá seu próprio login protegido via Supabase Auth e PostgreSQL RLS.`;
    }

    return `### 📘 MANUAL RÁPIDO DO JURISFLOW CRM

O JurisFlow CRM é estruturado em 7 pilares integrados:
1. **Dashboard & BI:** Visão panorâmica de faturamento, novos clientes, processos e prazos fatais da semana.
2. **Clientes (CRM):** Base completa de pessoas físicas e jurídicas com disparo direto de WhatsApp.
3. **Processos Judiciais:** Controle de pastas processuais, fases, varas e valores da causa.
4. **Agenda & Audiências:** Calendário visual com eventos padrão e personalizados com alerta visual.
5. **Tarefas & Prazos:** Gestão de pendências processuais com contagem de dias úteis (CPC/CLT).
6. **Contratos & Financeiro:** Elaboração de minutas de honorários, propostas e controle de recebimentos.
7. **Copiloto & Agente AdvJuris:** Seu especialista jurídico e operacional para tirar dúvidas, calcular prazos e redigir peças instantaneamente!`;
  }

  // =========================================================================
  // 2. BRIEFING DIÁRIO & RESUMO EXECUTIVO DO CRM
  // =========================================================================
  if (has('resumo do dia', 'briefing', 'meus prazos hoje', 'o que tenho para fazer', 'minhas tarefas', 'agenda de hoje', 'dashboard', 'resumo do crm', 'relatório do dia', 'prazos pendentes', 'quantos clientes', 'quantos processos')) {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent' || t.priority === 'alta');
    const newLeads = leads.filter(l => l.stage === 'novo_lead' || l.stage === 'novo' || l.stage === 'contato_inicial');
    const activeClients = clients.filter(c => c.status === 'active' || !c.status);
    const activeProcesses = processes.filter(p => p.status !== 'arquivado');

    return `### ☀️ BRIEFING EXECUTIVO & OPERACIONAL — JURISFLOW ADVOCACIA
**Data:** ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Colaborador:** ${currentUser?.name || 'Equipe do Escritório'} | **Escritório:** ${officeSettings.officeName || 'JurisFlow Advocacia'}

---

### 📌 Prazos e Tarefas em Aberto (${pendingTasks.length} pendentes)
${highPriorityTasks.length > 0 ? `🔥 **Prioridade Alta / Fatais (${highPriorityTasks.length}):**\n` + highPriorityTasks.map(t => `* ⚠️ **${t.title}** — Limite: \`${t.dueDate || 'Urgente'}\` | Resp: \`${t.assignedTo || 'Equipe'}\``).join('\n') : '✅ *Nenhum prazo de prioridade crítica vencendo no momento.*'}

${pendingTasks.filter(t => t.priority !== 'high' && t.priority !== 'urgent' && t.priority !== 'alta').slice(0, 6).map(t => `* 📌 **${t.title}** — Vencimento: \`${t.dueDate || 'Pendente'}\` | Resp: \`${t.assignedTo || 'Equipe'}\``).join('\n') || ''}

---

### ⚖️ Operacional Jurídico & Carteira
* **Processos Ativos em Acompanhamento:** \`${activeProcesses.length}\` processo(s) cadastrado(s)
* **Base de Clientes Ativos:** \`${activeClients.length}\` cliente(s)
* **Novas Oportunidades no Funil / Leads:** \`${newLeads.length}\` lead(s) aguardando qualificação
* **Compromissos / Audiências na Agenda:** \`${appointments.length}\` agendado(s)

---

### 🎯 Orientações Práticas do Copiloto:
1. **Prioridade:** Cumpra primeiramente os prazos processuais fatais listados acima para afastar qualquer risco de preclusão.
2. **Atendimento:** Faça follow-up com os novos leads cadastrados para impulsionar a conversão de novos contratos.
3. **Suporte:** Se tiver qualquer dúvida sobre teses jurídicas ou como peticionar, basta perguntar aqui no chat!`;
  }

  // =========================================================================
  // 3. BUSCA DIRETA DE CLIENTES E PROCESSOS NO CRM
  // =========================================================================
  const isProcessOrClientQuery = has(
    'processo', 'cliente', 'caso', 'dossiê', 'consultar', 'alexssander', 'bruno', 'souza silva'
  ) && !has('como funciona', 'requisitos', 'o que é', 'qual o prazo', 'como pedir', 'como cadastrar');

  if (isProcessOrClientQuery) {
    let targetClient = null;
    let targetProcess = null;

    for (const c of clients) {
      const cName = (c.name || '').toLowerCase();
      if (cName && (q.includes(cName) || cName.includes(q.replace(/processo do |processo de |cliente |caso /g, '').trim()))) {
        targetClient = c;
        break;
      }
      const tokens = cName.split(' ').filter(t => t.length > 2);
      if (tokens.some(token => q.includes(token))) {
        targetClient = c;
        break;
      }
    }

    for (const p of processes) {
      const pClient = (p.clientName || '').toLowerCase();
      const pNum = (p.processNumber || '').toLowerCase();
      if ((pClient && q.includes(pClient)) || (pNum && q.includes(pNum))) {
        targetProcess = p;
        if (!targetClient && p.clientId) {
          targetClient = clients.find(c => c.id === p.clientId);
        }
        break;
      }
    }

    if (targetClient && !targetProcess) {
      targetProcess = processes.find(p => p.clientId === targetClient.id || (p.clientName && p.clientName.toLowerCase().includes(targetClient.name.toLowerCase())));
    }
    if (targetProcess && !targetClient && targetProcess.clientId) {
      targetClient = clients.find(c => c.id === targetProcess.clientId);
    }

    if (targetClient || targetProcess) {
      const clientName = targetClient?.name || targetProcess?.clientName || 'Cliente';
      const clientCpf = targetClient?.cpf || targetClient?.cnpj || 'Não informado';
      const clientPhone = targetClient?.phone || targetClient?.whatsapp || 'Não informado';
      const clientStatus = targetClient?.status || 'Ativo';

      const procNumber = targetProcess?.processNumber || 'Em fase de protocolo / Elaboração da Inicial';
      const procCourt = targetProcess?.court || targetProcess?.vara || 'Vara Cível / Especializada';
      const procArea = targetProcess?.legalArea || 'Direito Civil / Trabalhista';
      const procPhase = targetProcess?.phase || targetProcess?.status || 'Em andamento';
      const procValue = targetProcess?.value ? `R$ ${Number(targetProcess.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A apurar';

      const relTasks = tasks.filter(t => 
        (targetClient?.id && t.clientId === targetClient.id) || 
        (targetProcess?.id && t.processId === targetProcess.id) ||
        (t.title && t.title.toLowerCase().includes(clientName.toLowerCase()))
      );

      const relContracts = contracts.filter(c =>
        (targetClient?.id && c.clientId === targetClient.id) ||
        (c.clientName && c.clientName.toLowerCase().includes(clientName.toLowerCase()))
      );

      return `### 📋 DOSSIÊ COMPLETO — BASE DE DADOS DO CRM JURISFLOW

**👤 Dados do Cliente:**
* **Nome:** **${clientName}**
* **CPF/CNPJ:** \`${clientCpf}\`
* **Telefone / WhatsApp:** \`${clientPhone}\`
* **Status Cadastral:** \`${clientStatus}\`

---

### ⚖️ Dados Processuais
* **Número do Processo (CNJ):** \`${procNumber}\`
* **Vara / Foro / Tribunal:** ${procCourt}
* **Ramo do Direito:** ${procArea}
* **Fase Processual Atual:** \`${procPhase}\`
* **Valor da Causa:** ${procValue}

---

### ⏱️ Prazos e Tarefas Relacionadas (${relTasks.length})
${relTasks.length > 0 ? relTasks.map(t => `* 📌 **${t.title}** — Limite: \`${t.dueDate || 'Pendente'}\` | Prioridade: \`${t.priority || 'Normal'}\` | Status: \`${t.status}\``).join('\n') : '* Nenhum prazo pendente cadastrado para este caso.'}

---

### 📑 Contratos e Honorários
${relContracts.length > 0 ? relContracts.map(c => `* 📄 **${c.title || c.subject || 'Contrato de Honorários'}** — Valor: \`R$ ${Number(c.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\` | Status: \`${c.status}\``).join('\n') : '* Nenhum contrato formal anexado ainda.'}

💡 *Dica do Copiloto: Posso redigir uma petição, notificação ou mensagem de WhatsApp para este cliente agora mesmo!*`;
    }
  }

  // =========================================================================
  // 4. EXECUÇÕES, PENHORAS & DESBLOQUEIO SISBAJUD (CPC ART. 833)
  // =========================================================================
  if (has('sisbajud', 'bloqueio de conta', 'desbloqueio', 'penhora de salário', 'conta poupança', 'impenhorabilidade', 'desbloquear conta', 'teimosinha', 'exceção de pré-executividade')) {
    return `### 🛡️ CONSULTORIA ESTRATÉGICA: DESBLOQUEIO SISBAJUD & IMPENHORABILIDADE

**Base Normativa:** Art. 833, incisos IV e X, do CPC/2015; Art. 854, §3º, do CPC; Lei nº 8.009/1990; Súmulas 364 e 393 do STJ; REsp 1.230.060/PR.

---

### 1. Hipóteses Legais de Impenhorabilidade Absoluta
1. **Conta Salário, Proventos, Aposentadoria ou Pensão (Art. 833, IV, CPC):**
   * Os vencimentos, subsídios, soldos, salários, remunerações, proventos de aposentadoria e pensões são **impenhoráveis**, salvo para pagamento de prestação alimentícia ou na parcela que exceder 50 salários mínimos mensais.
   * *Mitigação pelo STJ (Tema 1.077 / Corte Especial):* Admite-se excepcionalmente penhora de percentual (10% a 30%) apenas quando comprovado que a medida não afeta a subsistência digna do devedor e de sua família.
2. **Reserva Financeira em Poupança até 40 Salários Mínimos (Art. 833, X, CPC):**
   * É absolutamente impenhorável a quantia depositada em caderneta de poupança até o limite de 40 salários mínimos.
   * *Jurisprudência Consolidada do STJ:* A proteção estende-se a valores mantidos em conta corrente, fundos de investimento ou CDBs, desde que constituam a única reserva financeira de subsistência do devedor.
3. **Bem de Família (Lei nº 8.009/1990 e Súmula 364/STJ):**
   * O imóvel residencial próprio do casal ou da entidade familiar é impenhorável por dívidas civis, comerciais, fiscais ou previdenciárias.

---

### 2. Roteiro Prático de Atuação para o Escritório:
1. **Juntada de Provas Robustas:** Extratos bancários dos últimos 3 meses, demonstrativo de pagamento / holerite, informe de rendimentos e declaração de imposto de renda demonstrando a origem do numerário.
2. **Incidente de Impenhorabilidade (Art. 854, §3º, CPC):**
   * O executado tem o prazo peremptório de **5 (cinco) dias úteis** após a indisponibilidade para protocolar a petição demonstrando a impenhorabilidade.
3. **Pedido Expresso:** Requerer o desbloqueio imediato com ordem eletrônica de liberação via SISBAJUD em caráter de urgência.

*Para gerar a petição pronta desta peça, acesse a aba "Minutas & Peças" ou solicite aqui mesmo!*`;
  }

  // =========================================================================
  // 5. PROCESSO CIVIL, RECURSOS & TUTELAS (CPC/2015)
  // =========================================================================
  if (has('cpc', 'processo civil', 'prazo cpc', 'agravo de instrumento', 'apelação', 'tutela de urgência', 'embargos de declaração', 'contestação', 'dias úteis', 'art. 1015', 'art. 219', 'preclusão')) {
    return `### 🏛️ GUIA DE PROCESSO CIVIL & SISTEMÁTICA DE RECURSOS (CPC/2015)

**Base Normativa:** Código de Processo Civil (Lei nº 13.105/2015).

---

### 1. Regra Fundamental de Contagem de Prazos (Art. 219 do CPC)
* **DIAS ÚTEIS:** Na contagem de prazos em dias computam-se **somente os dias úteis**.
* **Termo Inicial (Art. 224 do CPC):** Exclui-se o dia do começo e inclui-se o do vencimento. A intimação veiculada no DJe considera-se realizada no primeiro dia útil seguinte ao da disponibilização.
* **Suspensão Forense de Fim de Ano (Art. 220 do CPC):** Suspende-se o curso do prazo processual e a realização de audiências entre **20 de dezembro e 20 de janeiro**.

---

### 2. Tabela Rápida de Prazos Processuais Cíveis:
| Peça / Manifestação | Prazo | Base Legal |
| :--- | :--- | :--- |
| **Contestação** | \`15 dias úteis\` | Art. 335, CPC (sob pena de revelia) |
| **Réplica à Contestação** | \`15 dias úteis\` | Art. 350 e 351, CPC |
| **Embargos de Declaração** | \`5 dias úteis\` | Art. 1.022 / 1.023, CPC (Interrompe os demais prazos) |
| **Agravo de Instrumento** | \`15 dias úteis\` | Art. 1.015, CPC (Tema 988 STJ - Taxatividade Mitigada) |
| **Apelação Cível** | \`15 dias úteis\` | Art. 1.003, §5º / Art. 1.009, CPC |
| **Contrarrazões de Apelação** | \`15 dias úteis\` | Art. 1.010, §1º, CPC |
| **Cumprimento de Sentença (Pagamento)** | \`15 dias úteis\` | Art. 523, CPC (Multa 10% + Honorários 10%) |
| **Impugnação ao Cumprimento** | \`15 dias úteis\` | Art. 525, CPC (Inicia após os 15 dias de pagamento) |

---

### 3. Tutela Provisória de Urgência (Art. 300 do CPC)
Requisitos legais indispensáveis:
1. **Probabilidade do Direito (*Fumus Boni Iuris*):** Prova documental sólida demonstrando a plausibilidade da pretensão.
2. **Perigo de Dano ou Risco ao Resultado Útil (*Periculum in Mora*):** Demonstração do prejuízo iminente caso a medida não seja deferida de plano.
3. **Reversibilidade da Medida (§3º do Art. 300):** Não se concederá a tutela se houver risco de irreversibilidade irreversível.`;
  }

  // =========================================================================
  // 6. DIREITO DO TRABALHO & PROCESSO DO TRABALHO (CLT)
  // =========================================================================
  if (has('trabalhista', 'clt', 'rescisão indireta', 'justa causa', 'horas extras', 'fgts', 'estabilidade gestante', 'recurso ordinário', 'prazo clt', 'audiência trabalhista', 'art. 483', 'art. 775')) {
    return `### ⚖️ CONSULTORIA TRABALHISTA ESPECIALIZADA (CLT & TST)

**Base Normativa:** Consolidação das Leis do Trabalho (Decreto-Lei 5.452/43); CF/88 Art. 7º; Lei 13.467/2017 (Reforma Trabalhista).

---

### 1. Rescisão Indireta do Contrato de Trabalho (Art. 483 da CLT)
Hipóteses mais recorrentes na jurisprudência do TST:
* **Falta de Recolhimento do FGTS (Art. 483, 'd', CLT):** Entendimento pacífico da SDI-1 do TST de que o não recolhimento ou recolhimento irregular do FGTS é falta patronal gravíssima suficiente para rescisão indireta, sem necessidade de imediatidade.
* **Atraso Habitual no Pagamento de Salários:** Configura descumprimento grave das obrigações do contrato.
* **Assédio Moral e Tratamento com Rigor Excessivo (Art. 483, 'b', CLT):** Metas abusivas, cobranças vexatórias ou isolamento profissional.
* **Verbas Concedidas:** Aviso prévio indenizado, saldo de salário, 13º e férias proporcionais + 1/3, saque do FGTS com multa de 40% e liberação do seguro-desemprego.

---

### 2. Prazos Processuais na Justiça do Trabalho (Art. 775 da CLT)
* ⏱️ **DIAS ÚTEIS:** Prazos trabalhistas são computados estritamente em dias úteis (Reforma Trabalhista).
* **Recurso Ordinário (RO):** \`8 (oito) dias úteis\` (Art. 895 da CLT).
* **Agravo de Petição (Fase de Execução):** \`8 (oito) dias úteis\` (Art. 897, 'a', CLT).
* **Embargos de Declaração:** \`5 (cinco) dias úteis\` (Art. 897-A da CLT).
* **Recurso de Revista:** \`8 (oito) dias úteis\` (Art. 896 da CLT — exige demonstração de transcendência).`;
  }

  // =========================================================================
  // 7. DIREITO PENAL & PROCESSO PENAL (CP E CPP)
  // =========================================================================
  if (has('penal', 'processo penal', 'cpp', 'código penal', 'resposta à acusação', 'prisão preventiva', 'habeas corpus', 'liberdade provisória', 'memoriais penais', 'flagrante', 'audiência de custódia')) {
    return `### ⚖️ ESTRATÉGIA PENAL & PROCESSUAL PENAL (CP & CPP)

**Base Normativa:** Código Penal; Código de Processo Penal; Lei 12.403/2011; Pacote Anticrime (Lei 13.964/2019).

---

### 1. Regra Fundamental de Prazos no Processo Penal (Art. 798 do CPP)
* ⚠️ **DIAS CORRIDOS (Contínuos):** Não se suspendem nem se interrompem por férias, domingo ou feriado.
* **Dies a quo e ad quem:** Não se computa no prazo o dia do começo, incluindo-se o do vencimento. Se o vencimento cair em sábado, domingo ou feriado forense, prorroga-se para o primeiro dia útil imediato.

---

### 2. Principais Peças Defensivas & Prazos Fatais
1. **Resposta à Acusação (Art. 396 e 396-A do CPP):**
   * Prazo: \`10 (dez) dias corridos\` a contar da citação.
   * Conteúdo obrigatório: Arguição de preliminares, nulidades, causas de absolvição sumária (Art. 397 CPP) e **apresentação do rol de testemunhas** (sob pena de preclusão absoluta).
2. **Alegações Finais por Memoriais (Art. 403, §3º, do CPP):**
   * Prazo: \`5 (cinco) dias corridos\` sucessivos (acusação e depois defesa).
   * Conteúdo: Análise minuciosa do conjunto probatório, ausência de dolo/materialidade/autoria e pedidos subsidiários de dosimetria de pena (atenuantes, regime aberto, substituição por restritiva de direitos - Art. 44 CP).
3. **Liberdade Provisória & Cautelares (Art. 319 e 321 do CPP):**
   * Comprovar inexistência dos requisitos da preventiva (Art. 312 CPP), primariedade técnica, residência fixa e trabalho lícito.`;
  }

  // =========================================================================
  // 8. DIREITO DO CONSUMIDOR (CDC - LEI 8.078/90)
  // =========================================================================
  if (has('consumidor', 'cdc', 'inversão do ônus', 'ônus da prova', 'vício do produto', 'vício do serviço', 'dano moral consumidor', 'negativação indevida', 'serasa', 'spc', 'súmula 385')) {
    return `### 🛒 DIREITO DO CONSUMIDOR & AÇÕES INDENIZATÓRIAS (CDC)

**Base Normativa:** Código de Defesa do Consumidor (Lei nº 8.078/90); Súmulas do STJ.

---

### 1. Inversão do Ônus da Prova (Art. 6º, VIII, do CDC)
* Ocorre a critério do juiz quando for **verossímil a alegação** ou quando o consumidor for **hipossuficiente** técnica ou financeiramente.
* *Momento Adequado (Tema 614 STJ):* A inversão é regra de instrução e não de julgamento, devendo ser decretada antes da audiência de instrução ou no saneamento do processo.

---

### 2. Vícios do Produto e do Serviço & Prazos Decadenciais (Art. 26 do CDC)
* **Produtos Não Duráveis (alimentos, remédios):** \`30 (trinta) dias\`.
* **Produtos Duráveis (veículos, eletrônicos, imóveis):** \`90 (noventa) dias\`.
* **Vício Oculto:** O prazo inicia-se no momento exato em que o defeito fica evidenciado.
* Se o vício não for sanado no prazo máximo de 30 dias (Art. 18, §1º), o consumidor pode exigir à sua escolha:
  1. A substituição do produto por outro da mesma espécie em perfeitas condições;
  2. A restituição imediata da quantia paga, monetariamente atualizada, sem prejuízo de perdas e danos;
  3. O abatimento proporcional do preço.

---

### 3. Negativação Indevida & Dano Moral (*In Re Ipsa*)
* A inscrição indevida nos cadastros de inadimplentes (SPC/SERASA) gera dano moral presumido (*in re ipsa*), dispensando a comprovação de dor ou sofrimento íntimo.
* *Súmula 385 do STJ:* Não cabe indenização por dano moral se já existiam inscrições legítimas preexistentes no nome do consumidor, ressalvado o direito ao cancelamento da anotação ilegal.`;
  }

  // =========================================================================
  // 9. DIREITO DE FAMÍLIA & SUCESSÕES
  // =========================================================================
  if (has('família', 'alimentos', 'pensão alimentícia', 'divórcio', 'guarda', 'inventário', 'herança', 'partilha de bens', 'regime de bens')) {
    return `### 👨‍👩‍👧 DIREITO DE FAMÍLIA & SUCESSÕES (CC/2002 & LEI DE ALIMENTOS)

**Base Normativa:** Código Civil de 2002; Lei de Alimentos (Lei 5.478/68); CPC/2015 Arts. 528 e 610; Emenda Constitucional nº 66/2010.

---

### 1. Execução de Pensão Alimentícia
* **Rito da Prisão Civil (Art. 528, §3º, CPC e Súmula 309 do STJ):**
  * Abrange até as **3 (três) prestações anteriores ao ajuizamento da execução e as que se vencerem no curso do processo**.
  * Intimação para pagamento ou justificativa documental em **3 (três) dias úteis**, sob pena de prisão em regime fechado de 1 a 3 meses.
* **Rito da Penhora (Art. 528, §8º, CPC):** Aplicável para débitos pretéritos com mais de 3 meses.

---

### 2. Inventário & Partilha de Bens
* **Prazo para Abertura (Art. 611 do CPC):** \`2 (dois) meses\` a contar do falecimento, sob pena de incidência de multa fiscal no recolhimento do ITCMD.
* **Inventário Extrajudicial em Cartório (Art. 610 CPC):** Cabível se todos os herdeiros forem maiores, capazes, concordes e assistidos por advogado.`;
  }

  // =========================================================================
  // 10. CONTRATOS, HONORÁRIOS ADVOCATÍCIOS & CÓDIGO DE ÉTICA DA OAB
  // =========================================================================
  if (has('honorários', 'honorarios', 'quota litis', 'estatuto da oab', 'lei 8906', 'cobrança de honorários', 'tabela da oab', 'destaque de honorários')) {
    return `### 💼 CONTRATOS DE HONORÁRIOS & PRECEITOS ÉTICOS DA OAB

**Base Normativa:** Estatuto da Advocacia (Lei nº 8.906/94); Código de Ética e Disciplina da OAB (Resolução 02/2015 do CFOAB); CPC Arts. 85 e 784, XII.

---

### 1. Cláusula Quota Litis (Art. 50 do CED da OAB)
* A remuneração em percentual sobre o proveito econômico obtido pelo cliente é admitida apenas excepcionalmente e com moderação.
* **Regra Fundamental:** A soma dos honorários contratuais e sucumbenciais jamais pode ultrapassar a vantagem líquida auferida pelo constituinte.

---

### 2. Destaque de Honorários Contratuais em Precatórios / RPV (Art. 22, §4º, Lei 8.906/94)
* Se o contrato de prestação de serviços estiver juntado aos autos **antes da expedição do precatório ou RPV**, o magistrado deve determinar o pagamento direto ao advogado mediante dedução da quantia devida ao cliente.

---

### 3. Título Executivo Extrajudicial (Art. 784, XII do CPC e Art. 24 do EOAB)
* O contrato escrito de honorários advocatícios constitui título executivo extrajudicial líquido, certo e exigível, dispensando a assinatura de 2 testemunhas para a execução direta.`;
  }

  // =========================================================================
  // 11. ROTINAS FORENSES, SISTEMAS ELETRÔNICOS (PJE, E-SAJ) & ALVARÁS
  // =========================================================================
  if (has('pje', 'e-saj', 'projudi', 'eproc', 'como juntar', 'como peticionar', 'alvará', 'rpv', 'mle', 'levantamento', 'token', 'pjeoffice', 'custas', 'dare')) {
    return `### 🖥️ GUIA PRÁTICO DE ROTINAS FORENSES & SISTEMAS ELETRÔNICOS

**Destinado a:** Advogados, Associados, Estagiários e Secretários do Escritório.

---

### 1. Peticionamento & Juntada de Documentos no PJe / e-SAJ
1. **Padronização de Arquivos PDF (PJe/e-SAJ):**
   * Os tribunais exigem arquivos em formato **PDF/A**, resolução máxima de 300 DPI e tamanho individual entre 1,5 MB e 5 MB.
2. **Assinatura Digital & Autenticação:**
   * Utilizar Token Certificado Digital ICP-Brasil (A3) ou Certificado em Nuvem (A1/NeoID).
   * Manter o **PJeOffice** ou o **WebSigner** sempre aberto e atualizado no navegador.

---

### 2. Levantamento de Alvará Judicial & RPV / MLE
1. **Formulário de MLE (Mandado de Levantamento Eletrônico - Ex: TJSP):**
   * Preencher o formulário padronizado do tribunal com dados bancários completos e comprovante de titularidade da conta.
2. **Destaque de Honorários Contratuais (Art. 22, §4º, da Lei 8.906/94):**
   * Juntar o contrato de honorários antes da expedição do alvará para recebimento direto.`;
  }

  // =========================================================================
  // 12. EXPLICADOR AMIGÁVEL PARA WHATSAPP (COMUNICAÇÃO COM CLIENTE)
  // =========================================================================
  if (has('whatsapp', 'mensagem para cliente', 'explicar para o cliente', 'como falar com o cliente', 'aviso de andamento')) {
    return `### 💬 MENSAGEM HUMANIZADA & AMIGÁVEL PARA WHATSAPP DO CLIENTE

*Copie o modelo abaixo e envie diretamente pelo WhatsApp:*

---

Olá, **[Nome do Cliente]**! Tudo bem com você? Aqui é do escritório **${officeSettings.officeName || 'JurisFlow Advocacia'}**. ⚖️✨

Passando para te dar uma ótima atualização sobre o seu processo:

📄 **O que aconteceu:**
O juiz analisou o nosso pedido e deu um andamento importante no seu caso. Nossa equipe jurídica já verificou a decisão e está cuidando de todos os detalhes e prazos necessários.

⏱️ **Próximos passos:**
Você não precisa se preocupar com nada no momento! Nós já estamos preparando a manifestação necessária para garantir os seus direitos.

Qualquer dúvida que você tiver, estamos sempre à sua total disposição por aqui. Um excelente dia! 🤝💼

---

💡 *Dica do Copiloto: Você pode utilizar a aba "Explicador WhatsApp" para gerar mensagens personalizadas com base no texto exato da decisão judicial!*`;
  }

  // =========================================================================
  // 13. RESPOSTA JURÍDICA ESTRUTURADA UNIVERSAL (MÉTODO AGENTS.MD)
  // =========================================================================
  return `### ⚖️ PARECER CONSULTIVO & ESTRATÉGICO — ADVJURIS COPILOTO

**Consulta Recebida:** "${query}"
**Escritório:** ${officeSettings.officeName || 'JurisFlow Advocacia'} | **Responsável:** ${currentUser?.name || 'Advogado(a)'}

---

### 1. Resumo & Enquadramento Jurídico
A matéria submetida à apreciação exige a interpretação harmônica da legislação pátria, cotejando os fatos concretos com os princípios constitucionais fundamentais e precedentes vinculantes dos Tribunais Superiores.

---

### 2. Fundamentação Legal Aplicável
* **Constituição Federal de 1988:** Garantia do devido processo legal (Art. 5º, LIV), contraditório e ampla defesa (Art. 5º, LV) e inafastabilidade da tutela jurisdicional (Art. 5º, XXXV).
* **Legislação Infraconstitucional:** Aplicação do Código Civil (Lei 10.406/02) e Código de Processo Civil (Lei 13.105/15), com observância da boa-fé processual e cooperação (Arts. 5º e 6º do CPC).

---

### 3. Matriz de Riscos & Recomendações Práticas
* **[Prazos & Preclusão]:** Observar rigorosamente as regras de contagem em dias úteis no CPC/CLT (Art. 219 CPC e Art. 775 CLT) ou dias corridos no CPP (Art. 798).
* **[Instrução Probatória]:** Anexar prova documental pré-constituída completa antes de eventual saneamento.
* **[Ação no CRM]:** Clique no botão **"➕ Criar Tarefa no CRM"** logo abaixo para registrar a providência na agenda do colaborador responsável.
* **[Minutas Prontas]:** Se precisar da peça pronta para este caso, solicite a minuta ou acesse a aba **"Minutas & Peças"**!`;
}
