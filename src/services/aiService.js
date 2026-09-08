/**
 * JurisFlow Multi-Provider AI Service
 * Integração completa com Google Gemini API, OpenAI ChatGPT API e Motor Cognitivo AdvJuris Local.
 * Atuação como Consultor Jurídico Sênior, Legal Engineer e Assistente Operacional de Escritório.
 */

import { ADVJURIS_SYSTEM_PROMPT, ADVJURIS_PROMPTS } from '../agents/advJurisPrompt.js';
import { generateDeepLegalAnswer } from './deepLegalEngine.js';

const GEMINI_STORAGE_KEY = 'jurisflow_gemini_api_key';
const OPENAI_STORAGE_KEY = 'jurisflow_openai_api_key';
const AI_PROVIDER_KEY = 'jurisflow_ai_provider'; // 'gemini' | 'openai' | 'local'
const SELECTED_MODEL_KEY = 'jurisflow_ai_model';

// ============================================================================
// CONFIGURAÇÃO E PERSISTÊNCIA DE CHAVES & PROVEDORES
// ============================================================================

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function getGeminiApiKey() {
  if (!isBrowser) return '';
  return window.localStorage.getItem(GEMINI_STORAGE_KEY) || '';
}

export function setGeminiApiKey(key) {
  if (!isBrowser) return;
  if (!key) {
    window.localStorage.removeItem(GEMINI_STORAGE_KEY);
  } else {
    window.localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  }
}

export function getOpenAiApiKey() {
  if (!isBrowser) return '';
  return window.localStorage.getItem(OPENAI_STORAGE_KEY) || '';
}

export function setOpenAiApiKey(key) {
  if (!isBrowser) return;
  if (!key) {
    window.localStorage.removeItem(OPENAI_STORAGE_KEY);
  } else {
    window.localStorage.setItem(OPENAI_STORAGE_KEY, key.trim());
  }
}

export function getAiProvider() {
  if (!isBrowser) return 'local';
  return window.localStorage.getItem(AI_PROVIDER_KEY) || 'gemini';
}

export function setAiProvider(provider) {
  if (!isBrowser) return;
  window.localStorage.setItem(AI_PROVIDER_KEY, provider);
}

export function getSelectedModel() {
  if (!isBrowser) return '';
  return window.localStorage.getItem(SELECTED_MODEL_KEY) || '';
}

export function setSelectedModel(model) {
  if (!isBrowser) return;
  window.localStorage.setItem(SELECTED_MODEL_KEY, model);
}

// ============================================================================
// TESTES DE CONEXÃO EM TEMPO REAL
// ============================================================================

export async function testGeminiApiKey(key) {
  if (!key || !key.trim()) return { success: false, message: 'Chave Gemini não informada' };
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  
  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Responda apenas: OK - Conexao Estabelecida.' }] }]
        })
      });
      if (res.ok) {
        return { success: true, message: `Google Gemini conectado com sucesso! (Modelo ativo: ${model})` };
      }
    } catch (err) {
      // continua para próximo modelo
    }
  }

  return { success: false, message: 'Não foi possível validar a chave com a Google API. Verifique a chave ou sua conexão.' };
}

export async function testOpenAiApiKey(key) {
  if (!key || !key.trim()) return { success: false, message: 'Chave OpenAI não informada' };
  try {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Responda apenas: OK.' }],
        max_tokens: 10
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || `Erro ${res.status}: ${res.statusText}` };
    }
    return { success: true, message: 'OpenAI ChatGPT conectado com sucesso! (Modelo: gpt-4o-mini)' };
  } catch (err) {
    return { success: false, message: err.message || 'Falha de conexão com a OpenAI API' };
  }
}

// ============================================================================
// FORMATAÇÃO ENRIQUECIDA DO CONTEXTO DO CRM PARA A IA
// ============================================================================

export function buildCrmContextPrompt(crmContext) {
  if (!crmContext) return '';

  const {
    clients = [],
    processes = [],
    tasks = [],
    contracts = [],
    proposals = [],
    leads = [],
    appointments = [],
    attendances = [],
    officeSettings = {},
    currentUser = {}
  } = crmContext;

  const clientList = clients.slice(0, 30).map(c => 
    `- [Cliente] Nome: ${c.name} | CPF/CNPJ: ${c.cpf || c.cnpj || 'N/I'} | Status: ${c.status || 'Ativo'} | Tel: ${c.phone || c.whatsapp || 'N/I'} | Cidade: ${c.city || 'N/I'}`
  ).join('\n');

  const processList = processes.slice(0, 30).map(p =>
    `- [Processo] Nº: ${p.processNumber || 'Sem número'} | Cliente: ${p.clientName || 'N/I'} | Vara/Juízo: ${p.court || p.vara || 'N/I'} | Ramo: ${p.legalArea || 'Cível'} | Fase: ${p.phase || p.status || 'Em andamento'} | Valor: ${p.value ? 'R$ ' + p.value : 'N/I'}`
  ).join('\n');

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const taskList = pendingTasks.slice(0, 20).map(t =>
    `- [Prazo/Tarefa] ${t.title} | Vencimento: ${t.dueDate || 'Pendente'} | Prioridade: ${t.priority || 'Normal'} | Resp: ${t.assignedTo || 'Equipe'}`
  ).join('\n');

  const appointmentList = appointments.slice(0, 10).map(a =>
    `- [Audiência/Agenda] ${a.title} | Data: ${a.date || a.appointmentDate || 'N/I'} | Horário: ${a.time || 'N/I'} | Tipo: ${a.type || 'Geral'}`
  ).join('\n');

  const contractList = contracts.slice(0, 10).map(c =>
    `- [Contrato] ${c.title || c.subject || 'Honorários'} | Cliente: ${c.clientName || 'N/I'} | Valor: R$ ${c.value || '0'} | Status: ${c.status || 'Ativo'}`
  ).join('\n');

  const leadList = leads.slice(0, 10).map(l =>
    `- [Lead/Oportunidade] ${l.name} | Etapa: ${l.stage || 'Novo Lead'} | Valor Estimado: R$ ${l.value || '0'} | Origem: ${l.source || 'Indicação'}`
  ).join('\n');

  return `
---
[BASE DE DADOS EM TEMPO REAL DO CRM JURISFLOW]:
Escritório: ${officeSettings.officeName || 'JurisFlow Advocacia'} | OAB: ${officeSettings.oabNumber || 'Inscrito na OAB'}
Colaborador Autenticado: ${currentUser?.name || 'Advogado(a) / Colaborador'} (${currentUser?.role || 'Membro da Equipe'})

CLIENTES CADASTRADOS NO CRM:
${clientList || 'Nenhum cliente cadastrado no momento.'}

PROCESSOS JUDICIAIS NO CRM:
${processList || 'Nenhum processo cadastrado no momento.'}

PRAZOS E TAREFAS PENDENTES:
${taskList || 'Nenhum prazo pendente registrado.'}

AUDIÊNCIAS E COMPROMISSOS DA AGENDA:
${appointmentList || 'Nenhum compromisso próximo registrado.'}

CONTRATOS E HONORÁRIOS:
${contractList || 'Nenhum contrato formal registrado.'}

OPORTUNIDADES E LEADS NO FUNIL:
${leadList || 'Nenhum lead em negociação no momento.'}
---
Instruções de Resposta para a IA:
1. Quando o funcionário ou advogado perguntar sobre clientes, processos, prazos, audiências ou dados do escritório, responda consultando EXATAMENTE os dados da base acima.
2. Seja prestativo, tire qualquer dúvida técnica ou operacional do funcionário com clareza, coerência e excelência no Direito brasileiro.`;
}

// ============================================================================
// EXECUÇÃO MULTI-PROVEDOR (GEMINI, OPENAI & ADVJURIS LOCAL)
// ============================================================================

export async function callMultiProviderAi(prompt, systemInstruction = ADVJURIS_SYSTEM_PROMPT, conversationHistory = [], crmContext = null) {
  const provider = getAiProvider();
  const crmSnippet = buildCrmContextPrompt(crmContext);
  const fullSystemPrompt = crmSnippet ? `${systemInstruction}\n\n${crmSnippet}` : systemInstruction;

  // Se for explicitamente local, retorna null para forçar o fallback
  if (provider === 'local') return null;

  if (provider === 'openai') {
    const openAiKey = getOpenAiApiKey();
    if (!openAiKey) {
      throw new Error('Chave de API OpenAI não configurada. Clique na engrenagem ⚙️ (canto superior direito) e insira sua chave para ativar a IA.');
    }
    return await callOpenAiApi(prompt, fullSystemPrompt, openAiKey, conversationHistory);
  }

  if (provider === 'gemini') {
    const geminiKey = getGeminiApiKey();
    if (!geminiKey) {
      throw new Error('Chave de API do Google Gemini não configurada. Clique na engrenagem ⚙️ (canto superior direito) e insira sua chave para ativar a IA avançada (gratuita no Google AI Studio).');
    }
    return await callGeminiApi(prompt, fullSystemPrompt, geminiKey, conversationHistory);
  }

  return null;
}

export async function callOpenAiApi(prompt, systemInstruction, key, conversationHistory = []) {
  const model = getSelectedModel() || 'gpt-4o';
  try {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const historyToProcess = conversationHistory.filter((m, idx) => !(idx === 0 && m.role === 'assistant'));
      for (let i = 0; i < historyToProcess.length; i++) {
        const m = historyToProcess[i];
        if (!m.content || typeof m.content !== 'string') continue;
        if (i === historyToProcess.length - 1 && m.role === 'user' && m.content.trim() === prompt.trim()) {
          continue;
        }
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        });
      }
    }

    messages.push({ role: 'user', content: prompt });

    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model.startsWith('gpt') ? model : 'gpt-4o',
        messages: messages,
        temperature: 0.2,
        max_tokens: 3500
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || response.statusText;
      throw new Error(`OpenAI API Erro: ${errMsg}`);
    }
  } catch (err) {
    console.warn('Falha na chamada OpenAI:', err.message);
    throw new Error(`Falha na API da OpenAI: ${err.message}`);
  }
  return null;
}

export async function callGeminiApi(prompt, systemInstruction = ADVJURIS_SYSTEM_PROMPT, key = '', conversationHistory = []) {
  const currentKey = key || getGeminiApiKey();
  if (!currentKey) throw new Error('Chave de API do Gemini não configurada.');

  const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];

  const contents = [];
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const historyToProcess = conversationHistory.filter((m, idx) => !(idx === 0 && m.role === 'assistant'));
    for (let i = 0; i < historyToProcess.length; i++) {
      const m = historyToProcess[i];
      if (!m.content || typeof m.content !== 'string') continue;
      if (i === historyToProcess.length - 1 && m.role === 'user' && m.content.trim() === prompt.trim()) {
        continue;
      }
      const role = m.role === 'assistant' ? 'model' : 'user';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${m.content}`;
      } else {
        contents.push({ role: role, parts: [{ text: m.content }] });
      }
    }
  }

  contents.push({ role: 'user', parts: [{ text: prompt }] });

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey.trim()}`;
      const payload = {
        contents: contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.2,
          topP: 0.95,
          maxOutputTokens: 3500
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || `Erro HTTP ${response.status}: ${response.statusText}`;
        console.warn(`Erro no modelo Gemini ${model}:`, lastError);
        
        // Se for erro de API key inválida (400), aborta tudo
        if (response.status === 400 && lastError.toLowerCase().includes('api key')) {
          throw new Error(`A Chave de API do Gemini fornecida é inválida. Verifique na engrenagem ⚙️. (${lastError})`);
        }
      }
    } catch (err) {
      lastError = err.message;
      console.warn(`Erro na requisição Gemini ${model}:`, err.message);
      if (err.message.includes('A Chave de API')) throw err;
    }
  }

  if (lastError) {
    throw new Error(`Falha ao gerar resposta com a IA do Google Gemini. Erro: ${lastError}`);
  }

  return null;
}

// ============================================================================
// CONSULTORIA ESTRATÉGICA ADVJURIS (CHAT)
// ============================================================================

export async function consultAdvJuris(question, chatHistory = [], crmContext = null) {
  if (!question || question.trim().length === 0) {
    throw new Error('Pergunta não informada.');
  }

  try {
    const externalResult = await callMultiProviderAi(question, ADVJURIS_SYSTEM_PROMPT, chatHistory, crmContext);
    if (externalResult) {
      return {
        text: externalResult,
        provider: getAiProvider() === 'openai' ? 'OpenAI ChatGPT' : 'Google Gemini',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      text: `⚠️ **Atenção: A Inteligência Artificial requer configuração**\n\nNão foi possível obter uma resposta da IA devido ao seguinte erro:\n\n> \`${error.message}\`\n\n**Como resolver:**\n1. Clique no botão de engrenagem ⚙️ (Configurações) no canto superior direito do chat.\n2. Insira a sua chave da **Google Gemini API** (gratuita no Google AI Studio) ou **OpenAI API**.\n3. Salve e teste a conexão.\n\n*Sem a chave, o sistema operará apenas com respostas limitadas do motor local.*`,
      provider: 'Sistema JurisFlow (Erro de IA)',
      timestamp: new Date().toISOString()
    };
  }

  // 2. Motor Cognitivo Local AdvJuris Especialista (Fallback Explícito)
  await new Promise(r => setTimeout(r, 200));
  const localAnswer = generateDeepLegalAnswer(question, chatHistory, crmContext);

  return {
    text: localAnswer,
    provider: 'AdvJuris Cognitivo Local (Offline)',
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// GERAÇÃO DE MINUTAS & PEÇAS JURÍDICAS
// ============================================================================

export async function generateLegalDraft(draftType, data = {}, crmContext = null) {
  const prompt = `Elabore uma minuta jurídica profissional e fundamentada no Direito Brasileiro para: ${draftType}.
Parâmetros e Dados do Caso:
${JSON.stringify(data, null, 2)}`;

  const systemPrompt = `${ADVJURIS_SYSTEM_PROMPT}\n\n${ADVJURIS_PROMPTS.CONTRACT_GENERATOR}`;
  try {
    const externalResult = await callMultiProviderAi(prompt, systemPrompt, [], crmContext);
    if (externalResult) {
      return { success: true, draft: externalResult };
    }
  } catch (err) {
    // Se der erro, cai pro local abaixo
    console.warn("Erro ao gerar minuta com IA, usando modelo local: ", err.message);
  }

  await new Promise(r => setTimeout(r, 300));
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR');

  // Peça: Desbloqueio SISBAJUD
  if (draftType === 'desbloqueio_sisbajud') {
    return {
      success: true,
      draft: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA [VARA DA EXECUÇÃO] DA COMARCA DE [CIDADE/UF]

Autos do Processo nº: [NÚMERO DO PROCESSO CNJ]

${data.clientName || '[NOME DO EXECUTADO]'}, já qualificado nos autos da Execução de Título Extrajudicial / Cumprimento de Sentença em epígrafe, que lhe move [NOME DO EXEQUENTE], por seu procurador infra-assinado, vem, respeitosamente, à presença de Vossa Excelência, com fulcro no Art. 854, § 3º, inciso I do Código de Processo Civil, apresentar

PEDIDO DE DESBLOQUEIO URGENTE DE ATIVOS FINANCEIROS (SISBAJUD)
POR IMPENHORABILIDADE ABSOLUTA DE SALÁRIO / RESERVA DE POUPANÇA

pelas razões de fato e de direito a seguir expostas:

I. DA IMPENHORABILIDADE ABSOLUTA DA VERBA BLOQUEADA
Consoante se extrai dos extratos bancários e comprovantes de rendimento anexos (Doc. 01), o bloqueio eletrônico via SISBAJUD recaiu sobre conta destinada exclusivamente ao recebimento de proventos salariais / verba de subsistência familiar.

O Art. 833, inciso IV, do CPC é peremptório ao estabelecer a impenhorabilidade absoluta dos vencimentos, subsídios, soldos, salários, remunerações e proventos de aposentadoria:

"Art. 833. São impenhoráveis:
IV - os vencimentos, os subsídios, os soldos, os salários, as remunerações, os proventos de aposentadoria, as pensões, os pecúlios e os montepios, bem como as quantias recebidas por liberalidade de terceiro e destinadas ao sustento do devedor e de sua família (...)"

Ademais, conforme jurisprudência pacífica do Colendo Superior Tribunal de Justiça (STJ), a proteção legal da impenhorabilidade de até 40 salários mínimos (Art. 833, X, do CPC) se estende a contas-correntes e aplicações financeiras, visando resguardar a dignidade da pessoa humana e a subsistência do devedor.

II. DOS PEDIDOS
Diante do exposto, comprovada a natureza estritamente alimentar da verba constrita no montante de R$ ${data.value || '[VALOR BLOQUEADO]'}, requer-se:

a) O ACOLHIMENTO da presente manifestação para declarar a IMPENHORABILIDADE dos valores bloqueados;
b) A IMEDIATA EXPEDIÇÃO de ordem eletrônica de DESBLOQUEIO via SISBAJUD, restituindo a quantia à livre disposição do Executado;
c) A juntada dos documentos comprobatórios anexos.

Nestes termos, pede e espera deferimento.

[Cidade/UF], ${dateStr}.

___________________________________________________
Advogado(a) — OAB/[UF] nº [NÚMERO DA OAB]`
    };
  }

  // Peça: Procuração Ad Judicia
  if (draftType === 'procuracao') {
    return {
      success: true,
      draft: `PROCURAÇÃO AD JUDICIA ET EXTRA

OUTORGANTE: ${data.clientName || '[NOME DO CLIENTE]'}, brasileiro(a), inscrito(a) no CPF/CNPJ sob o nº ${data.cpf || '[CPF/CNPJ]'}, residente e domiciliado(a) em ${data.address || '[ENDEREÇO COMPLETO]'}, telefone: ${data.phone || '[TELEFONE]'}.

OUTORGADOS: ${data.lawyerName || 'JURISFLOW ADVOCACIA & ASSOCIADOS'}, sociedade de advogados inscrita na OAB sob o nº [OAB], com escritório profissional localizado em [ENDEREÇO DO ESCRITÓRIO], onde recebem intimações e notificações de estilo.

PODERES GERAIS: Pelo presente instrumento particular de mandato, o(a) OUTORGANTE nomeia e constitui os OUTORGADOS seus procuradores, conferindo-lhes amplos poderes para o foro em geral, com a cláusula "ad judicia et extra", em qualquer Juízo, Tribunal, Vara ou Órgão Administrativo em todo o território nacional.

PODERES ESPECIAIS: Os outorgados possuem ainda poderes específicos para propor ações, apresentar defesas e recursos, transigir, firmar acordos e compromissos, desistir, confessar, dar e receber quitação, levantar alvarás judiciais, RPVs e precatórios, substabelecer com ou sem reserva de iguais poderes, e praticar todos os demais atos indispensáveis ao fiel cumprimento deste mandato, especialmente para atuação em: ${data.subject || 'demanda cível, trabalhista ou consultoria jurídica'}.

Por ser expressão da verdade, firma o presente instrumento.

[Cidade/UF], ${dateStr}.

___________________________________________________
${data.clientName || 'Assinatura do Outorgante'}`
    };
  }

  // Peça: Notificação Extrajudicial
  if (draftType === 'notificacao') {
    return {
      success: true,
      draft: `NOTIFICAÇÃO EXTRAJUDICIAL PREMONITÓRIA
(Com Aviso de Recebimento / Registro Notarial)

À(AO) NOTIFICADA(O):
[NOME DO NOTIFICADO / EMPRESA]
CNPJ/CPF: [CNPJ/CPF DO NOTIFICADO]
Endereço: [ENDEREÇO COMPLETO DO NOTIFICADO]

NOTIFICANTE:
${data.clientName || '[NOME DO NOTIFICANTE]'}, inscrito(a) no CPF/CNPJ sob o nº ${data.cpf || '[CPF]'}, por intermédio de seus procuradores infra-assinados.

OBJETO: Notificação Formal para Cumprimento de Obrigação referente a: ${data.subject || 'regularização contratual / inadimplemento'}.

Prezados Senhores,

Servimo-nos da presente para NOTIFICAR formalmente Vossa Senhoria quanto à necessidade premente de regularização da obrigação em comento, no valor atualizado de R$ ${data.value || '0,00'}, oriunda de relação jurídica estabelecida entre as partes.

Diante do exposto, concedemos o prazo IMPRORROGÁVEL de 5 (cinco) dias úteis, a contar do recebimento desta, para que proceda ao adimplemento integral do débito ou formalize proposta amigável de quitação.

ADVERTÊNCIA: O não atendimento desta notificação no prazo assinalado ensejará o ajuizamento imediato da respectiva AÇÃO JUDICIAL de cobrança/execução, com a incidência cumulativa de:
1. Correção monetária integral e juros moratórios legais;
2. Multa compensatória e moratória previstas em contrato/lei;
3. Custas processuais e honorários advocatícios sucumbenciais de até 20% (Art. 85 do CPC).

[Cidade/UF], ${dateStr}.

___________________________________________________
Advogado(a) — OAB/[UF] [NÚMERO]`
    };
  }

  // Peça Padrão: Petição Cível
  return {
    success: true,
    draft: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA CÍVEL DA COMARCA DE [CIDADE/UF]

${data.clientName || '[NOME DO REQUERENTE]'}, brasileiro(a), qualificado(a) nos autos, por seu procurador infra-assinado, vem, respeitosamente, à presença de Vossa Excelência propor a presente

${draftType.toUpperCase().replace(/_/g, ' ')}

em face de [NOME DO REQUERIDO], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ], pelos fatos e fundamentos jurídicos a seguir aduzidos:

I. DOS FATOS
O requerente estabeleceu relação jurídica com o requerido consistente em: ${data.subject || 'prestação de serviços / obrigação contratual'}. Ocorre que a parte requerida restou inadimplente com os deveres assumidos...

II. DO DIREITO
Consoante preceitua a legislação pátria (Código Civil e Código de Processo Civil), o inadimplemento culposo obriga o devedor à reparação integral dos danos e ao cumprimento específico da obrigação...

III. DOS PEDIDOS
Ante o exposto, requer:
a) A citação do requerido para contestar a presente ação no prazo legal;
b) A total procedência dos pedidos formulados para condenar o requerido ao pagamento de R$ ${data.value || '10.000,00'};
c) A condenação do requerido ao pagamento de custas processuais e honorários advocatícios sucumbenciais.

Dá-se à causa o valor de R$ ${data.value || '10.000,00'}.

Nestes termos, pede deferimento.
[Cidade/UF], ${dateStr}.`
  };
}

// ============================================================================
// ANÁLISE DE PUBLICAÇÕES JUDICIAIS & PRAZOS
// ============================================================================

export async function analyzeLegalPublication(pubText, crmContext = null) {
  if (!pubText || pubText.trim().length === 0) {
    throw new Error('Texto da publicação não informado.');
  }

  const prompt = `Analise detalhadamente a seguinte publicação/intimação judicial e extraia de forma técnica:
1. Prazos processuais (informe quantidade exata de dias e se a contagem é em dias úteis CPC/CLT ou corridos CPP);
2. Providência processual e prática exigida do advogado e da equipe do escritório;
3. Número do processo e vara se identificável;
4. Matriz de risco de preclusão caso o prazo seja descumprido;
5. Resumo claro da determinação judicial.

Publicação:
${pubText}`;

  try {
    const externalResult = await callMultiProviderAi(prompt, ADVJURIS_PROMPTS.PUBLICATION_ANALYSIS, [], crmContext);
    if (externalResult) {
      const isPenal = pubText.toLowerCase().includes('crime') || pubText.toLowerCase().includes('penal') || pubText.toLowerCase().includes('cpp');
      const isTrabalhista = pubText.toLowerCase().includes('trabalh') || pubText.toLowerCase().includes('vara do trabalho') || pubText.toLowerCase().includes('clt');
      const days = pubText.includes('15') ? 15 : pubText.includes('5') ? 5 : pubText.includes('8') ? 8 : pubText.includes('10') ? 10 : 15;

      return {
        text: externalResult,
        processNumber: pubText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0] || 'Identificado na análise',
        days: days,
        type: isPenal ? 'penal' : isTrabalhista ? 'trabalhista' : 'civel',
        action: 'Manifestar nos autos tempestivamente'
      };
    }
  } catch (err) {
    console.warn("Erro IA na publicação: ", err.message);
  }

  await new Promise(r => setTimeout(r, 200));
  const isPenal = pubText.toLowerCase().includes('crime') || pubText.toLowerCase().includes('penal') || pubText.toLowerCase().includes('réu preso') || pubText.toLowerCase().includes('cpp');
  const isTrabalhista = pubText.toLowerCase().includes('trabalh') || pubText.toLowerCase().includes('vara do trabalho') || pubText.toLowerCase().includes('clt');
  const days = pubText.includes('15') ? 15 : pubText.includes('5') ? 5 : pubText.includes('8') ? 8 : pubText.includes('10') ? 10 : 15;
  const procMatch = pubText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0];

  return {
    text: `### ⚖️ PARECER TÉCNICO DE AUDITORIA DE PUBLICAÇÃO — ADVJURIS

## 1. Identificação Processual
* **Número do Processo (CNJ):** \`${procMatch || 'Processo sob segredo de justiça ou número não informado'}\`
* **Ramo da Justiça:** ${isPenal ? 'Justiça Criminal (Processo Penal)' : isTrabalhista ? 'Justiça do Trabalho (TRT/CLT)' : 'Justiça Comum / Cível (CPC/2015)'}
* **Regra de Contagem:** ${isPenal ? '**DIAS CORRIDOS** (Art. 798 do CPP)' : '**DIAS ÚTEIS** (Art. 219 do CPC / Art. 775 da CLT)'}

## 2. Providência Prática Obrigatória
* **Prazo Assinalado pelo Juízo:** **${days} dias ${isPenal ? 'corridos' : 'úteis'}**
* **Providência da Equipe:** Manifestar-se formalmente nos autos, anexando as peças processuais e elementos de prova exigidos pelo magistrado.

## 3. Matriz de Riscos & Alerta de Preclusão
* **[Risco Crítico]:** O não cumprimento no prazo fatal acarreta preclusão temporal e renúncia ao direito de produzir a prova ou recurso cabível.
* **Ação Recomendada:** Clique no botão **"Criar Prazo no CRM"** para agendar a data fatal na agenda da equipe.`,
    processNumber: procMatch || 'Identificado na análise',
    days: days,
    type: isPenal ? 'penal' : isTrabalhista ? 'trabalhista' : 'civel',
    action: 'Manifestar nos autos conforme determinação judicial'
  };
}

// ============================================================================
// EXPLICADOR AO CLIENTE (WHATSAPP HUMANIZADO)
// ============================================================================

export async function explainToClient(legalText, clientName = 'Cliente', crmContext = null) {
  if (!legalText) throw new Error('Texto jurídico não informado.');

  const prompt = `Traduza o seguinte despacho judicial para uma mensagem de WhatsApp extremamente clara, acolhedora, sem juridiquês e tranquilizadora para o cliente ${clientName}:

Texto Jurídico:
${legalText}`;

  try {
    const externalResult = await callMultiProviderAi(prompt, ADVJURIS_PROMPTS.CLIENT_EXPLAINER, [], crmContext);
    if (externalResult) {
      return { text: externalResult };
    }
  } catch (err) {
    console.warn("Erro IA explainer: ", err.message);
  }

  await new Promise(r => setTimeout(r, 200));
  return {
    text: `Olá, ${clientName}! Tudo bem? 😊

Passando para te dar uma atualização rápida sobre o andamento do seu processo:

O juiz deu um despacho de rotina no caso solicitando uma manifestação da nossa equipe sobre os documentos juntados. Nossa equipe jurídica já está cuidando de tudo para protocolar nossa resposta no prazo certo com máxima atenção aos seus direitos.

Você não precisa se preocupar com nada no momento! Qualquer novidade importante te aviso por aqui.

Um grande abraço,
Sua Equipe Jurídica ⚖️`
  };
}

// ============================================================================
// CONTRATOS & AUDITORIA ESPECIALIZADA
// ============================================================================

export async function analyzeContractWithAdvJuris(contractText, contractType = 'Honorários', crmContext = null) {
  const prompt = `Faça uma auditoria minuciosa deste contrato de ${contractType} com base nas normas do Código Civil, Código de Defesa do Consumidor e Estatuto da OAB (Art. 50 do CED):
${contractText}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_PROMPTS.CONTRACT_REVIEW, [], crmContext);
  if (externalResult) return externalResult;

  await new Promise(r => setTimeout(r, 200));
  return `### 📑 AUDITORIA CONTRATUAL — ADVJURIS

1. **Objeto e Escopo:** Cláusula descritiva clara. Recomenda-se explicitar se inclui eventuais recursos aos Tribunais Superiores (STJ/STF).
2. **Honorários e Quota Litis (Art. 50 do CED da OAB):** A soma dos honorários contratuais e sucumbenciais não pode exceder a vantagem econômica auferida pelo cliente.
3. **Cláusula de Rescisão e Revogação:** Recomenda-se prever honorários proporcionais ao trabalho prestado em caso de revogação imotivada do mandato.
4. **Proteção de Dados & LGPD:** Inclusão de cláusula expressa autorizando o tratamento estritamente para a finalidade da defesa jurídica.`;
}

export async function generateContractWithAdvJuris(type, data = {}, crmContext = null) {
  const prompt = `Elabore um contrato completo e blindado de ${type} com as seguintes especificações:
${JSON.stringify(data, null, 2)}`;

  try {
    const externalResult = await callMultiProviderAi(prompt, ADVJURIS_PROMPTS.CONTRACT_GENERATOR, [], crmContext);
    if (externalResult) return externalResult;
  } catch (err) {
    console.warn("Erro IA contrato: ", err.message);
  }

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS

CONTRATANTE: ${data.clientName || '[NOME DO CLIENTE]'}, inscrito(a) no CPF/CNPJ sob o nº ${data.cpf || '[CPF/CNPJ]'};
CONTRATADO: ${data.lawyerName || 'JURISFLOW ADVOCACIA & ASSOCIADOS'}, OAB/SP nº [NÚMERO OAB];

CLÁUSULA 1ª - DO OBJETO: Prestação de serviços jurídicos em favor do CONTRATANTE para atuação em ${data.subject || 'demanda cível/trabalhista'}.
CLÁUSULA 2ª - DOS HONORÁRIOS: Pelos serviços prestados, o CONTRATANTE pagará a quantia de R$ ${data.value || '5.000,00'}.
CLÁUSULA 3ª - DA LGPD: As partes declaram ciência e conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
CLÁUSULA 4ª - DO FORO: Fica eleito o foro da Comarca local.`;
}
