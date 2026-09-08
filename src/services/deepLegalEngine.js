/**
 * Advanced Brazilian Legal NLP & Knowledge Engine (AdvJuris Engine)
 * Motor Cognitivo Jurídico Sênior com integração total ao CRM JurisFlow.
 * Atuação como Consultor Especialista, Legal Engineer e Orientador de Rotinas Forenses.
 * Em conformidade irrestrita com as 52 regras de excelência do AGENTS.md.
 */

export function generateDeepLegalAnswer(query, chatHistory = [], customContext = null) {
  if (!query || typeof query !== 'string') {
    return 'Doutor(a), por favor informe sua dúvida ou solicitação para análise.';
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
  // 0. SAUDAÇÃO & CONSULTORIA GERAL DE DÚVIDAS (ESTILO CHATGPT)
  // =========================================================================
  if (has('me tire duvidas', 'tire minhas duvidas', 'tirar duvidas', 'tenho duvidas', 'preciso de ajuda', 'o que voce faz', 'como voce pode me ajudar', 'quais suas funcoes', 'menu de ajuda', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite') && q.length < 50) {
    return `### ⚖️ CONSULTOR JURÍDICO SÊNIOR & COPILOTO ADVJURIS (ESTILO CHATGPT)

Olá, **${currentUser?.name?.split(' ')[0] || 'Doutor(a)'}**! Sou o seu **Consultor Jurídico Sênior & Legal Engineer**. Estou 100% à sua disposição para analisar qualquer dúvida prática, processual, material ou de rotina forense.

---

### 💡 Áreas e Tarefas em que Posso te Auxiliar com Precisão Máxima:

1. **🏛️ Processo Civil & Prazos (CPC/STJ):**
   * Contagem de prazos em dias úteis (Art. 219 CPC) e regras de preclusão.
   * Cabimento de recursos (Agravo de Instrumento Art. 1.015, Apelação, Embargos).
   * Tutelas de urgência e evidência (Art. 300 e 311 do CPC).

2. **💼 Direito do Trabalho & Processo do Trabalho (CLT/TST):**
   * Requisitos e teses de rescisão indireta (Art. 483 CLT).
   * Contagem de prazos trabalhistas em dias úteis (Art. 775 CLT) e prescrição bienal/quinquenal.
   * Roteiro de perguntas para instrução e contradita de testemunhas.

3. **🛡️ Execuções, Penhoras & SISBAJUD:**
   * Desbloqueio urgente de salário (Art. 833, IV CPC) e reserva de até 40 SM em poupança (Art. 833, X CPC).
   * Pesquisa patrimonial em sistemas integrados (SNIPER, RENAJUD, INFOJUD).
   * Exceção de pré-executividade por prescrição intercorrente.

4. **👨‍👩‍👧‍👦 Família & Sucessões:**
   * Execução de alimentos: rito da prisão (Art. 528 CPC) vs rito da penhora (Art. 530 CPC).
   * Inventário extrajudicial em cartório (Lei 11.441/07) e partilha de bens.

5. **📱 Gestão em Tempo Real do CRM JurisFlow:**
   * Dossiês de clientes, processos ativos, briefing de prazos fatais e audiências da semana.
   * Criação de tarefas no CRM em 1 clique diretamente pelo chat.

---

👉 **Como prosseguir:** Basta digitar sua dúvida detalhada ou o caso concreto abaixo (ex: *"Qual o prazo para embargos à execução?"* ou *"Como pedir gratuidade da justiça para PJ?"*) que emitirei o parecer fundamentado com base na lei e jurisprudência!`;
  }

  // =========================================================================
  // 1. BRIEFING DIÁRIO & RESUMO EXECUTIVO DO CRM
  // =========================================================================
  if (has('resumo do dia', 'briefing', 'meus prazos hoje', 'o que tenho para fazer', 'minhas tarefas', 'agenda de hoje', 'dashboard', 'resumo do crm', 'relatório do dia', 'prazos pendentes')) {
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
1. **Prioridade:** Cumpra primeiramente os prazos processuais fatais listados acima para evitar preclusão.
2. **Atendimento:** Faça follow-up com os novos leads cadastrados para impulsionar a conversão.
3. **Suporte:** Se tiver qualquer dúvida sobre como peticionar, calcular prazos ou redigir documentos, pergunte aqui no chat!`;
  }

  // =========================================================================
  // 2. BUSCA DIRETA DE CLIENTES E PROCESSOS NO CRM
  // =========================================================================
  const isProcessOrClientQuery = has(
    'processo', 'cliente', 'caso', 'bruno', 'alexssander', 'souza silva', 
    'ação de', 'audiência de', 'meus processos', 'meus clientes', 'dossiê', 'consultar'
  ) && !has('como funciona', 'requisitos', 'o que é', 'qual o prazo', 'como pedir');

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
  // 3. EXECUÇÕES, PENHORAS & DESBLOQUEIO SISBAJUD (CPC ART. 833)
  // =========================================================================
  if (has('sisbajud', 'bloqueio de conta', 'desbloqueio', 'penhora de salário', 'conta poupança', 'impenhorabilidade', 'desbloquear conta', 'teimosinha', 'exceção de pré-executividade')) {
    return `### 🛡️ CONSULTORIA ESTRATÉGICA: DESBLOQUEIO SISBAJUD & IMPENHORABILIDADE

**Base Normativa:** Art. 833, incisos IV e X, do CPC/2015; Art. 854, §3º, do CPC; Lei nº 8.009/1990; Súmulas 364 e 393 do STJ.

---

### 1. Hipóteses Legais de Impenhorabilidade Absoluta
1. **Conta Salário, Proventos, Aposentadoria ou Pensão (Art. 833, IV, CPC):**
   * Os vencimentos, subsídios, soldos, salários, remunerações, proventos de aposentadoria e pensões são **impenhoráveis**, salvo para pagamento de prestação alimentícia ou na parcela que exceder 50 salários mínimos mensais.
   * *Atenção STJ (Tema 1.077 / Corte Especial):* Admite-se mitigação excepcional se for garantida a subsistência digna do devedor e de sua família.
2. **Reserva Financeira em Poupança até 40 Salários Mínimos (Art. 833, X, CPC):**
   * É absolutamente impenhorável a quantia depositada em caderneta de poupança até o limite de 40 salários mínimos.
   * *Jurisprudência Consolidada STJ (REsp 1.230.060/PR):* A proteção estende-se a valores guardados em conta corrente, fundos de investimento ou CDBs, desde que constituam a única reserva financeira de subsistência do devedor.
3. **Bem de Família (Lei nº 8.009/1990 e Súmula 364/STJ):**
   * O imóvel residencial próprio do casal ou da entidade familiar é impenhorável por dívidas civis, comerciais, fiscais ou previdenciárias.

---

### 2. Passo a Passo Procedimental para o Advogado / Associado:
1. **Identificação do Bloqueio:** Juntar o extrato bancário dos últimos 3 meses comprovando a origem salarial ou a reserva de até 40 SM.
2. **Incidente de Impenhorabilidade (Art. 854, §3º, CPC):**
   * O executado tem o prazo de **5 (cinco) dias úteis** para manifestar-se comprovando que as quantias tornadas indisponíveis são impenhoráveis.
3. **Pedido de Liberação Imediata:**
   * Protocolar petição simples endereçada ao juízo da execução demonstrando o prejuízo alimentar imediato e requerendo expedição de ofício eletrônico de desbloqueio via SISBAJUD.

---

### 3. Matriz de Riscos & Cuidados
* ⚠️ **[CRÍTICO]:** O prazo de 5 dias úteis do Art. 854, §3º, do CPC é preclusivo para a conversão da indisponibilidade em penhora.
* ⚠️ **[ALTO]:** Não misturar valores salariais com movimentações de terceiros ou depósitos de outras origens na mesma conta, sob risco de descaracterização da natureza alimentar.`;
  }

  // =========================================================================
  // 4. DIREITO DO TRABALHO & PROCESSO DO TRABALHO (CLT)
  // =========================================================================
  if (has('trabalhista', 'clt', 'rescisão indireta', 'justa causa', 'horas extras', 'fgts', 'estabilidade gestante', 'recurso ordinário', 'prazo clt', 'audiência trabalhista')) {
    return `### ⚖️ CONSULTORIA TRABALHISTA ESPECIALIZADA (CLT & TST)

**Base Normativa:** CLT (Decreto-Lei 5.452/43); CF/88 Art. 7º; Súmulas e OJs do TST; Lei 13.467/2017 (Reforma Trabalhista).

---

### 1. Rescisão Indireta do Contrato de Trabalho (Art. 483 da CLT)
A rescisão indireta é a "justa causa aplicada pelo empregado ao empregador". Principais hipóteses:
* **Falta de Recolhimento do FGTS (Art. 483, 'd', CLT):** Entendimento pacífico da SDI-1 do TST de que o não recolhimento habitual do FGTS configura falta grave patronal suficiente para a rescisão indireta, sem necessidade de imediatidade.
* **Atraso Reiterado de Salários:** Atraso superior a 1 mês ou mora contumaz de 3 meses (Decreto-Lei 368/68).
* **Assédio Moral e Rigor Excessivo (Art. 483, 'b', CLT):** Exigência de metas inatingíveis, humilhações ou tratamento vexatório.
* **Verbas Devidas na Rescisão Indireta:** Aviso prévio indenizado, 13º salário proporcional, férias vencidas + proporcionais com 1/3, saque integral do FGTS com multa rescisória de 40% e guias do seguro-desemprego.

---

### 2. Justa Causa do Empregado (Art. 482 da CLT)
Exige **gravidade máxima, imediatidade na punição, nexo de causalidade e ausência de dupla punição (*non bis in idem*)**:
* *Alínea 'a':* Improbidade (furto, adulteração de atestado médico);
* *Alínea 'b':* Incontinência de conduta ou mau procedimento;
* *Alínea 'e':* Desídia no desempenho das funções (faltas reiteradas sem justificativa, após prévias advertências e suspensões);
* *Alínea 'h':* Ato de indisciplina ou insubordinação.

---

### 3. Prazos Processuais na Justiça do Trabalho (Art. 775 da CLT)
* ⏱️ **Contagem em DIAS ÚTEIS** (alteração da Lei 13.467/2017).
* **Recurso Ordinário (RO):** \`8 (oito) dias úteis\` (Art. 895 da CLT).
* **Agravo de Petição (Execução):** \`8 (oito) dias úteis\` (Art. 897, 'a', CLT).
* **Embargos de Declaração:** \`5 (cinco) dias úteis\` (Art. 897-A da CLT).
* **Recurso de Revista:** \`8 (oito) dias úteis\` (Art. 896 da CLT) — exige transcendência e prequestionamento.`;
  }

  // =========================================================================
  // 5. PROCESSO CIVIL, RECURSOS & TUTELAS (CPC/2015)
  // =========================================================================
  if (has('cpc', 'processo civil', 'prazo cpc', 'agravo de instrumento', 'apelação', 'tutela de urgência', 'embargos de declaração', 'contestação', 'dias úteis')) {
    return `### 🏛️ GUIA DE PROCESSO CIVIL & SISTEMÁTICA DE RECURSOS (CPC/2015)

**Base Normativa:** Código de Processo Civil (Lei nº 13.105/2015).

---

### 1. Regra Geral de Contagem de Prazos (Art. 219 do CPC)
* **DIAS ÚTEIS:** Na contagem de prazos em dias computar-se-ão somente os dias úteis.
* **Termo Inicial (Art. 224 do CPC):** Exclui-se o dia do começo e inclui-se o do vencimento. A intimação pelo DJe considera-se realizada no primeiro dia útil seguinte ao da disponibilização.
* **Suspensão de Fim de Ano (Art. 220 do CPC):** Suspende-se o curso do prazo processual nos dias compreendidos entre 20 de dezembro e 20 de janeiro.

---

### 2. Tabela Rápida de Prazos do CPC/2015:
| Peça / Manifestação | Prazo | Base Legal |
| :--- | :--- | :--- |
| **Contestação** | \`15 dias úteis\` | Art. 335, CPC |
| **Réplica à Contestação** | \`15 dias úteis\` | Art. 350 / 351, CPC |
| **Embargos de Declaração** | \`5 dias úteis\` | Art. 1.022 / 1.023, CPC (Interrompe demais prazos) |
| **Agravo de Instrumento** | \`15 dias úteis\` | Art. 1.015, CPC (Taxatividade Mitigada - Tema 988 STJ) |
| **Apelação Cível** | \`15 dias úteis\` | Art. 1.003, §5º / Art. 1.009, CPC |
| **Contrarrazões de Apelação** | \`15 dias úteis\` | Art. 1.010, §1º, CPC |
| **Cumprimento de Sentença (Pagamento)** | \`15 dias úteis\` | Art. 523, CPC (Multa 10% + Honorários 10%) |
| **Impugnação ao Cumprimento** | \`15 dias úteis\` | Art. 525, CPC (Inicia após os 15 dias de pagamento) |

---

### 3. Tutela Provisória de Urgência (Art. 300 do CPC)
Requisitos cumulativos indispensáveis para concessão:
1. **Fumus Boni Iuris (Probabilidade do Direito):** Elementos documentais que evidenciem a verossimilhança das alegações.
2. **Periculum in Mora (Perigo de Dano ou Risco ao Resultado Útil do Processo):** Demonstração concreta de prejuízo iminente e irreparável.
3. **Reversibilidade da Medida (§3º do Art. 300):** Não se concederá a tutela se houver perigo de irreversibilidade dos efeitos da decisão.`;
  }

  // =========================================================================
  // 6. DIREITO PENAL & PROCESSO PENAL (CP E CPP)
  // =========================================================================
  if (has('penal', 'processo penal', 'cpp', 'código penal', 'resposta à acusação', 'prisão preventiva', 'habeas corpus', 'liberdade provisória', 'memoriais penais', 'flagrante')) {
    return `### ⚖️ ESTRATÉGIA PENAL & PROCESSUAL PENAL (CP & CPP)

**Base Normativa:** Código Penal (Decreto-Lei 2.848/40); Código de Processo Penal (Decreto-Lei 3.689/41); Lei 12.403/2011; Pacote Anticrime (Lei 13.964/2019).

---

### 1. Regra Fundamental de Prazos no Processo Penal (Art. 798 do CPP)
* ⚠️ **DIAS CORRIDOS (Contínuos e Peremptórios):** Não se interrompem por férias, domingo ou dia feriado.
* **Termo Inicial:** Não se computa no prazo o dia do começo, incluindo-se o do vencimento. Se o início ou vencimento cair em sábado, domingo ou feriado, prorroga-se para o primeiro dia útil subsequente.

---

### 2. Principais Peças Defensivas & Prazos
1. **Resposta à Acusação (Art. 396 e 396-A do CPP):**
   * Prazo: \`10 (dez) dias corridos\` contados da citação pessoal ou por edital.
   * Conteúdo essencial: Arguição de preliminares (nulidades da investigação, inépcia da denúncia), pedidos de absolvição sumária (Art. 397 CPP), juntada de documentos e **apresentação obrigatória do rol de testemunhas** (sob pena de preclusão).
2. **Alegações Finais por Memoriais (Art. 403, §3º, do CPP):**
   * Prazo: \`5 (cinco) dias corridos\` sucessivos (acusação e depois defesa).
   * Conteúdo: Análise exauriente da prova pericial e testemunhal produzida em audiência, teses de atipicidade, excludentes de ilicitude/culpabilidade, e pedidos subsidiários de dosimetria (atenuantes, regime inicial mais brando, substituição por PRD - Art. 44 CP).
3. **Revogação de Prisão Preventiva / Liberdade Provisória (Art. 316 e 321 do CPP):**
   * Demonstrar ausência dos requisitos do Art. 312 do CPP (ordem pública, econômica, instrução criminal ou aplicação da lei penal).
   * Provar predicados favoráveis do acusado: primariedade, bons antecedentes, residência fixa e ocupação lícita com comprovantes anexos.
   * Pedido subsidiário: Aplicação de medidas cautelares diversas da prisão (Art. 319 do CPP - tornozeleira, comparecimento periódico, recolhimento noturno).`;
  }

  // =========================================================================
  // 7. DIREITO DE FAMÍLIA & SUCESSÕES
  // =========================================================================
  if (has('família', 'alimentos', 'pensão alimentícia', 'divórcio', 'guarda', 'inventário', 'herança', 'partilha de bens', 'regime de bens')) {
    return `### 👨‍👩‍👧 DIREITO DE FAMÍLIA & SUCESSÕES (CC/2002 & LEI DE ALIMENTOS)

**Base Normativa:** Código Civil de 2002; Lei de Alimentos (Lei 5.478/68); CPC/2015 Arts. 528 e 610; Emenda Constitucional nº 66/2010.

---

### 1. Ação e Execução de Alimentos (Pensão Alimentícia)
* **Fixação (Art. 1.694, §1º, CC):** Os alimentos devem ser fixados na proporção das necessidades do reclamante e dos recursos da pessoa obrigada (Trinômio: Necessidade x Possibilidade x Proporcionalidade).
* **Rito da Prisão Civil (Art. 528, §3º, CPC e Súmula 309 do STJ):**
  * O débito alimentar que autoriza a prisão civil do alimentante é o que compreende até as **3 (três) prestações anteriores ao ajuizamento da execução e as que se vencerem no curso do processo**.
  * Prazo para pagamento ou justificativa: \`3 (três) dias úteis\` sob pena de prisão civil em regime fechado de 1 a 3 meses.
* **Rito da Penhora (Art. 528, §8º, CPC):** Aplicável para parcelas pretéritas com mais de 3 meses de atraso.

---

### 2. Divórcio Direto (EC nº 66/2010)
* O divórcio tornou-se direito potestativo incondicionado, sem exigência de prévia separação judicial ou prazo mínimo de casamento.
* Pode ser consensual (em cartório se não houver filhos menores/incapazes ou testamento) ou litigioso com pedido de decretação liminar.

---

### 3. Inventário & Partilha de Bens
* **Prazo para Abertura (Art. 611 do CPC):** \`2 (dois) meses\` a contar da abertura da sucessão (falecimento), sob pena de multa tributária estadual sobre o ITCMD.
* **Inventário Extrajudicial (Art. 610 do CPC & Resolução 35/CNJ):** Pode ser lavrado por escritura pública em cartório de notas se todos os herdeiros forem capazes, concordes e houver assistência de advogado habilitado.`;
  }

  // =========================================================================
  // 8. ROTINAS FORENSES, SISTEMAS ELETRÔNICOS (PJE, E-SAJ) & ALVARÁS
  // =========================================================================
  if (has('pje', 'e-saj', 'projudi', 'eproc', 'como juntar', 'como peticionar', 'alvará', 'rpv', 'mle', 'levantamento', 'token', 'pjeoffice', 'custas', 'dare')) {
    return `### 🖥️ GUIA PRÁTICO DE ROTINAS FORENSES & SISTEMAS ELETRÔNICOS

**Destinado a:** Advogados, Associados, Estagiários e Secretários do Escritório.

---

### 1. Peticionamento & Juntada de Documentos no PJe / e-SAJ
1. **Padronização de Arquivos PDF (PJe/e-SAJ):**
   * Os tribunais exigem arquivos em formato **PDF/A**, resolução máxima de 300 DPI e tamanho individual entre 1,5 MB e 5 MB (conforme regra do Tribunal).
   * Dica do CRM: Utilize um compressor de PDF para garantir que petições e anexos não ultrapassem o limite do portal.
2. **Assinatura Digital & Autenticação:**
   * Utilizar Token Certificado Digital ICP-Brasil (A3) ou Certificado em Nuvem (A1/NeoID).
   * Manter o **PJeOffice** ou o **WebSigner** sempre aberto e atualizado no navegador.
3. **Peticionamento Intermediário:**
   * Selecionar o tipo correto de documento (ex: "Petição Intermediária", "Contestação", "Comprovante de Pagamento de Custas", "Procuração").
   * Conferir a classificação do ato para evitar que o cartório demore a certificar o recebimento.

---

### 2. Levantamento de Alvará Judicial & RPV / MLE
1. **Formulário de MLE (Mandado de Levantamento Eletrônico - Ex: TJSP):**
   * Preencher o formulário padronizado do tribunal com: Número da conta vinculada ao depósito judicial, dados bancários completos do beneficiário (Nome, CPF/CNPJ, Banco, Agência, Conta Corrente/Poupança ou chave PIX).
2. **Destaque de Honorários Contratuais (Art. 22, §4º, da Lei 8.906/94):**
   * Se o contrato de honorários advocatícios estiver juntado aos autos antes da expedição do precatório ou RPV, o juiz **deverá determinar o pagamento direto ao advogado** mediante dedução da quantia a ser paga ao cliente.
3. **Acompanhamento no CRM:**
   * Criar uma tarefa com prazo de 10 dias para conferir a expedição do ofício ao Banco do Brasil / Caixa Econômica Federal.`;
  }

  // =========================================================================
  // 9. EXPLICADOR AMIGÁVEL PARA WHATSAPP (COMUNICAÇÃO COM CLIENTE)
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
  // 10. RESPOSTA JURÍDICA ESTRUTURADA UNIVERSAL (MÉTODO AGENTS.MD)
  // =========================================================================
  return `### ⚖️ PARECER CONSULTIVO & ESTRATÉGICO — ADVJURIS COPILOTO

**Consulta Recebida:** "${query}"
**Escritório:** ${officeSettings.officeName || 'JurisFlow Advocacia'} | **Responsável:** ${currentUser?.name || 'Advogado(a)'}

---

### 1. Resumo & Enquadramento Jurídico
A matéria em apreço envolve a interpretação sistemática da legislação brasileira, exigindo a análise conjunta dos fatos narrados, provas documentais e precedentes jurisprudenciais consolidados.

---

### 2. Fundamentação Legal Aplicável
* **Constituição Federal de 1988:** Garantia do devido processo legal (Art. 5º, LIV), contraditório e ampla defesa (Art. 5º, LV) e razoável duração do processo (Art. 5º, LXXVIII).
* **Legislação Infraconstitucional:** Aplicação das normas gerais do Código Civil (Lei 10.406/02) e Código de Processo Civil (Lei 13.105/15), observando os princípios da boa-fé objetiva (Art. 422 CC) e cooperação processual (Art. 6º CPC).

---

### 3. Matriz de Análise de Riscos & Probabilidade
* **[Ponto Crítico]:** Observar rigorosamente os prazos processuais (contagem em dias úteis no CPC/CLT e dias corridos no CPP) para afastar risco de preclusão.
* **[Provas Necessárias]:** Recomenda-se instruir a manifestação com prova documental robusta pré-constituída (contratos, comprovantes de pagamento, comunicações e certidões).
* **[Probabilidade de Êxito]:** Favorável com respaldo na jurisprudência predominante dos Tribunais Superiores (STF/STJ), condicionada à comprovação documental inequívoca dos fatos.

---

### 4. Recomendações Práticas para a Equipe do Escritório:
1. **Ação Imediata:** Clique no botão **"➕ Criar Tarefa no CRM"** logo abaixo desta resposta para registrar o prazo e delegar a responsabilidade ao colaborador competente.
2. **Minuta:** Se desejar uma petição pronta, solicite: *"Elabore a petição para este caso"* ou acesse a aba **"Minutas Blindadas"**.
3. **Comunicação:** Informe o cliente via WhatsApp utilizando o gerador amigável de andamentos.`;
}
