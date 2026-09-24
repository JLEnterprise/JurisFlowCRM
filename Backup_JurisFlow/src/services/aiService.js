/**
 * JurisFlow Multi-Provider AI Service
 * Integração completa com Google Gemini API, OpenAI ChatGPT API e Motor Cognitivo AdvJuris Local.
 */

import { ADVJURIS_SYSTEM_PROMPT } from '../agents/advJurisPrompt';
import { generateDeepLegalAnswer } from './deepLegalEngine';

const GEMINI_STORAGE_KEY = 'jurisflow_gemini_api_key';
const OPENAI_STORAGE_KEY = 'jurisflow_openai_api_key';
const AI_PROVIDER_KEY = 'jurisflow_ai_provider'; // 'gemini' | 'openai' | 'local'
const SELECTED_MODEL_KEY = 'jurisflow_ai_model';

// ============================================================================
// CONFIGURAÇÃO E PERSISTÊNCIA DE CHAVES & PROVEDORES
// ============================================================================

export function getGeminiApiKey() {
  return localStorage.getItem(GEMINI_STORAGE_KEY) || '';
}

export function setGeminiApiKey(key) {
  if (!key) {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  } else {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  }
}

export function getOpenAiApiKey() {
  return localStorage.getItem(OPENAI_STORAGE_KEY) || '';
}

export function setOpenAiApiKey(key) {
  if (!key) {
    localStorage.removeItem(OPENAI_STORAGE_KEY);
  } else {
    localStorage.setItem(OPENAI_STORAGE_KEY, key.trim());
  }
}

export function getAiProvider() {
  return localStorage.getItem(AI_PROVIDER_KEY) || 'gemini';
}

export function setAiProvider(provider) {
  localStorage.setItem(AI_PROVIDER_KEY, provider);
}

export function getSelectedModel() {
  return localStorage.getItem(SELECTED_MODEL_KEY) || '';
}

export function setSelectedModel(model) {
  localStorage.setItem(SELECTED_MODEL_KEY, model);
}

// ============================================================================
// TESTES DE CONEXÃO EM TEMPO REAL
// ============================================================================

export async function testGeminiApiKey(key) {
  if (!key) return { success: false, message: 'Chave Gemini não informada' };
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key.trim()}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Olá! Responda apenas "OK".' }] }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || `Erro ${res.status}: ${res.statusText}` };
    }
    return { success: true, message: 'Google Gemini conectado com sucesso!' };
  } catch (err) {
    return { success: false, message: err.message || 'Falha de conexão com a Google API' };
  }
}

export async function testOpenAiApiKey(key) {
  if (!key) return { success: false, message: 'Chave OpenAI não informada' };
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
        messages: [{ role: 'user', content: 'Olá! Responda apenas "OK".' }],
        max_tokens: 5
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.error?.message || `Erro ${res.status}: ${res.statusText}` };
    }
    return { success: true, message: 'OpenAI ChatGPT conectado com sucesso!' };
  } catch (err) {
    return { success: false, message: err.message || 'Falha de conexão com a OpenAI API' };
  }
}

// ============================================================================
// FORMATAÇÃO DO CONTEXTO DO CRM PARA A IA
// ============================================================================

function buildCrmContextPrompt(crmContext) {
  if (!crmContext) return '';

  const { clients = [], processes = [], tasks = [], contracts = [], officeSettings = {} } = crmContext;

  const clientList = clients.slice(0, 15).map(c => 
    `- Cliente: ${c.name} | CPF: ${c.cpf || 'N/I'} | Status: ${c.status || 'Ativo'} | Tel: ${c.phone || c.whatsapp || 'N/I'}`
  ).join('\n');

  const processList = processes.slice(0, 15).map(p =>
    `- Processo: ${p.processNumber || 'Sem número'} | Cliente: ${p.clientName || 'N/I'} | Vara: ${p.court || p.vara || 'N/I'} | Área: ${p.legalArea || 'Cível'} | Fase: ${p.phase || p.status || 'Em andamento'}`
  ).join('\n');

  const taskList = tasks.filter(t => t.status !== 'completed').slice(0, 10).map(t =>
    `- Tarefa/Prazo: ${t.title} | Data Limite: ${t.dueDate || 'Pendente'} | Prioridade: ${t.priority || 'Normal'}`
  ).join('\n');

  return `
---
[BASE DE DADOS EM TEMPO REAL DO CRM JURISFLOW]:
Escritório: ${officeSettings.officeName || 'JurisFlow Advocacia'}

CLIENTES ATIVOS CADASTRADOS NO CRM:
${clientList || 'Nenhum cliente cadastrado no momento.'}

PROCESSOS JUDICIAIS NO CRM:
${processList || 'Nenhum processo cadastrado no momento.'}

PRAZOS E TAREFAS PENDENTES:
${taskList || 'Nenhum prazo pendente registrado.'}
---
Quando o advogado perguntar sobre um cliente (ex: "Bruno Alexssander Souza Silva", "Maria", etc.), sobre um processo, prazo ou contrato, utilize esses dados do CRM para responder com precisão cirúrgica. Se o cliente pesquisado NÃO constar nessa lista, informe claramente que ele não está cadastrado ainda e pergunte se deseja cadastrá-lo ou elaborar a tese jurídica para ele.
`;
}

// ============================================================================
// EXECUÇÃO MULTI-PROVEDOR (GEMINI, OPENAI & ADVJURIS LOCAL)
// ============================================================================

export async function callMultiProviderAi(prompt, systemInstruction = ADVJURIS_SYSTEM_PROMPT, conversationHistory = [], crmContext = null) {
  const provider = getAiProvider();
  const crmSnippet = buildCrmContextPrompt(crmContext);
  const fullSystemPrompt = crmSnippet ? `${systemInstruction}\n\n${crmSnippet}` : systemInstruction;

  // 1. OpenAI ChatGPT
  if (provider === 'openai') {
    const openAiKey = getOpenAiApiKey();
    if (openAiKey) {
      const res = await callOpenAiApi(prompt, fullSystemPrompt, openAiKey, conversationHistory);
      if (res) return res;
    }
  }

  // 2. Google Gemini
  if (provider === 'gemini' || provider === 'openai') {
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      const res = await callGeminiApi(prompt, fullSystemPrompt, geminiKey, conversationHistory);
      if (res) return res;
    }
  }

  // 3. Fallback ou Modo Local AdvJuris
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
          continue; // Evita duplicar a última mensagem
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
    }
  } catch (err) {
    console.warn('Falha na chamada OpenAI:', err.message);
  }
  return null;
}

export async function callGeminiApi(prompt, systemInstruction = ADVJURIS_SYSTEM_PROMPT, key = '', conversationHistory = []) {
  const currentKey = key || getGeminiApiKey();
  if (!currentKey) return null;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

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
        contents.push({
          role: role,
          parts: [{ text: m.content }]
        });
      }
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${prompt}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
  }

  for (const m of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${currentKey}`;
      const payload = {
        contents: contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3500,
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (err) {
      console.warn(`Tentativa Gemini (${m}) falhou:`, err.message);
    }
  }

  return null;
}

// ============================================================================
// CONSULTORIA JURÍDICA ADVJURIS (MULTI-TURN & CRM INTEGRADO)
// ============================================================================

export async function consultAdvJuris(question, context = '', customApiKey = '', chatHistory = [], crmContext = null) {
  if (!question || question.trim().length === 0) {
    return { success: false, answer: 'Por favor, digite sua consulta jurídica.' };
  }

  const externalResult = await callMultiProviderAi(question, ADVJURIS_SYSTEM_PROMPT, chatHistory, crmContext);
  if (externalResult) {
    return { success: true, answer: externalResult };
  }

  // Motor Contextual Profundo AdvJuris Local
  await new Promise(r => setTimeout(r, 400));
  const localAnswer = generateDeepLegalAnswer(question, chatHistory, crmContext);
  return { success: true, answer: localAnswer };
}

// ============================================================================
// GERADOR DE PEÇAS PROCESSUAIS E MINUTAS
// ============================================================================

export async function generateLegalDraft(draftType, data = {}) {
  const prompt = `Elabore uma peça jurídica profissional de ${draftType} com os seguintes dados:
${JSON.stringify(data, null, 2)}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_SYSTEM_PROMPT);
  if (externalResult) {
    return { success: true, draft: externalResult };
  }

  await new Promise(r => setTimeout(r, 450));
  const dateStr = new Date().toLocaleDateString('pt-BR');

  if (draftType === 'procuracao') {
    return {
      success: true,
      draft: `PROCURAÇÃO "AD JUDICIA ET EXTRA"

OUTORGANTE: ${data.clientName || '[NOME COMPLETO DO CLIENTE]'}, brasileiro(a), inscrito(a) no CPF sob o nº ${data.cpf || '[000.000.000-00]'}, residente e domiciliado(a) em ${data.address || '[ENDEREÇO COMPLETO]'};

OUTORGADOS: Os advogados integrantes da sociedade de advogados ${data.lawyerName || 'JURISFLOW ADVOCACIA'}, inscritos na OAB/SP sob o nº ${data.oab || '[OAB/SP 123.456]'}, com escritório profissional na sede do escritório;

PODERES ESPECIAIS: Pelo presente instrumento particular, o(a) OUTORGANTE confere aos OUTORGADOS amplos poderes para o foro em geral, consubstanciados na cláusula "ad judicia et extra", para representá-lo(a) perante qualquer Juízo, Tribunal, Cartório ou Repartição Pública, podendo propor ações, apresentar defesas e recursos, transigir, firmar compromissos, desistir, receber e dar quitação, substabelecer com ou sem reserva de poderes, praticando todos os atos necessários ao fiel cumprimento do mandato.

[Cidade/UF], ${dateStr}.

___________________________________________________
${data.clientName || 'Assinatura do Outorgante'}`
    };
  }

  if (draftType === 'notificacao') {
    return {
      success: true,
      draft: `NOTIFICAÇÃO EXTRAJUDICIAL COM AVISO DE RECEBIMENTO

A: [NOME DO NOTIFICADO / EMPRESA]
Endereço: [ENDEREÇO DO NOTIFICADO]

DE: ${data.clientName || '[NOME DO NOTIFICANTE]'}
Por seu procurador que esta subscreve: ${data.lawyerName || 'JURISFLOW ADVOCACIA (OAB/SP 123.456)'}

ASSUNTO: Notificação para regularização de pendência e constituição em mora.

Prezados Senhores,

Servimo-nos da presente para NOTIFICAR formalmente Vossa Senhoria acerca do descumprimento das obrigações assumidas referente a: ${data.subject || 'prestação de serviços/inadimplemento contratual'}.

Diante do exposto, concedemos o prazo improrrogável de 5 (cinco) dias úteis, contados do recebimento desta, para que proceda à regularização da pendência apontada.

O não atendimento da presente notificação ensejará a imediata adoção das medidas judiciais cabíveis, com a incidência de juros moratórios, correção monetária, custas processuais e honorários advocatícios sucumbenciais.

[Cidade/UF], ${dateStr}.

___________________________________________________
Advogado(a) - OAB/SP 123.456`
    };
  }

  return {
    success: true,
    draft: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA CÍVEL DA COMARCA DE [CIDADE/UF]

[NOME DO REQUERENTE], brasileiro(a), qualificado(a) nos autos, por seu advogado infra-assinado, vem respeitosamente perante Vossa Excelência propor:

${draftType.toUpperCase()}

em face de [NOME DO REQUERIDO], pelas razões de fato e de direito a seguir expostas:

I - DOS FATOS
O requerente é titular do direito violado...

II - DO DIREITO
Consoante preceitua a legislação pátria...

III - DOS PEDIDOS
Ante o exposto, requer a citação do requerido e a total procedência dos pedidos.

Dá-se à causa o valor de R$ ${data.value || '10.000,00'}.

Nestes termos, pede deferimento.
[Cidade/UF], ${dateStr}.`
  };
}

// ============================================================================
// ANÁLISE DE PUBLICAÇÕES JUDICIAIS
// ============================================================================

export async function analyzeLegalPublication(pubText) {
  if (!pubText || pubText.trim().length === 0) {
    throw new Error('Texto da publicação não informado.');
  }

  const prompt = `Analise detalhadamente a seguinte publicação/intimação judicial e extraia:
1. Prazos processuais (informe dias e se a contagem é em dias úteis CPC/CLT ou corridos CPP);
2. Providência processual exigida do advogado;
3. Número do processo e vara se identificável;
4. Resumo claro da determinação judicial.

Publicação:
${pubText}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_SYSTEM_PROMPT);
  if (externalResult) {
    return {
      text: externalResult,
      processNumber: pubText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0] || 'Identificado na análise',
      days: pubText.includes('15') ? 15 : pubText.includes('5') ? 5 : 15,
      type: pubText.toLowerCase().includes('trabalho') ? 'trabalhista' : 'civel',
      action: 'Cumprir determinação judicial tempestivamente'
    };
  }

  await new Promise(r => setTimeout(r, 400));
  const isPenal = pubText.toLowerCase().includes('crime') || pubText.toLowerCase().includes('penal') || pubText.toLowerCase().includes('réu preso');
  const isTrabalhista = pubText.toLowerCase().includes('trabalh') || pubText.toLowerCase().includes('vara do trabalho') || pubText.toLowerCase().includes('clt');
  const days = pubText.includes('15') ? 15 : pubText.includes('5') ? 5 : pubText.includes('8') ? 8 : 15;

  return {
    text: `### 📋 PARECER TÉCNICO DE ANÁLISE DE PUBLICAÇÃO — ADVJURIS

## 1. Identificação Processual
* **Número do Processo:** ${pubText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0] || 'Processo sob segredo de justiça ou número não informado'}
* **Ramo do Direito:** ${isPenal ? 'Processo Penal (CPP)' : isTrabalhista ? 'Processo do Trabalho (CLT)' : 'Processo Civil (CPC/2015)'}
* **Regra de Contagem de Prazos:** ${isPenal ? '**DIAS CORRIDOS** (Art. 798 do CPP)' : '**DIAS ÚTEIS** (Art. 219 do CPC / Art. 775 da CLT)'}

## 2. Providência Obrigatória do Advogado
* **Prazo Assinalado:** **${days} dias**
* **Determinação Judicial:** Manifestar-se tempestivamente nos autos, anexando as peças e documentos probatórios requeridos pelo magistrado.

## 3. Matriz de Risco Processual
* **[Risco de Preclusão]:** O não cumprimento no prazo fatal de ${days} dias acarreta preclusão temporal e eventuais prejuízos probatórios ao cliente.`,
    processNumber: pubText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)?.[0] || 'Identificado na análise',
    days: days,
    type: isPenal ? 'penal' : isTrabalhista ? 'trabalhista' : 'civel',
    action: 'Manifestar nos autos conforme prazo assinalado'
  };
}

// ============================================================================
// EXPLICADOR AO CLIENTE (WHATSAPP)
// ============================================================================

export async function explainToClient(legalText, clientName = 'Cliente') {
  if (!legalText) throw new Error('Texto jurídico não informado.');

  const prompt = `Traduza o seguinte despacho ou decisão jurídica para uma mensagem de WhatsApp extremamente clara, educada e tranquilizadora para o cliente ${clientName}. Evite "juridiquês", use emojis e seja direto.

Texto Jurídico:
${legalText}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_SYSTEM_PROMPT);
  if (externalResult) {
    return { text: externalResult };
  }

  await new Promise(r => setTimeout(r, 300));
  return {
    text: `Olá, ${clientName}! Tudo bem? 😊

Passando para te dar uma atualização sobre o seu processo:

O juiz deu um novo andamento no caso e nos solicitou uma manifestação sobre os documentos. Nossa equipe já está cuidando disso para responder tudo dentro do prazo com máxima atenção.

Você não precisa se preocupar com nada no momento! Qualquer novidade importante te aviso por aqui.

Um abraço,
Sua equipe jurídica ⚖️`
  };
}

// ============================================================================
// CONTRATOS & ADVJURIS ESPECIALIZADO
// ============================================================================

export async function analyzeContractWithAdvJuris(contractText, contractType = 'Honorários') {
  const prompt = `Faça uma auditoria minuciosa deste contrato de ${contractType} com base nas normas do Código de Defesa do Consumidor, Código Civil e Estatuto da OAB (Art. 50 do CED):
${contractText}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_SYSTEM_PROMPT);
  if (externalResult) return externalResult;

  await new Promise(r => setTimeout(r, 450));
  return `### 🔍 AUDITORIA CONTRATUAL — ADVJURIS

1. **Objeto e Escopo:** Cláusula clara, porém recomenda-se especificar expressamente se a atuação engloba fase recursal aos Tribunais Superiores.
2. **Honorários e Quota Litis (Art. 50 do CED da OAB):** A soma dos honorários contratuais e sucumbenciais não pode exceder o proveito econômico do cliente.
3. **Cláusula de Rescisão e Revogação de Mandato:** Recomenda-se estipular honorários proporcionais em caso de revogação imotivada.
4. **Foro de Eleição:** Válido para pessoas jurídicas; em contratos de consumo, prevalece o domicílio do consumidor.`;
}

export async function generateContractWithAdvJuris(type, data = {}) {
  const prompt = `Elabore um contrato completo e profissional de ${type} com as seguintes especificações:
${JSON.stringify(data, null, 2)}`;

  const externalResult = await callMultiProviderAi(prompt, ADVJURIS_SYSTEM_PROMPT);
  if (externalResult) return externalResult;

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS

CONTRATANTE: ${data.clientName || '[NOME DO CLIENTE]'}, CPF nº ${data.cpf || '[CPF]'};
CONTRATADO: ${data.lawyerName || 'JURISFLOW ADVOCACIA'}, OAB/SP nº ${data.oab || '123.456'};

CLÁUSULA 1ª - DO OBJETO: Prestação de serviços jurídicos em favor do CONTRATANTE para atuação em ${data.subject || 'demanda cível/trabalhista'}.
CLÁUSULA 2ª - DOS HONORÁRIOS: Pelos serviços prestados, o CONTRATANTE pagará o valor de R$ ${data.value || '5.000,00'}.
CLÁUSULA 3ª - DO FORO: Fica eleito o foro da Comarca local.`;
}
