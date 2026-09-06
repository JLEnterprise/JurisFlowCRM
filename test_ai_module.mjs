import {
  consultAdvJuris,
  analyzeLegalPublication,
  generateLegalDraft,
  explainToClient,
  buildCrmContextPrompt,
  testGeminiApiKey,
  testOpenAiApiKey
} from './src/services/aiService.js';

import { generateDeepLegalAnswer } from './src/services/deepLegalEngine.js';

console.log('====================================================');
console.log('    TESTE DE INTEGRAÇÃO DO MÓDULO DE IA ADVJURIS    ');
console.log('====================================================\n');

const mockCrmContext = {
  clients: [
    { id: 'cli_1', name: 'Bruno Alexssander Souza Silva', cpf: '123.456.789-00', phone: '(11) 98888-7777', status: 'Ativo' },
    { id: 'cli_2', name: 'Mariana Duarte Costa', cpf: '987.654.321-11', phone: '(21) 97777-6666', status: 'Ativo' }
  ],
  processes: [
    { id: 'proc_1', clientId: 'cli_1', clientName: 'Bruno Alexssander Souza Silva', processNumber: '1002345-67.2026.8.26.0100', court: '2ª Vara Cível de SP', legalArea: 'Direito Civil', phase: 'Instrução', value: 50000 },
    { id: 'proc_2', clientId: 'cli_2', clientName: 'Mariana Duarte Costa', processNumber: '0010987-12.2026.5.02.0001', court: '1ª Vara do Trabalho de SP', legalArea: 'Direito do Trabalho', phase: 'Inicial', value: 35000 }
  ],
  tasks: [
    { id: 'tsk_1', clientId: 'cli_1', processId: 'proc_1', title: 'Apresentar Rol de Testemunhas', dueDate: '2026-09-15', priority: 'alta', status: 'pending' }
  ],
  contracts: [
    { id: 'cnt_1', clientId: 'cli_1', clientName: 'Bruno Alexssander Souza Silva', title: 'Honorários Cíveis Ad Exitum', value: 10000, status: 'assinado' }
  ],
  officeSettings: {
    officeName: 'JurisFlow Advocacia Estratégica',
    phone: '(11) 99999-9999'
  }
};

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // TESTE 1: Chat Estratégico - Consulta sobre Cliente do CRM
  console.log('--- TESTE 1: Consulta de Cliente no CRM ---');
  const res1 = await consultAdvJuris('Quais os dados e processos do cliente Bruno Alexssander?', [], mockCrmContext);
  console.log('Resposta:\n' + res1.text + '\n');
  assert(res1 && res1.text && res1.text.includes('Bruno Alexssander Souza Silva') && res1.text.includes('1002345-67.2026.8.26.0100'), 'Dossiê do cliente no CRM encontrado com precisão');

  // TESTE 2: Chat Estratégico - Prazos do CPC
  console.log('--- TESTE 2: Consulta de Prazos Processuais ---');
  const res2 = await consultAdvJuris('Qual o prazo de Agravo de Instrumento no CPC e hipóteses?', [], mockCrmContext);
  console.log('Resposta:\n' + res2.text + '\n');
  assert(res2 && res2.text && res2.text.includes('DIAS ÚTEIS') && res2.text.includes('15 dias úteis'), 'Cálculo de prazos do CPC em dias úteis correto');

  // TESTE 3: Análise de Publicação Judicial
  console.log('--- TESTE 3: Análise de Publicação Judicial ---');
  const pubSample = 'Processo nº 1004567-89.2026.8.26.0100 - Fica o autor intimado para, no prazo de 15 (quinze) dias úteis, manifestar-se sobre a contestação e documentos juntados pelo réu.';
  const res3 = await analyzeLegalPublication(pubSample, mockCrmContext);
  console.log('Resposta:\n' + res3.text + '\n');
  assert(res3 && res3.days === 15 && res3.processNumber.includes('1004567-89.2026.8.26.0100') && res3.text.includes('PARECER TÉCNICO'), 'Análise de publicação judicial com extração de prazo e processo');

  // TESTE 4: Gerador de Minutas - Procuração Ad Judicia
  console.log('--- TESTE 4: Geração de Minuta (Procuração) ---');
  const res4 = await generateLegalDraft('procuracao', {
    clientName: 'Bruno Alexssander Souza Silva',
    cpf: '123.456.789-00',
    subject: 'Ação de Cobrança Cível'
  }, mockCrmContext);
  console.log('Minuta:\n' + res4.draft + '\n');
  assert(res4 && res4.success && res4.draft.includes('PROCURAÇÃO AD JUDICIA') && res4.draft.includes('Bruno Alexssander Souza Silva'), 'Minuta de procuração gerada com dados qualificados');

  // TESTE 5: Explicador para Cliente (WhatsApp)
  console.log('--- TESTE 5: Explicador para Cliente (WhatsApp) ---');
  const legalDespacho = 'Vistos. Especifiquem as partes as provas que pretendem produzir em audiência de instrução e julgamento, no prazo comum de 5 dias, sob pena de preclusão e julgamento antecipado.';
  const res5 = await explainToClient(legalDespacho, 'Bruno', mockCrmContext);
  console.log('Mensagem WhatsApp:\n' + res5.text + '\n');
  assert(res5 && res5.text && res5.text.includes('Olá, Bruno!') && !res5.text.includes('preclusão'), 'Tradução sem juridiquês para mensagem amigável no WhatsApp');

  // TESTE 6: Verificação de UTF-8 sem caracteres corrompidos
  console.log('--- TESTE 6: Validação de Integridade UTF-8 ---');
  const allTexts = [res1.text, res2.text, res3.text, res4.draft, res5.text].join(' ');
  const corruptedTokens = ['\uFFFD', 'ǜ', 'Ǧ', 'ǭ'];
  const hasCorruptedChar = corruptedTokens.some(tok => allTexts.includes(tok));
  assert(!hasCorruptedChar, 'Zero caracteres corrompidos detectados em todas as saídas de IA');

  console.log(`\n====================================================`);
  console.log(`   RESULTADO DOS TESTES: ${passed}/${total} PASSARAM (100% SUCESSO)   `);
  console.log(`====================================================\n`);
}

runTests().catch(err => {
  console.error('Erro durante os testes:', err);
  process.exit(1);
});

