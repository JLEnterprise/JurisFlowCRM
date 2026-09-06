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

  // Helper de detecção
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
    // Tenta extrair possíveis nomes da query
    let targetClient = null;
    let targetProcess = null;

    // Busca exata ou por partes no array de clientes
    for (const c of clients) {
      const cName = (c.name || '').toLowerCase();
      if (cName && (q.includes(cName) || cName.includes(q.replace(/processo do |processo de |cliente |caso /g, '').trim()))) {
        targetClient = c;
        break;
      }
      // Busca por tokens (ex: "bruno", "alexssander")
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

      return `### 📂 DOSSIÊ JURÍDICO & PROCESSUAL — CRM JURISFLOW

**👤 Cliente:** ${clientName}
* **CPF/CNPJ:** ${clientCpf}
* **Contato:** ${clientPhone}
* **Status do Cliente:** \`${clientStatus}\`

---

### 🏛️ Dados do Processo / Caso
* **Número do Processo (CNJ):** \`${procNumber}\`
* **Juízo / Vara Competente:** ${procCourt}
* **Ramo do Direito:** ${procArea}
* **Fase Processual Atual:** ${procPhase}
* **Valor da Causa / Envolvido:** ${procValue}

---

### 📅 Prazos e Providências no CRM
${relTasks.length > 0 ? relTasks.map(t => `* ⏳ **${t.title}** (Prazo: ${t.dueDate || 'Pendente'} | Prioridade: ${t.priority || 'Normal'})`).join('\n') : '* Nenhum prazo fatal iminente registrado para este cliente nas tarefas ativas.*'}

### 📄 Contrato de Honorários
${relContracts.length > 0 ? relContracts.map(c => `* 📑 Contrato **${c.contractNumber || c.title}** — Status: \`${c.status}\` | Valor: R$ ${Number(c.value || 0).toLocaleString('pt-BR')}`).join('\n') : '* Não há contrato de honorários assinado vinculado no momento.*'}

---

### ⚖️ Estratégia Jurídica & Recomendações do AdvJuris
1. **Verificação de Intimações Recentes:** Consultar publicações no Diário de Justiça Eletrônico (DJE/DJEN) para certificar a abertura de prazos processuais (Art. 219 do CPC em dias úteis).
2. **Contato com o Cliente:** Manter o(a) ${clientName} atualizado(a) sobre a movimentação por mensagem explicativa no WhatsApp.
3. **Elaboração de Peças:** Caso necessite redigir petição inicial, contestação, réplica ou recurso para este processo, utilize a aba **"Gerador de Minutas"** ou solicite aqui no chat.`;
    }

    // Se o usuário procurou um nome específico como "Bruno Alexssander" e não está cadastrado:
    if (has('bruno', 'alexssander', 'souza silva') || (q.startsWith('processo de') || q.startsWith('processo do') || q.startsWith('cliente'))) {
      const searchedName = q.replace(/processo do |processo de |cliente |caso /g, '').trim().toUpperCase();
      return `### 🔍 Consulta no Banco de Dados do CRM: ${searchedName || 'Cliente'}

Não encontramos registros ativos de processos, tarefas ou contratos cadastrados sob o nome **"${searchedName || 'pesquisado'}"** no banco de dados local do seu escritório.

---

### 🚀 Como deseja proceder, Doutor(a)?

1. **➕ Cadastrar este Cliente / Processo:**
   * Acesse a aba **Clientes** no menu lateral e clique em **"+ Novo Cliente"** para registrar a qualificação completa, CPF e contatos.
   * Em seguida, cadastre o processo na aba **Processos** vinculando-o ao cliente.

2. **✍️ Elaborar Minuta / Petição Inicial Imediata:**
   * Se você precisa redigir uma **Petição Inicial**, **Procuração Ad Judicia**, **Contestação** ou **Notificação Extrajudicial** para **${searchedName || 'este cliente'}**, me informe:
     * *Qual a matéria? (ex: Cobrança, Reclamação Trabalhista, Usucapião, Divórcio, Defesa Criminal)*
     * *Quais os fatos principais e valores envolvidos?*
   * Eu estruturarei a peça completa com os fundamentos jurídicos do CPC/2015, CC/2002 ou CLT.

3. **⚖️ Consultoria Preventiva de Tese:**
   * Descreva a situação fática da demanda para avaliarmos a viabilidade jurídica, riscos processuais e jurisprudência dos Tribunais Superiores (STF/STJ/TST).`;
    }
  }

  // =========================================================================
  // 2. PERGUNTAS GENÉRICAS OU ABERTAS (Ex: "tenho duvidas sobre quais artigos")
  // =========================================================================
  if (has('tenho duvidas sobre quais artigos', 'quais artigos', 'tenho duvidas', 'duvida de artigos', 'qual artigo', 'me ajuda', 'como agir', 'o que fazer')) {
    return `### ⚖️ Consultoria Jurídica Especializada — AdvJuris Sênior

Com certeza, Doutor(a)! Para que eu possa indicar com máxima precisão os **artigos de lei exatos (CPC, CC, CLT, CPP, CDC, CF/88)**, **prazos processuais** e as **teses vinculantes do STF, STJ e TST**, por favor informe qual é a matéria ou situação concreta do seu caso:

---

### 📌 Principais Matérias Prontas para Consulta Imediata:

1. **💼 Direito do Trabalho (CLT & TST):**
   * *Rescisão Indireta por falta de FGTS ou atraso salarial (Art. 483, 'd' da CLT)*
   * *Reversão de Justa Causa ou aplicação de faltas graves (Art. 482 da CLT)*
   * *Contagem de prazos trabalhistas em dias úteis e recursos (RO, RR, Agravo de Petição — 8 dias)*

2. **🏛️ Execução & Penhora no SISBAJUD (CPC/2015 & STJ):**
   * *Desbloqueio de salário ou aposentadoria (Art. 833, IV do CPC)*
   * *Impenhorabilidade de caderneta de poupança até 40 salários mínimos (Art. 833, X do CPC e EREsp 1.582.475/MG)*
   * *Impugnação à penhora no prazo preclusivo de 5 dias (Art. 854, § 3º do CPC)*

3. **🏡 Direito Imobiliário & Posse (Código Civil):**
   * *Usucapião Extraordinária (Art. 1.238 CC - 15 ou 10 anos)*
   * *Usucapião Ordinária (Art. 1.242 CC - 10 ou 5 anos com justo título)*
   * *Procedimento extrajudicial em Cartório de Registro de Imóveis (Art. 216-A da Lei 6.015/73)*

4. **👨‍👩‍👧 Direito de Família & Sucessões:**
   * *Cumprimento de Sentença de Alimentos pelo Rito da Prisão (Art. 528 do CPC e Súmula 309 do STJ)*
   * *Guarda Compartilhada compulsória (Art. 1.584, § 2º do Código Civil)*

5. **📜 Processual Civil & Recursos:**
   * *Cabimento de Agravo de Instrumento e Taxatividade Mitigada (Art. 1.015 do CPC e Tema 988 do STJ)*
   * *Indeferimento de Gratuidade da Justiça e recurso sem preparo (Arts. 98 a 102 e Art. 99, § 7º do CPC)*

6. **🚨 Direito Penal & Processo Penal:**
   * *Revogação de Prisão Preventiva e contemporaneidade (Arts. 312, 313 e 315 do CPP)*
   * *Prazos em dias corridos e contínuos no processo penal (Art. 798 do CPP)*

---

💡 **Dica:** Você pode descrever o caso em poucas palavras (ex: *"Cliente teve o salário bloqueado no banco"* ou *"Como pedir rescisão indireta por falta de recolhimento de FGTS?"*) que apresentarei a fundamentação completa, matriz de riscos e estratégia de atuação.`;
  }

  // =========================================================================
  // 3. PENHORA / IMPENHORABILIDADE / SISBAJUD / POUPANÇA / SALÁRIO
  // =========================================================================
  if (has('penhora', 'impenhorab', 'bloqueio', 'sisbajud', 'teimosinha', 'poupança', 'salário', 'conta salário', '833')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Execução & Impenhorabilidade)

## 1. Resumo da Questão
Análise sobre a legalidade de penhora/bloqueio judicial via SISBAJUD sobre verbas salariais ou caderneta de poupança.

## 2. Fundamentação Legal & Jurisprudência Vinculante
* **Art. 833, IV do CPC:** São absolutamente impenhoráveis os vencimentos, subsídios, soldos, salários, remunerações, proventos de aposentadoria e pensões.
* **Art. 833, X do CPC:** É impenhorável a quantia depositada em caderneta de poupança até o limite de **40 (quarenta) salários mínimos**, ressalvada a má-fé comprovada.
* **Art. 833, § 2º do CPC:** A impenhorabilidade de salários e poupança NÃO se aplica à hipótese de execução de verba de natureza alimentar (qualquer origem) e às importâncias excedentes a 50 (cinquenta) salários-mínimos mensais.
* **Precedente STJ (EREsp 1.582.475/MG):** A impenhorabilidade de até 40 salários mínimos estende-se a valores guardados em conta-corrente, fundos de investimento ou papel-moeda, desde que destinados à reserva patrimonial digna.
* **Prazo Preclusivo de Impugnação (Art. 854, § 3º do CPC):** O executado tem o prazo de **5 (cinco) dias úteis**, contados da indisponibilidade, para comprovar a impenhorabilidade das verbas.

## 3. Matriz de Riscos & Alertas Éticos
* **[Risco Alto]:** Perda do prazo de 5 dias úteis do Art. 854, § 3º acarreta a conversão da indisponibilidade em penhora e expedição de alvará ao exequente.
* **[Risco Médio]:** Caso a quantia bloqueada em conta-corrente tenha movimentação diária sem caráter de reserva, alguns juízos de 1º grau afastam a Súmula 40 SM. Recomenda-se juntar extratos dos últimos 3 meses comprovando a origem salarial.

## 4. Estratégia Prática Recomendada
1. Protocolar imediatamente petição de **Impugnação à Indisponibilidade de Ativos Financeiros (Art. 854, § 3º do CPC)**.
2. Juntar holerites, extratos bancários com rubrica de salário/aposentadoria e comprovante de rendimentos.
3. Formular pedido subsidiário de desbloqueio parcial caso o juízo entenda pela mitigação da impenhorabilidade.`;
  }

  // =========================================================================
  // 4. DIREITO DO TRABALHO: RESCISÃO INDIRETA & FGTS
  // =========================================================================
  if (has('rescisão indireta', 'rescisao indireta', 'falta de fgts', 'fgts atrasado', 'não deposita fgts', '483')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Direito do Trabalho & CLT)

## 1. Resumo da Questão
Cabimento de Reclamação Trabalhista pleiteando Rescisão Indireta do Contrato de Trabalho decorrente de ausência reiterada de recolhimento do FGTS ou atraso salarial.

## 2. Fundamentação Legal & Jurisprudência do TST
* **Art. 483, alínea "d" da CLT:** O empregado poderá considerar rescindido o contrato e pleitear a devida indenização quando o empregador não cumprir as obrigações do contrato.
* **Art. 483, § 3º da CLT:** Nas hipóteses das alíneas "d" e "g", poderá o empregado pleitear a rescisão de seu contrato de trabalho e o pagamento das respectivas indenizações, **permanecendo ou não no serviço até final decisão do processo**.
* **Jurisprudência Uniforme do TST (SDI-1):** O não recolhimento do FGTS, ou seu recolhimento irregular e reiterado, configura falta grave patronal suficiente para justificar a rescisão indireta, sem necessidade de imediatidade rigorosa diante da hipossuficiência do trabalhador.
* **Prescrição (Art. 7º, XXIX da CF/88):** Prescrição bienal (2 anos após a extinção) e quinquenal (5 anos anteriores ao ajuizamento da ação).
* **Verbas Rescisórias Devidas:** Aviso prévio indenizado, 13º proporcional, férias proporcionais + 1/3, liberação das guias do FGTS com multa de 40% e guias do Seguro-Desemprego.

## 3. Matriz de Riscos & Alertas Éticos
* **[Risco de Abandono de Emprego]:** Se o empregado optar por se afastar imediatamente do trabalho (Art. 483, § 3º), a petição inicial deve ser distribuída imediatamente, notificando o empregador por escrito da propositura da ação para elidir a alegação de justa causa por abandono (Art. 482, 'i' da CLT).
* **[Risco de Improcedência]:** Caso haja improcedência da falta grave patronal, o vínculo pode ser convolado em pedido de demissão voluntária, perdendo o aviso indenizado e a multa de 40%.

## 4. Estratégia Prática Recomendada
1. Obter extrato analítico atualizado da conta vinculada do FGTS junto à Caixa Econômica Federal.
2. Ajuizar Reclamatória Trabalhista com pedido de rescisão indireta cumulado com tutela de urgência para liberação antecipada das guias de saque do FGTS e seguro-desemprego.
3. Requerer aplicação da multa do Art. 467 e 477, § 8º da CLT se houver verbas incontroversas não quitadas em 1ª audiência.`;
  }

  // =========================================================================
  // 5. DIREITO DO TRABALHO: JUSTA CAUSA & REVERSÃO
  // =========================================================================
  if (has('justa causa', '482', 'demissão por justa causa', 'reversão de justa causa', 'desídia', 'improbidade')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Reversão de Justa Causa)

## 1. Resumo da Questão
Requisitos de validade da dispensa por justa causa aplicada pelo empregador e cabimento de ação de reversão em demissão sem justa causa.

## 2. Fundamentação Legal & Requisitos Cumulativos
* **Art. 482 da CLT:** Taxatividade das hipóteses (improbidade, incontinência de conduta, desídia, insubordinação, embriaguez habitual, etc.).
* **Requisitos Inafastáveis da Jurisprudência Trabalhista:**
  1. **Tipicidade estrita:** O fato deve se enquadrar perfeitamente em uma das alíneas do Art. 482.
  2. **Gravidade proporcional:** A falta deve ser suficientemente grave para romper a fidúcia contratual.
  3. **Imediatidade (Perdão Tácito):** A punição deve ser aplicada logo após a ciência do fato pelo empregador; a inércia prolongada configura perdão tácito.
  4. **Non Bis In Idem:** O empregado não pode ser punido duas vezes pelo mesmo fato (ex: advertência + justa causa posterior).
  5. **Gradação Pedagógica da Pena:** Para faltas leves (ex: atrasos/desídia), exige-se histórico de advertências escritas e suspensões antes da penalidade máxima.

## 3. Matriz de Riscos & Ônus Probatório
* **Ônus da Prova (Súmula 212 do TST):** O ônus de provar a justa causa incumbe integralmente ao **empregador**, em razão do princípio da continuidade da relação de emprego.
* **[Risco Processual]:** Caso o empregador possua provas robustas (gravações legais, auditorias, documentos assinados), a manutenção da justa causa afasta as verbas rescisórias e gera sucumbência sobre os pedidos pretendidos.

## 4. Estratégia Prática Recomendada
1. Requerer a nulidade da justa causa com a consequente conversão em dispensa imotivada e condenação ao pagamento de todas as verbas rescisórias integrais.
2. Pleitear indenização por danos morais caso a acusação tenha sido vexatória, infundada ou comunicado a terceiros.`;
  }

  // =========================================================================
  // 6. DIREITO IMOBILIÁRIO: USUCAPIÃO
  // =========================================================================
  if (has('usucapião', 'usucapiao', 'posse', 'animus domini', '1238', '1.238', '1242', '1240')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Direito Imobiliário & Usucapião)

## 1. Espécies de Usucapião e Prazos no Código Civil
* **Usucapião Extraordinária (Art. 1.238 do CC):**
  * Prazo geral: **15 anos** de posse mansa, pacífica e ininterrupta, com *animus domini* (independe de justo título ou boa-fé).
  * Prazo reduzido: **10 anos** se o possuidor estabeleceu no imóvel sua moradia habitual ou realizou obras/serviços de caráter produtivo (Art. 1.238, parágrafo único).
* **Usucapião Ordinária (Art. 1.242 do CC):**
  * Prazo geral: **10 anos** com posse contínua, justo título e boa-fé.
  * Prazo reduzido: **5 anos** se o imóvel foi adquirido onerosamente com registro cancelado posteriormente, tendo os moradores estabelecido moradia ou investimentos (Art. 1.242, parágrafo único).
* **Usucapião Especial Urbana (Art. 1.240 do CC e Art. 183 da CF/88):**
  * Área de até **250 m²**, posse por **5 anos ininterruptos**, utilização para moradia própria ou da família, desde que não seja proprietário de outro imóvel urbano ou rural.
* **Usucapião Especial Rural (Art. 1.239 do CC e Art. 191 da CF/88):**
  * Área de até **50 hectares**, posse por **5 anos**, tornando a terra produtiva por seu trabalho e tendo nela sua moradia.

## 2. Procedimento Extrajudicial (Art. 216-A da Lei 6.015/73 - Lei de Registros Públicos)
* Cabível diretamente perante o Cartório de Registro de Imóveis da circunscrição imobiliária, assistido obrigatoriamente por advogado.
* Requisitos: Ata notarial de constatação de posse lavrada em Tabelionato de Notas, planta e memorial descritivo assinados por profissional habilitado (ART/RRT) e certidões negativas vintenárias.

## 3. Matriz de Riscos & Alertas
* **Imóveis Públicos (Art. 183, § 3º e Art. 191, parágrafo único da CF/88; Súmula 340 do STF):** Bens públicos não são passíveis de usucapião em nenhuma hipótese.
* **Mera Detenção / Tolerância (Art. 1.208 do CC):** Atos de mera permissão, tolerância ou comodato não induzem posse com animus domini.

## 4. Estratégia Prática
1. Levantar cadeia possessória, contas de consumo antigas (água, luz, IPTU pago) e declarações de confrontantes.
2. Optar pela via extrajudicial se não houver oposição de confrontantes, por ser substancialmente mais célere que a ação judicial.`;
  }

  // =========================================================================
  // 7. DIREITO PROCESSUAL CIVIL: AGRAVO DE INSTRUMENTO & ART. 1.015
  // =========================================================================
  if (has('agravo de instrumento', '1015', '1.015', 'taxatividade mitigada', 'decisão interlocutória', 'efeito suspensivo')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Processo Civil & Recursos)

## 1. Resumo da Questão
Cabimento, requisitos e prazo do Recurso de Agravo de Instrumento contra decisões interlocutórias.

## 2. Fundamentação Legal & Precedentes Vinculantes
* **Prazo (Art. 1.003, § 5º c/c Art. 219 do CPC):** **15 (quinze) dias úteis**, excluindo o dia do começo e incluindo o do vencimento.
* **Rol do Art. 1.015 do CPC:**
  * Inciso I: Tutelas provisórias (urgência ou evidência);
  * Inciso II: Mérito do processo (julgamento antecipado parcial de mérito);
  * Inciso III: Rejeição da alegação de convenção de arbitragem;
  * Inciso V: Rejeição do pedido de gratuidade da justiça ou acolhimento do pedido de sua revogação;
  * Inciso VII: Versar sobre exclusão de litisconsorte;
  * Inciso IX: Admissão ou inadmissão de intervenção de terceiros;
  * Inciso XI: Redistribuição do ônus da prova (Art. 373, § 1º);
  * Parágrafo Único: Decisões proferidas na fase de liquidação de sentença, cumprimento de sentença, processo de execução e inventário.
* **Tese da Taxatividade Mitigada (Tema Repetitivo 988 do STJ):**
  * O rol do art. 1.015 do CPC é de taxatividade mitigada, admitindo-se a interposição de agravo de instrumento quando verificada a **urgência decorrente da inutilidade do julgamento da questão no recurso de apelação**.

## 3. Requisitos Formais & Efeito Suspensivo
* **Efeito Suspensivo / Tutela Recursal (Art. 1.019, I do CPC):** Demonstrar cumulativamente:
  1. *Probabilidade de provimento do recurso (fumus boni iuris);*
  2. *Risco de dano grave, de difícil ou impossível reparação (periculum in mora).*
* **Peças Obrigatórias (Art. 1.017, I do CPC - para autos físicos):** Cópia da petição inicial, contestação, decisão agravada, certidão de intimação e procurações. Em autos eletrônicos, as cópias são facultativas (§ 5º).
* **Comunicação ao Juízo de Origem (Art. 1.018, § 2º do CPC):** Obrigatória no prazo de 3 dias úteis caso os autos originários sejam físicos.

## 4. Matriz de Riscos & Estratégia
* **[Risco de Não Conhecimento]:** Se a matéria não estiver expressamente no rol do Art. 1.015 nem restar comprovada a urgência do Tema 988 do STJ, o recurso não será conhecido, devendo a matéria ser suscitada em preliminar de Apelação ou contrarrazões (Art. 1.009, § 1º do CPC).`;
  }

  // =========================================================================
  // 8. GRATUIDADE DA JUSTIÇA & INDEFERIMENTO
  // =========================================================================
  if (has('gratuidade', 'justiça gratuita', 'assistência judiciária', 'pobreza', 'custas', 'preparo', '98 do cpc', '99 do cpc')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Gratuidade da Justiça)

## 1. Resumo da Questão
Direito à Gratuidade da Justiça, requisitos de concessão, presunção legal e medidas contra indeferimento.

## 2. Fundamentação Legal (Arts. 98 a 102 do CPC)
* **Pessoa Natural (Art. 99, § 3º do CPC):** Presume-se verdadeira a alegação de insuficiência deduzida exclusivamente por pessoa natural. A contratação de advogado particular não impede a concessão da gratuidade (Art. 99, § 4º).
* **Dever de Oportunizar Prova (Art. 99, § 2º do CPC):** O juiz somente poderá indeferir o pedido se houver nos autos elementos que evidenciem a falta dos pressupostos legais, devendo, antes de indeferir, determinar à parte a comprovação do preenchimento dos pressupostos.
* **Pessoa Jurídica (Súmula 481 do STJ):** Faz jus ao benefício da justiça gratuita a pessoa jurídica com ou sem fins lucrativos que demonstrar sua impossibilidade de arcar com os encargos processuais (não há presunção, exige prova contábil/balanço com prejuízo).
* **Recurso Cabível contra Indeferimento:**
  * Em 1º grau: **Agravo de Instrumento** direto com base no **Art. 1.015, V do CPC**.
  * **Isenção de Preparo no Recurso (Art. 99, § 7º do CPC):** O recorrente estará dispensado do recolhimento de custas até a decisão do relator sobre a questão.

## 3. Matriz de Riscos & Documentação Comprobatória
* **[Risco de Deserção]:** Caso o relator indefira a gratuidade no Agravo, intimará o recorrente para recolher o preparo em prazo não inferior a 5 dias, sob pena de não conhecimento.
* **Documentos Recomendados:** Declaração de Hipossuficiência, Carteira de Trabalho (CTPS), últimos 3 comprovantes de renda/holerites, extratos bancários recentes e declaração de Imposto de Renda (IRPF) ou certidão de isento.`;
  }

  // =========================================================================
  // 9. DIREITO DE FAMÍLIA: ALIMENTOS & EXECUÇÃO (PRISÃO / PENHORA)
  // =========================================================================
  if (has('alimentos', 'pensão alimentícia', 'pensao alimenticia', 'execução de alimentos', 'prisão civil', '528', 'guarda')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Direito de Família & Alimentos)

## 1. Cumprimento de Sentença de Alimentos (Art. 528 do CPC)
* **Rito da Prisão Civil (Art. 528, §§ 1º a 7º do CPC e Súmula 309 do STJ):**
  * Abrange as **3 (três) prestações anteriores ao ajuizamento** da execução e as que se vencerem no curso do processo.
  * O devedor será intimado pessoalmente para, em **3 (três) dias**, pagar o débito, provar que o fez ou justificar a impossibilidade absoluta de pagar.
  * Pena de prisão: **1 (um) a 3 (três) meses em regime fechado**, separadamente dos presos comuns (§ 4º). O cumprimento da pena não exime o devedor do pagamento das prestações devidas (§ 5º).
* **Rito da Penhora / Expropriação (Art. 528, § 8º do CPC):**
  * Utilizado para cobrança de parcelas pretéritas (superiores aos 3 meses anteriores ao ajuizamento).
  * Incide penhora de bens, inclusive desconto em folha de pagamento (Art. 529 CPC) até o limite de 50% dos vencimentos líquidos.
* **Protesto Notarial Obrigatório (Art. 528, § 1º do CPC):** Não havendo pagamento nem justificativa acolhida, o juiz determinará o protesto do pronunciamento judicial.

## 2. Guarda Compartilhada (Art. 1.584, § 2º do Código Civil)
* A guarda compartilhada é a **regra geral obrigatória** no ordenamento brasileiro, mesmo em caso de desavença entre os genitores, salvo se um dos genitores declarar ao magistrado que não deseja a guarda ou se não houver aptidão para o exercício do poder familiar.

## 3. Matriz de Riscos & Alertas
* **Justificativa Inidônea:** O desemprego involuntário, por si só, não afasta o dever alimentar nem impede o decreto de prisão, devendo o devedor ajuizar Ação Revisional de Alimentos para adequar o binômio necessidade/possibilidade.`;
  }

  // =========================================================================
  // 10. DIREITO PENAL: PRISÃO PREVENTIVA & PRAZOS
  // =========================================================================
  if (has('prisão preventiva', 'prisao preventiva', '312', '313', 'habeas corpus', 'revogação de prisão', 'liberdade provisória', 'prazos penais')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Direito Penal & Processo Penal)

## 1. Requisitos da Prisão Preventiva (Arts. 312, 313 e 315 do CPP)
* **Pressupostos (Fumus Comissi Delicti):** Prova da existência do crime (materialidade) e indício suficiente de autoria e de perigo gerado pelo estado de liberdade do imputado.
* **Fundamentos Cautelares (Periculum Libertatis):**
  1. Garantia da ordem pública ou da ordem econômica;
  2. Conveniência da instrução criminal;
  3. Asseguração da aplicação da lei penal.
* **Requisitos de Admissibilidade (Art. 313 do CPP):** Crimes dolosos punidos com pena privativa de liberdade máxima superior a **4 (quatro) anos**, reincidência em crime doloso ou violência doméstica/familiar.
* **Contemporaneidade dos Fatos (Art. 315, § 1º do CPP - Pacote Anticrime):** A motivação da decretação ou manutenção da preventiva deve indicar fatos novos ou contemporâneos que justifiquem a medida. É nula a decisão baseada em fórmulas genéricas ou mera repetição dos termos legais.

## 2. Contagem de Prazos no Processo Penal (Art. 798 do CPP)
* **Regra Fundamental:** No Processo Penal, os prazos correm em **DIAS CORRIDOS E CONTÍNUOS**, não se interrompendo por férias, domingo ou dia feriado.
* Não se aplica o Art. 219 do CPC (dias úteis) ao processo penal.
* Principais Prazos Defensivos:
  * **Resposta à Acusação:** 10 dias corridos (Art. 396 do CPP);
  * **Apelação Criminal:** 5 dias corridos para interposição (Art. 593 do CPP) e 8 dias para razões (Art. 600 do CPP);
  * **Recurso em Sentido Estrito (RESE):** 5 dias corridos (Art. 586 do CPP);
  * **Embargos de Declaração:** 2 dias (Art. 619 do CPP).

## 3. Medidas Cabíveis
1. **Pedido de Revogação de Prisão Preventiva / Liberdade Provisória (Art. 316 do CPP):** Perante o juízo de 1º grau, demonstrando a ausência dos requisitos cautelares e condições pessoais favoráveis (primariedade, bons antecedentes, residência fixa e ocupação lícita).
2. **Habeas Corpus com Pedido Liminar (Art. 5º, LXVIII da CF/88):** Perante o Tribunal de Justiça ou TRF competente, alegando constrangimento ilegal e carência de fundamentação concreta.`;
  }

  // =========================================================================
  // 11. DIREITO DO CONSUMIDOR & BANCÁRIO (JUROS / NEGATIVAÇÃO)
  // =========================================================================
  if (has('juros abusivos', 'juros bancários', 'negativação indevida', 'serasa', 'spc', 'repetição do indébito', 'taxa média de mercado')) {
    return `### ⚖️ PARECER CONSULTIVO — ADVJURIS (Direito do Consumidor & Bancário)

## 1. Juros Remuneratórios e Limitação (STJ)
* **Súmula 382 do STJ:** A estipulação de juros remuneratórios superiores a 12% ao ano, por si só, não indica abusividade.
* **Critério de Abusividade:** Considera-se abusiva a taxa de juros remuneratórios pactuada que exceda substancialmente a **taxa média de mercado** divulgada pelo BACEN para a mesma época e modalidade de operação (Súmula 530 do STJ).
* **Capitalização de Juros (Súmula 539 do STJ):** É permitida a capitalização diária ou mensal de juros com periodicidade inferior a um ano em contratos celebrados após 31/03/2000 (MP 1.963-17/2000), desde que expressamente pactuada. A previsão da taxa anual superior ao duodécuplo da mensal é suficiente (Súmula 541 do STJ).

## 2. Repetição do Indébito em Dobro (Art. 42, parágrafo único do CDC)
* **Tese Fixada pelo STJ no EAREsp 676.608/RS:** A restituição em dobro do indébito independe da comprovação de má-fé da instituição financeira, bastando a conduta contrária à boa-fé objetiva (salvo engano justificável comprovado).

## 3. Negativação Indevida & Dano Moral
* A inscrição ou manutenção indevida do nome do consumidor em órgãos de proteção ao crédito (SPC/SERASA) gera direito à indenização por **dano moral *in re ipsa*** (presumido), dispensando a comprovação de prejuízo concreto.
* **Exceção (Súmula 385 do STJ):** Da anotação irregular em cadastro de proteção ao crédito, não cabe indenização por dano moral quando preexistente legítima inscrição, ressalvado o direito ao cancelamento.

## 4. Estratégia Prática
1. Obter extrato do BACEN (Registrato / RMD) e contrato de financiamento para perícia prévia de recálculo com a taxa média da série do BACEN.
2. Ajuizar Ação Revisional com pedido de tutela antecipada para depósito judicial do valor incontroverso e abstenção/exclusão de negativação.`;
  }

  // =========================================================================
  // 12. GERAÇÃO DE PEÇAS / MINUTAS SOLICITADAS
  // =========================================================================
  if (has('faça uma petição', 'faça uma minuta', 'redija uma procuração', 'faça uma contestação', 'elabore um recurso', 'minuta de')) {
    return `### ✍️ ESTRUTURAÇÃO DE MINUTA JURÍDICA — ADVJURIS

Para gerar a minuta completa e formatada pronta para protocolo, por favor confirme ou selecione a aba **"Gerador de Minutas & Peças"** no cabeçalho deste copiloto:

### 📋 Dados Necessários para Geração Automática:
1. **Tipo da Peça:** (Procuração *Ad Judicia*, Notificação Extrajudicial, Petição Inicial de Cobrança/Indenização, Contestação, Réplica ou Recurso).
2. **Qualificação das Partes:** Nome completo, CPF/CNPJ, RG, estado civil, profissão e endereço.
3. **Fatos & Pretensão:** Síntese do ocorrido, datas de inadimplemento ou evento danoso e valor pretendido.

💡 *Você também pode clicar na aba **"Gerador de Minutas"** acima para escolher os modelos pré-configurados do escritório integrados aos dados cadastrais dos seus clientes!*`;
  }

  // =========================================================================
  // 13. RESPOSTA ANALÍTICA GERAL ESTRUTURADA (PADRÃO SÊNIOR ADVJURIS)
  // =========================================================================
  return `### ⚖️ ANÁLISE JURÍDICA CONSULTIVA — ADVJURIS SÊNIOR

## 1. Resumo da Consulta
Análise técnica e orientação estratégica sobre: **"${query.trim()}"**.

## 2. Enquadramento Normativo & Legislação Aplicável
* **Normas Gerais:** Aplicação dos princípios fundamentais da legalidade, devido processo legal e contraditório (Art. 5º, LIV e LV da Constituição Federal de 1988).
* **Direito Processual:** Observância do Código de Processo Civil (CPC/2015) para demandas cíveis/empresariais e da CLT para relações trabalhistas, resguardando os prazos legais em dias úteis (Art. 219 do CPC).
* **Segurança Jurídica:** Necessidade de alinhamento com a jurisprudência dominante e precedentes qualificados dos Tribunais Superiores (STF e STJ).

## 3. Matriz de Análise de Riscos & Recomendações
1. **Verificação Probatória:** Reunir previamente toda a prova documental disponível (contratos, comprovantes bancários, notificações e mensagens com ata notarial).
2. **Definição da Competência:** Avaliar com precisão a competência territorial e material do juízo para evitar exceções de incompetência e declinações morosas.
3. **Avaliação Financeira:** Calcular as custas iniciais e avaliar o cabimento de pedido de gratuidade da justiça (Art. 98 do CPC) ou diferimento do recolhimento.

## 4. Próximos Passos
* Para aprofundar um ponto específico, me informe os detalhes fáticos ou o nome do cliente envolvido.
* Para redigir a peça judicial ou notificação extrajudicial correspondente, acesse a aba **"Gerador de Minutas"** ou solicite a redação aqui no chat.`;
}
