/**
 * Advanced Brazilian Legal NLP & Knowledge Engine (AdvJuris Engine)
 * Base de conhecimento jurídica profunda com integração ao CRM e raciocínio analítico contextual.
 */

export function generateDeepLegalAnswer(query, chatHistory = [], customContext = null) {
  if (!query || typeof query !== 'string') {
    return 'Doutor(a), por favor informe sua dúvida ou o nome do cliente/processo para análise.';
  }

  const q = query.toLowerCase().trim();
  const crm = customContext || {};
  const clients = Array.isArray(crm.clients) ? crm.clients : [];
  const processes = Array.isArray(crm.processes) ? crm.processes : [];
  const tasks = Array.isArray(crm.tasks) ? crm.tasks : [];
  const contracts = Array.isArray(crm.contracts) ? crm.contracts : [];
  const officeSettings = crm.officeSettings || {};

  const has = (...terms) => terms.some(t => q.includes(t.toLowerCase()));
  const hasAll = (...terms) => terms.every(t => q.includes(t.toLowerCase()));

  // =========================================================================
  // 1. BUSCA DE CLIENTES E PROCESSOS DO CRM (Ex: "Bruno Alexssander", "processo de X")
  // =========================================================================
  const isProcessOrClientQuery = has(
    'processo', 'cliente', 'caso', 'bruno', 'alexssander', 'souza silva', 
    'ação de', 'audiência', 'meus processos', 'meus clientes', 'dossiê', 'consultar'
  );

  if (isProcessOrClientQuery) {
    let targetClient = null;
    let targetProcess = null;

    // Busca no array de clientes
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

    // Busca por processos
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

    // Se encontrou no CRM:
    if (targetClient || targetProcess) {
      const clientName = targetClient?.name || targetProcess?.clientName || 'Cliente';
      const clientCpf = targetClient?.cpf || 'Não informado';
      const clientPhone = targetClient?.phone || targetClient?.whatsapp || 'Não informado';
      const clientStatus = targetClient?.status || 'Ativo';

      const procNumber = targetProcess?.processNumber || 'Em fase pré-processual / Elaboração de Inicial';
      const procCourt = targetProcess?.court || targetProcess?.vara || 'Vara Cível / Especializada';
      const procArea = targetProcess?.legalArea || 'Direito Civil / Empresarial';
      const procPhase = targetProcess?.phase || targetProcess?.status || 'Inicial / Em andamento';
      const procValue = targetProcess?.value ? `R$ ${Number(targetProcess.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A apurar';

      // Tarefas relacionadas
      const relTasks = tasks.filter(t => 
        (targetClient?.id && t.clientId === targetClient.id) || 
        (targetProcess?.id && t.processId === targetProcess.id) ||
        (t.title && t.title.toLowerCase().includes(clientName.toLowerCase()))
      );

      // Contratos relacionados
      const relContracts = contracts.filter(c =>
        (targetClient?.id && c.clientId === targetClient.id) ||
        (c.clientName && c.clientName.toLowerCase().includes(clientName.toLowerCase()))
      );

      return `### 📋 DOSSIÊ JURÍDICO & PROCESSUAL — CRM JURISFLOW

**👤 Cliente:** ${clientName}
* **CPF/CNPJ:** ${clientCpf}
* **Contato:** ${clientPhone}
* **Status do Cliente:** \`${clientStatus}\`

---

### ⚖️ Dados do Processo / Caso
* **Número do Processo (CNJ):** \`${procNumber}\`
* **Vara / Tribunal:** ${procCourt}
* **Ramo do Direito:** ${procArea}
* **Fase Processual Atual:** \`${procPhase}\`
* **Valor da Causa:** ${procValue}

---

### ⏱️ Prazos e Tarefas Vinculadas
${relTasks.length > 0 ? relTasks.map(t => `* 📌 **${t.title}** — Limite: \`${t.dueDate || 'Pendente'}\` | Prioridade: \`${t.priority || 'Normal'}\` | Status: \`${t.status}\``).join('\n') : '* Nenhum prazo ou tarefa pendente registrada para este caso.'}

---

### 📑 Contratos & Honorários
${relContracts.length > 0 ? relContracts.map(c => `* 📄 **${c.title || c.subject || 'Contrato de Honorários'}** — Valor: \`R$ ${Number(c.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\` | Status: \`${c.status}\``).join('\n') : '* Nenhum contrato formal anexado ainda.'}

💡 *Dica do AdvJuris:* Para redigir uma petição para este cliente, acerte a aba **"Minutas"** ou solicite no chat que formularei a peça com os dados já qualificados.`;
    }
  }

  // =========================================================================
  // 2. CONTRATOS & REGRA DE OURO (Regras 46 e 32)
  // =========================================================================
  if (has('contrato', 'clausula', 'rescisao', 'multa contratual', 'auditoria contratual', 'foro de eleicao', 'honorarios')) {
    return `### 📑 AUDITORIA & ENGENHARIA CONTRATUAL — ADVJURIS

**Matriz de Análise e Blindagem (Regra de Ouro dos Contratos):**

1. **Partes e Qualificação Completa:**
   * Qualificação completa com CPF/CNPJ, estado civil, profissão, endereço e poderes dos representantes societários.
2. **Objeto Delimitado e Específico:**
   * Definição exata do escopo contratual, sem expressões abertas ou genéricas.
3. **Equilíbrio Econômico e Reajustes:**
   * Índice de reajuste oficial fixado (IPCA/IGP-M) e previsão contra onerosidade excessiva (Art. 478 do Código Civil).
4. **Rescisão e Penalidades Blindadas:**
   * Distinção expressa entre **Multa Moratória** (atraso pontual - máx. 2% em consumo ou razoável no cível) e **Multa Compensatória** (inadimplemento total/rescisão antecipada, proporcional ao tempo restante do contrato - Art. 413 do CC).
5. **Cláusula de Confidencialidade e LGPD (Lei 13.709/2018):**
   * Previsão de tratamento estritamente necessário para cumprimento do contrato (Art. 7º, V da LGPD).
6. **Foro de Eleição:**
   * Comarca de domicílio do réu/prestador (ou domicílio do consumidor se relação de consumo, Art. 101, I do CDC).

💡 *Deseja que eu redija ou audite uma cláusula específica? Envie o texto do contrato para análise detalhada.*`;
  }

  // =========================================================================
  // 3. PRAZOS PROCESSUAIS & CONTAGEM (CPC, CLT, CPP)
  // =========================================================================
  if (has('prazo', 'contagem', 'dias uteis', 'dias corridos', 'preclusao', 'intimação', 'agravo', 'apelacao', 'contestacao', 'embargos')) {
    return `### ⏱️ GUIA DE CONTAGEM DE PRAZOS PROCESSUAIS — ADVJURIS

| Ramo do Direito | Diploma Legal | Regra de Contagem | Termo Inicial |
| :--- | :--- | :--- | :--- |
| **Processo Civil** | Art. 219 do CPC/2015 | **DIAS ÚTEIS** | 1º dia útil seguinte à disponibilização no DJe |
| **Processo do Trabalho** | Art. 775 da CLT | **DIAS ÚTEIS** | 1º dia útil seguinte à intimação |
| **Processo Penal** | Art. 798 do CPP | **DIAS CORRIDOS** | Conta-se o dia do início se intimado pessoalmente |
| **Juizados Especiais Cíveis** | Art. 12-A da Lei 9.099/95 | **DIAS ÚTEIS** | 1º dia útil seguinte |

**Prazos Principais no CPC/2015:**
* **Embargos de Declaração:** 5 dias úteis (interrompe prazo para outros recursos).
* **Agravo de Instrumento:** 15 dias úteis (rol do Art. 1.015 do CPC).
* **Contestação:** 15 dias úteis (a contar da audiência de conciliação ou juntada do AR).
* **Apelação e Contrarrazões:** 15 dias úteis.

⚠️ *Alerta de Prática:* Feriados locais e suspensões de expediente forense devem ser comprovados documentalmente no ato da interposição do recurso (Art. 1.003, § 6º do CPC).`;
  }

  // =========================================================================
  // 4. DIREITO DO TRABALHO & EMPRESARIAL
  // =========================================================================
  if (has('trabalhista', 'rescisao', 'fgts', 'hora extra', 'insalubridade', 'periculosidade', 'verbas rescisorias', 'justa causa', 'equiparação')) {
    return `### ⚖️ PARECER TRABALHISTA ESTRATÉGICO — ADVJURIS

**Principais Pontos de Atenção na Reclamatória / Defesa:**
1. **Prescrição Trabalhista (Art. 7º, XXIX da CF/88):**
   * Prescrição Bienal (2 anos após o término do contrato) e Quinquenal (últimos 5 anos contados do ajuizamento da ação).
2. **Distribuição do Ônus da Prova (Art. 818 da CLT):**
   * Horas extras: Súmula 338 do TST (empresas com mais de 20 empregados têm ônus de juntar cartões de ponto idôneos).
3. **Verbas Rescisórias e Prazo de Pagamento (Art. 477, § 6º da CLT):**
   * Prazo de 10 dias corridos para quitação integral; multa de 1 salário em caso de atraso injustificado (§ 8º).
4. **Honorários Sucumbenciais na JT:**
   * Fixados entre 5% e 15% sobre o valor da liquidação (Art. 791-A da CLT).`;
  }

  // =========================================================================
  // 5. DIREITO DO CONSUMIDOR & BANCÁRIO
  // =========================================================================
  if (has('consumidor', 'banco', 'juros abusivos', 'cdc', 'inversao do onus', 'danos morais', 'negativação', 'golpe do pix')) {
    return `### 🛡️ ANÁLISE DE DIREITO DO CONSUMIDOR — ADVJURIS

**Diretrizes de Atuação Estratégica:**
1. **Inversão do Ônus da Prova (Art. 6º, VIII do CDC):**
   * Requerer expressamente na petição inicial com base na hipossuficiência técnica ou verossimilhança das alegações.
2. **Negativação Indevida no SPC/SERASA:**
   * Dano moral *in re ipsa* (presumido), dispensando prova de prejuízo concreto (Súmula 385 do STJ / Jurisprudência consolidada).
3. **Fraudes Bancárias e Golpe do PIX:**
   * Responsabilidade objetiva das instituições financeiras por fortuito interno decorrente de falhas no dever de segurança (Súmula 479 do STJ).
4. **Repetição de Indébito (Art. 42, Parágrafo Único do CDC):**
   * Devolução em dobro dos valores cobrados indevidamente, ressalvada hipótese de engano justificável.`;
  }

  // =========================================================================
  // 6. RESPOSTA GERAL / CONSULTORIA ESTRATÉGICA ADVJURIS
  // =========================================================================
  return `### ⚖️ PARECER CONSULTIVO — ADVJURIS

Doutor(a), compreendi sua consulta sobre: **"${query}"**.

**Recomendações Estratégicas e Fundamentação:**
1. **Diagnóstico dos Fatos e Provas:**
   * Reúna os documentos comprobatórios primários (contratos, comprovantes de pagamento, notificações premonitórias, conversas com ata notarial/print autenticado).
2. **Risco Processual e Viabilidade:**
   * Analise a viabilidade da demanda e apresente sempre ao cliente os cenários favoráveis e as despesas com custas/honorários sucumbenciais em caso de improcedência.
3. **Providência Sugerida:**
   * Você pode solicitar que eu elabore uma **Notificação Extrajudicial**, redija uma **Minuta de Petição Inicial**, ou faça o **cálculo de prazos processuais** aqui mesmo no Copilot.

*Dica:* Para utilizar os modelos conectados em tempo real (Google Gemini ou OpenAI ChatGPT), configure sua chave de API na engrenagem no topo do modal.`;
}
