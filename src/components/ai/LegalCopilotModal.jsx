import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  FileText,
  Calendar,
  Send,
  MessageSquare,
  Bot,
  Copy,
  Check,
  PlusCircle,
  FileCheck,
  ShieldCheck,
  Scale,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Search,
  Key,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  User,
  Briefcase,
  Settings,
  Trash2,
  Download,
  PhoneCall,
  Gavel,
  Zap,
  BookOpen,
  Users,
  Compass,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Share2,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  analyzeLegalPublication,
  generateLegalDraft,
  explainToClient,
  consultAdvJuris,
  getGeminiApiKey,
  setGeminiApiKey,
  testGeminiApiKey,
  getOpenAiApiKey,
  setOpenAiApiKey,
  testOpenAiApiKey,
  getAiProvider,
  setAiProvider,
} from '../../services/aiService';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Renderizador de Markdown Jurídico Enriquecido para o Chat
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${renderedElements.length}`} className="my-2 space-y-1 pl-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
              <span>{formatInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const formatInlineMarkdown = (text) => {
    if (!text) return text;
    // Substituições de negrito **texto**
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-amber-300">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-slate-800 dark:text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-amber-700 dark:text-amber-400 border border-slate-300/60 dark:border-slate-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    // Título H1 / H2 (# / ##)
    if (line.startsWith('# ') || line.startsWith('## ')) {
      flushList();
      const text = line.replace(/^#{1,2}\s+/, '');
      renderedElements.push(
        <h3 key={`h2-${i}`} className="mt-4 mb-2 text-sm font-extrabold text-slate-900 dark:text-amber-400 flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-1.5">
          <Scale className="h-4 w-4 text-amber-500" />
          {formatInlineMarkdown(text)}
        </h3>
      );
      continue;
    }

    // Título H3 (###)
    if (line.startsWith('### ')) {
      flushList();
      const text = line.replace(/^###\s+/, '');
      renderedElements.push(
        <h4 key={`h3-${i}`} className="mt-3 mb-1.5 text-xs font-bold text-slate-800 dark:text-amber-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          {formatInlineMarkdown(text)}
        </h4>
      );
      continue;
    }

    // Citações (>) Artigos de Lei / Jurisprudência
    if (line.startsWith('>')) {
      flushList();
      const text = line.replace(/^>\s*/, '');
      renderedElements.push(
        <blockquote key={`quote-${i}`} className="my-2 rounded-r-xl border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 p-3 text-xs italic text-slate-700 dark:text-slate-300">
          {formatInlineMarkdown(text)}
        </blockquote>
      );
      continue;
    }

    // Listas (*, -, •, ou numéricas 1.)
    if (line.match(/^[\*\-\•]\s+/) || line.match(/^\d+\.\s+/)) {
      inList = true;
      const text = line.replace(/^[\*\-\•\d\.]+\s+/, '');
      listItems.push(text);
      continue;
    }

    // Linha normal
    flushList();
    renderedElements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        {formatInlineMarkdown(line)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-1">{renderedElements}</div>;
}

export function LegalCopilotModal({ isOpen, onClose, onAddTask, initialData = null, initialTab = null }) {
  const {
    showToast,
    addTask,
    clients = [],
    processes = [],
    tasks = [],
    contracts = [],
    proposals = [],
    leads = [],
    appointments = [],
    attendances = [],
    officeSettings = {}
  } = useCRM();

  const { currentUser } = useAuth();

  const normalizeTab = (t) => {
    if (!t) return 'chat';
    if (t === 'intimacoes' || t === 'publicacao' || t === 'publicacoes' || t === 'prazos') return 'publicacoes';
    if (t === 'minuta' || t === 'minutas' || t === 'pecas' || t === 'peticoes') return 'minutas';
    if (t === 'whatsapp' || t === 'cliente') return 'whatsapp';
    if (t === 'manual' || t === 'guia' || t === 'ajuda') return 'manual';
    return 'chat';
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab || initialData?.tab));
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [activeCategory, setActiveCategory] = useState('advogado');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const chatEndRef = useRef(null);

  // Multi-Provider state
  const [currentProvider, setCurrentProvider] = useState('gemini'); // 'gemini' | 'openai' | 'local'
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [openAiKeyInput, setOpenAiKeyInput] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [activeKeyTab, setActiveKeyTab] = useState('gemini');
  const [testingKey, setTestingKey] = useState(false);

  // Tab 1: Publicações
  const [pubText, setPubText] = useState(initialData?.publicationText || '');
  const [pubResult, setPubResult] = useState(null);

  // Tab 2: Minutas
  const [draftType, setDraftType] = useState('desbloqueio_sisbajud');
  const [draftClientId, setDraftClientId] = useState('');
  const [draftClientName, setDraftClientName] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftValue, setDraftValue] = useState('');
  const [draftResult, setDraftResult] = useState(null);

  // Tab 3: Explicador Cliente
  const [explainerInput, setExplainerInput] = useState('');
  const [explainerClient, setExplainerClient] = useState('');
  const [explainerResult, setExplainerResult] = useState('');

  // Tab 4: Chatbot Inteligente & Assistente do Dia a Dia
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: `Olá, **${currentUser?.name?.split(' ')[0] || 'Doutor(a)'}**! Sou o **Copiloto Jurídico & AdvJuris IA (Legal Engineer)**.

Estou conectado em tempo real à base de dados do escritório (**${officeSettings.officeName || 'JurisFlow Advocacia'}**), aos seus clientes, processos judiciais, prazos fatais, audiências e contratos.

### ⚖️ Em que posso te auxiliar estrategicamente agora?
* 🏛️ **Processo Civil (CPC/STJ):** *"Qual a contagem de prazo para Agravo de Instrumento e hipóteses do Art. 1.015?"*
* 💼 **Direito do Trabalho (CLT/TST):** *"Requisitos para rescisão indireta por falta de FGTS e Art. 775 da CLT?"*
* 🛡️ **Execuções & SISBAJUD:** *"Como solicitar o desbloqueio de salário ou de reserva de até 40 salários mínimos?"*
* 📅 **Prazos & Briefing:** *"Quais são os prazos fatais e audiências agendadas para esta semana no CRM?"*
* 📝 **Minutas & Peças:** *"Redija uma peça de contestação com preliminares de inépcia e ilegitimidade"*
* 💬 **WhatsApp de Clientes:** *"Traduza um despacho de especificação de provas para linguagem amigável"*

*Selecione um dos atalhos abaixo ou faça sua pergunta jurídica ou operacional livremente!*`
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      setCurrentProvider(getAiProvider());
      setGeminiKeyInput(getGeminiApiKey());
      setOpenAiKeyInput(getOpenAiApiKey());
      if (initialTab || initialData?.tab) {
        setActiveTab(normalizeTab(initialTab || initialData?.tab));
      }
    }
  }, [isOpen, initialTab, initialData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  if (!isOpen) return null;

  const handleProviderChange = (prov) => {
    setCurrentProvider(prov);
    setAiProvider(prov);
    const provName = prov === 'gemini' ? 'Google Gemini ⚡' : prov === 'openai' ? 'OpenAI ChatGPT 🤖' : 'AdvJuris Local 🛡️';
    showToast(`Provedor de IA alterado para: ${provName}`, 'info');
  };

  const handleCopy = (text, idx = null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast('Copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) {
      setGeminiApiKey('');
      showToast('Chave Gemini removida.', 'info');
      return;
    }
    setTestingKey(true);
    const test = await testGeminiApiKey(geminiKeyInput.trim());
    setTestingKey(false);
    if (test.success) {
      setGeminiApiKey(geminiKeyInput.trim());
      showToast(test.message, 'success');
      setShowKeyConfig(false);
    } else {
      showToast(test.message, 'error');
    }
  };

  const handleSaveOpenAiKey = async () => {
    if (!openAiKeyInput.trim()) {
      setOpenAiApiKey('');
      showToast('Chave OpenAI removida.', 'info');
      return;
    }
    setTestingKey(true);
    const test = await testOpenAiApiKey(openAiKeyInput.trim());
    setTestingKey(false);
    if (test.success) {
      setOpenAiApiKey(openAiKeyInput.trim());
      showToast(test.message, 'success');
      setShowKeyConfig(false);
    } else {
      showToast(test.message, 'error');
    }
  };

  const crmContext = {
    clients,
    processes,
    tasks,
    contracts,
    proposals,
    leads,
    appointments,
    attendances,
    officeSettings,
    currentUser
  };

  // Enviar Mensagem no Chatbot
  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : chatQuestion;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = { role: 'user', content: textToSend.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatQuestion('');
    setLoading(true);

    try {
      const response = await consultAdvJuris(textToSend.trim(), newHistory, crmContext);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.text,
          provider: response.provider,
          timestamp: response.timestamp
        }
      ]);
    } catch (err) {
      console.error('Erro na consulta AdvJuris:', err);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Não foi possível processar sua solicitação no momento: ${err.message}. Tente novamente ou use o motor cognitivo local.`,
          provider: 'Erro de Conexão'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Limpar Histórico do Chat
  const handleClearChat = () => {
    setChatHistory([
      {
        role: 'assistant',
        content: `Nova sessão iniciada. Como posso te auxiliar estrategicamente agora, **${currentUser?.name?.split(' ')[0] || 'Doutor(a)'}**?`
      }
    ]);
    showToast('Histórico do chat reiniciado.', 'info');
  };

  // Exportar Conversa
  const handleExportChat = () => {
    const transcript = chatHistory.map(m => `[${m.role === 'user' ? 'COLABORADOR/ADVOGADO' : 'COPILOTO JURÍDICO ADVJURIS'}]:\n${m.content}\n\n`).join('=====================================================\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jurisflow-consultoria-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Conversa jurídica exportada com sucesso!', 'success');
  };

  // Criar Tarefa a partir de resposta do Chat
  const handleCreateTaskFromAiResponse = (content) => {
    const titleMatch = content.match(/Prazo|Petição|Contestação|Audiência|Notificação|Agravo|Desbloqueio|Alvará|Recurso|Manifestação/i);
    const title = titleMatch ? `Providência: ${titleMatch[0]}` : 'Ação Jurídica Recomendada pelo Copiloto';

    const taskPayload = {
      title,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'high',
      status: 'pending',
      description: content.slice(0, 350) + '...'
    };

    if (typeof onAddTask === 'function') {
      onAddTask(taskPayload);
    } else if (typeof addTask === 'function') {
      addTask(taskPayload);
    }

    showToast('Tarefa criada e registrada no CRM com sucesso!', 'success');
  };

  // Usar resposta como Minuta
  const handleUseAsDraft = (content) => {
    setDraftResult(content);
    setActiveTab('minutas');
    showToast('Conteúdo transferido para a aba de Minutas & Peças!', 'info');
  };

  // Criar Prazo Fatal a partir da Publicação Analisada
  const handleCreateTaskFromPub = () => {
    if (!pubResult) return;
    const days = pubResult.days || 15;
    const isPenal = pubResult.type === 'penal';

    const dueDate = new Date();
    let addedDays = 0;
    while (addedDays < days) {
      dueDate.setDate(dueDate.getDate() + 1);
      if (isPenal) {
        addedDays++;
      } else {
        const dayOfWeek = dueDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          addedDays++;
        }
      }
    }

    const taskPayload = {
      title: `Prazo Fatal (${days}d): ${pubResult.action || 'Manifestação nos Autos'} - Proc. ${pubResult.processNumber || 'Judicial'}`,
      dueDate: dueDate.toISOString().split('T')[0],
      priority: 'high',
      status: 'pending',
      description: `Publicação Judicial Analisada:\n${pubResult.text.slice(0, 350)}...`
    };

    if (typeof onAddTask === 'function') {
      onAddTask(taskPayload);
    } else if (typeof addTask === 'function') {
      addTask(taskPayload);
    }

    showToast(`Prazo de ${days} dias registrado no CRM com sucesso! (Limite: ${dueDate.toLocaleDateString('pt-BR')})`, 'success');
  };

  // Analisar Publicação
  const handleAnalyzePublication = async () => {
    if (!pubText.trim()) {
      showToast('Cole o texto da publicação.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeLegalPublication(pubText, crmContext);
      setPubResult(res);
      showToast('Publicação analisada com sucesso!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Gerar Minuta
  const handleGenerateDraft = async () => {
    const client = clients.find(c => String(c.id) === String(draftClientId));
    const payload = {
      clientName: client ? client.name : (draftClientName || 'Cliente Outorgante'),
      cpf: client?.cpf || client?.cnpj || '000.000.000-00',
      address: client?.address || 'Endereço completo',
      phone: client?.phone || client?.whatsapp || 'Telefone do cliente',
      lawyerName: officeSettings.officeName || 'JurisFlow Advocacia',
      subject: draftSubject || 'Inadimplemento contratual / Demanda judicial',
      value: draftValue || '5.000,00'
    };

    setLoading(true);
    try {
      const res = await generateLegalDraft(draftType, payload, crmContext);
      setDraftResult(res.draft);
      showToast('Minuta gerada com sucesso!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Explicador WhatsApp
  const handleExplainClient = async () => {
    if (!explainerInput.trim()) {
      showToast('Cole o despacho ou termo jurídico.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await explainToClient(explainerInput, explainerClient || 'Cliente', crmContext);
      setExplainerResult(res.text);
      showToast('Texto simplificado para o cliente!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Categorias de Atalhos para o Chatbot
  const categoryChips = [
    { id: 'advogado', label: '⚖️ Consultoria Jurídica & Teses', icon: Scale },
    { id: 'briefing', label: '☀️ Briefing & Dados do CRM', icon: Calendar },
    { id: 'prazos', label: '⏱️ Prazos & CPC/CLT', icon: Clock },
    { id: 'trabalhista', label: '💼 Direito Trabalhista', icon: Briefcase },
    { id: 'execucao', label: '🛡️ Penhoras & SISBAJUD', icon: ShieldCheck },
    { id: 'rotinas', label: '🏛️ Rotinas Forenses & PJe', icon: BookOpen },
    { id: 'whatsapp', label: '💬 WhatsApp do Cliente', icon: MessageSquare },
    { id: 'crm', label: '🚀 Gestão do Escritório', icon: Compass },
  ];

  const categoryPrompts = {
    advogado: [
      'Quais são as melhores teses para contestação em cobrança indevida no CDC?',
      'Quais os requisitos para tutela de urgência e evidência no Art. 300 do CPC?',
      'Como funciona a exceção de pré-executividade por prescrição intercorrente?',
      'Diferença entre dano moral in re ipsa e dano moral que exige prova cabal',
      'Como fundamentar pedido de gratuidade da justiça para pessoa física e jurídica?',
    ],
    briefing: [
      'Quais são os prazos fatais e audiências agendadas para esta semana no CRM?',
      'Faça um resumo executivo dos clientes e processos ativos do escritório',
      'Quais são as oportunidades e novos leads que entraram no funil comercial?',
      'Quais tarefas e providências pendentes estão atribuídas a mim hoje?',
    ],
    prazos: [
      'Como calcular o prazo de Agravo de Instrumento e hipóteses do art. 1.015 do CPC?',
      'Qual o prazo de Embargos de Declaração e qual o efeito interruptivo sobre recursos?',
      'Prazos no Juizado Especial Cível são em dias úteis ou corridos (Art. 12-A)?',
      'Qual a regra de contagem de prazo no Processo do Trabalho (Art. 775 CLT)?',
      'Como funciona a suspensão de prazos no recesso forense (Art. 220 CPC)?',
    ],
    trabalhista: [
      'Quais os requisitos para rescisão indireta por falta de FGTS na CLT (Art. 483)?',
      'Como funciona a prescrição bienal e quinquenal trabalhista (Art. 7º, XXIX CF)?',
      'Roteiro de perguntas para audiência de instrução sobre horas extras e jornada',
      'Como contraditar uma testemunha por amizade íntima no processo do trabalho?',
    ],
    execucao: [
      'Como desbloquear penhora de salário ou poupança de até 40 salários no SISBAJUD?',
      'Quais os requisitos para desconsideração da personalidade jurídica no CPC e CC?',
      'Como funciona a pesquisa de patrimônio nos sistemas SNIPER, RENAJUD e INFOJUD?',
      'O que fazer quando a penhora via SISBAJUD (teimosinha) bloqueia valor indevido?',
    ],
    rotinas: [
      'Como funciona o protocolo de petição intermediária no e-SAJ e no PJe?',
      'Qual a diferença entre substabelecimento com reserva e sem reserva de poderes?',
      'Como fazer levantamento de valores por alvará eletrônico (MLE) ou RPV Federal?',
      'O que fazer se o cliente revogar a procuração ou se o advogado renunciar (Art. 112)?',
    ],
    whatsapp: [
      'Redija uma mensagem amigável explicando que o processo teve um despacho de mero expediente',
      'Crie uma mensagem profissional cobrando envio de documentos pendentes pelo WhatsApp',
      'Elabore um lembrete acolhedor para o cliente sobre a audiência agendada',
    ],
    crm: [
      'Como cadastrar um novo cliente e vincular ao processo no JurisFlow CRM?',
      'Como mover oportunidades no funil de vendas Kanban do escritório?',
      'Como gerar e emitir relatório de honorários e parcelas a receber no financeiro?',
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#0f172a] transition-all duration-200 ${
        isFullScreen ? 'h-full w-full max-w-none rounded-none' : 'h-[95vh] w-full max-w-6xl'
      }`}>

        {/* Header Superior com Seletor de Modelo e Ações */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-5 py-3 text-white dark:border-white/[0.08] gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                  Copiloto Jurídico & AdvJuris IA
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 ring-1 ring-amber-400/40">
                  Advogado Sênior • Legal Engineer
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Consultor sênior em tempo real, integrado à base do escritório ({officeSettings.officeName || 'JurisFlow Advocacia'}), CPC, CLT e Tribunais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Provedor de IA */}
            <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700 shadow-inner">
              <button
                onClick={() => handleProviderChange('gemini')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  currentProvider === 'gemini'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google Gemini API (Gemini 2.5 Flash / 2.0 Flash)"
              >
                <span>⚡</span> Gemini
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  currentProvider === 'openai'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="OpenAI ChatGPT (GPT-4o / GPT-4o-mini)"
              >
                <span>🤖</span> ChatGPT
              </button>
              <button
                onClick={() => handleProviderChange('local')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  currentProvider === 'local'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Motor Cognitivo AdvJuris Local (Sem limites / Ilimitado)"
              >
                <span>🛡️</span> Local
              </button>
            </div>

            {/* Configurar Chaves */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 btn-tactile"
              title="Configurar Chaves de API (Gemini / OpenAI)"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Limpar Chat */}
            {activeTab === 'chat' && (
              <button
                onClick={handleClearChat}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-all border border-slate-700 btn-tactile"
                title="Limpar Conversa / Novo Chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Exportar Conversa */}
            {activeTab === 'chat' && (
              <button
                onClick={handleExportChat}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 transition-all border border-slate-700 btn-tactile"
                title="Exportar Conversa (TXT)"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {/* Maximizar Tela */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 btn-tactile"
              title={isFullScreen ? "Restaurar Tamanho" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Fechar Modal */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800/90 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-slate-700 btn-tactile"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Painel de Configuração de Chaves de API */}
        {showKeyConfig && (
          <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-slate-800/70 animate-fade-in">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  Configuração de Chaves de API de Inteligência Artificial
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveKeyTab('gemini')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeKeyTab === 'gemini' ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => setActiveKeyTab('openai')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeKeyTab === 'openai' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  OpenAI (ChatGPT)
                </button>
              </div>
            </div>

            {activeKeyTab === 'gemini' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Cole sua Gemini API Key (ex: AIzaSy...)"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleSaveGeminiKey}
                  disabled={testingKey}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-sm btn-tactile"
                >
                  {testingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Testar & Salvar Gemini
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={openAiKeyInput}
                  onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  placeholder="Cole sua OpenAI API Key (ex: sk-proj-...)"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleSaveOpenAiKey}
                  disabled={testingKey}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-sm btn-tactile"
                >
                  {testingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Testar & Salvar OpenAI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Barra de 5 Abas Estratégicas */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/90 dark:border-white/[0.08] dark:bg-slate-900/60 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            ChatGPT & Consultor Jurídico Sênior
          </button>

          <button
            onClick={() => setActiveTab('publicacoes')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'publicacoes'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Auditor de Intimações & Prazos
          </button>

          <button
            onClick={() => setActiveTab('minutas')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'minutas'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            Gerador de Peças & Minutas
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'whatsapp'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Central WhatsApp do Cliente
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all shrink-0 ${
              activeTab === 'manual'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Manual Prático do Colaborador
          </button>
        </div>

        {/* Corpo Principal das Abas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">

          {/* ========================================================================= */}
          {/* ABA 1: CHATBOT INTELIGENTE & CONSULTOR                                    */}
          {/* ========================================================================= */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 h-full justify-between gap-3">

              {/* Categorias de Atalhos Rápidos */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
                {categoryChips.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                        activeCategory === cat.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Balões de Mensagens do Chat */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[94%] sm:max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-tr-none shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-white/[0.08] shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}

                      {/* Ações da Resposta do Assistente */}
                      {msg.role === 'assistant' && idx > 0 && (
                        <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                            {msg.provider ? `Fonte: ${msg.provider}` : 'AdvJuris Sênior'}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(msg.content, idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-2xs"
                              title="Copiar texto da resposta"
                            >
                              {copiedIdx === idx ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedIdx === idx ? 'Copiado!' : 'Copiar'}</span>
                            </button>

                            <button
                              onClick={() => handleCreateTaskFromAiResponse(msg.content)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 transition-colors shadow-2xs"
                              title="Registrar ação como tarefa agendada no CRM"
                            >
                              <PlusCircle className="h-3 w-3 text-emerald-500" />
                              <span>Criar Tarefa no CRM</span>
                            </button>

                            <button
                              onClick={() => handleUseAsDraft(msg.content)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/30 text-[10px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors shadow-2xs"
                              title="Transferir para a aba de Minutas & Peças"
                            >
                              <FileCheck className="h-3 w-3 text-amber-500" />
                              <span>Usar como Minuta</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 animate-pulse bg-slate-100/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
                    <span>O Copiloto AdvJuris está analisando as normas jurídicas vigentes, precedentes e a base do CRM...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sugestões Dinâmicas da Categoria Selecionada */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
                {(categoryPrompts[activeCategory] || categoryPrompts.advogado).map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 hover:bg-amber-500/10 hover:border-amber-500/40 px-3 py-1 text-[11px] text-slate-600 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-all font-medium"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Barra de Entrada de Mensagem */}
              <div className="flex gap-2 shrink-0 pt-1">
                <textarea
                  rows={2}
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Pergunte qualquer dúvida jurídica, de rotina de escritório, cálculo de prazos ou sobre clientes e processos do CRM... (Pressione Enter para enviar, Shift+Enter para nova linha)"
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 resize-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !chatQuestion.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-md btn-tactile self-end shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: ANÁLISE DE PUBLICAÇÕES & PRAZOS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'publicacoes' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 dark:border-slate-800 dark:bg-slate-900/50">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-500" />
                  Cole o Texto da Publicação Judicial / Intimação do Diário Oficial:
                </label>
                <textarea
                  rows={6}
                  value={pubText}
                  onChange={(e) => setPubText(e.target.value)}
                  placeholder="Ex: 'Fica intimado o patrono do autor para que, no prazo legal de 15 (quinze) dias úteis, manifeste-se sobre a contestação e documentos juntados nos autos do processo nº 1002345-67.2024.8.26.0100...'"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    O Copiloto identificará automaticamente o tipo de ato, ramo da justiça, dias úteis/corridos e riscos.
                  </span>
                  <button
                    onClick={handleAnalyzePublication}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-md btn-tactile shrink-0"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Analisar Publicação & Extrair Prazos
                  </button>
                </div>
              </div>

              {pubResult && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/80 space-y-4 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Parecer Técnico de Auditoria da Intimação
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(pubResult.text)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Análise
                      </button>
                      <button
                        onClick={handleCreateTaskFromPub}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md btn-tactile"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Criar Prazo no CRM
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200">
                    <MarkdownRenderer content={pubResult.text} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: GERADOR DE MINUTAS & PEÇAS                                         */}
          {/* ========================================================================= */}
          {activeTab === 'minutas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Peça / Minuta Blindada:
                  </label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="desbloqueio_sisbajud">🛡️ Desbloqueio SISBAJUD (Impenhorabilidade Salarial / Poupança)</option>
                    <option value="procuracao">📑 Procuração Ad Judicia et Extra (Poderes Especiais)</option>
                    <option value="notificacao">📬 Notificação Extrajudicial Premonitória de Cobrança</option>
                    <option value="contrato">⚖️ Contrato de Honorários Advocatícios (Quota Litis & LGPD)</option>
                    <option value="inicial">🏛️ Petição Inicial (Cobrança / Cumprimento de Obrigação)</option>
                    <option value="contestacao">🛡️ Contestação com Preliminares (Inépcia e Ilegitimidade)</option>
                    <option value="agravo">⚡ Agravo de Instrumento (Art. 1.015 CPC / Efeito Suspensivo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular Cliente Cadastrado no CRM:
                  </label>
                  <select
                    value={draftClientId}
                    onChange={(e) => {
                      setDraftClientId(e.target.value);
                      const c = clients.find(cl => String(cl.id) === String(e.target.value));
                      if (c) setDraftClientName(c.name);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="">Selecione um cliente cadastrado ou preencha abaixo</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (CPF/CNPJ: {c.cpf || c.cnpj || 'N/I'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Objeto / Causa / Especificação:
                  </label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    placeholder="Ex: Bloqueio indevido de conta salário / Cobrança de duplicata"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Envolvido / Honorários (R$):
                  </label>
                  <input
                    type="text"
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    placeholder="Ex: 8.500,00"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-md btn-tactile"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                  Gerar Minuta Profissional
                </button>
              </div>

              {draftResult && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Minuta Blindada Elaborada pelo AdvJuris
                    </span>
                    <button
                      onClick={() => handleCopy(draftResult)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-500 transition-colors shadow-sm"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar Minuta Completa
                    </button>
                  </div>
                  <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {draftResult}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: CENTRAL WHATSAPP DO CLIENTE                                        */}
          {/* ========================================================================= */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Cliente:
                  </label>
                  <input
                    type="text"
                    value={explainerClient}
                    onChange={(e) => setExplainerClient(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Texto do Despacho / Andamento Judicial:
                  </label>
                  <input
                    type="text"
                    value={explainerInput}
                    onChange={(e) => setExplainerInput(e.target.value)}
                    placeholder="Ex: 'Vistos. Especifiquem as partes as provas que pretendem produzir, justificando a pertinência.'"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExplainClient}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-md btn-tactile"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Traduzir para Linguagem Humanizada (WhatsApp)
                </button>
              </div>

              {explainerResult && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Mensagem Pronta para WhatsApp
                    </span>
                    <button
                      onClick={() => handleCopy(explainerResult)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors shadow-sm"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar Mensagem
                    </button>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {explainerResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 5: MANUAL PRÁTICO DO COLABORADOR                                      */}
          {/* ========================================================================= */}
          {activeTab === 'manual' && (
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 p-4 border border-amber-500/20">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  Guia Rápido de Rotinas & Procedimentos para a Equipe
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Respostas instantâneas para as principais dúvidas de secretaria jurídica, cartórios, contagem de prazos e uso do CRM.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <h5 className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                    <Scale className="h-3.5 w-3.5" />
                    Regras de Contagem de Prazos
                  </h5>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                    <li>• **Cível (CPC):** Contagem em **dias úteis** (Art. 219). Exclui o dia do começo e inclui o do vencimento.</li>
                    <li>• **Trabalhista (CLT):** Contagem em **dias úteis** (Art. 775). Recursos em geral têm prazo de 8 dias úteis.</li>
                    <li>• **Penal (CPP):** Contagem em **dias corridos** (Art. 798).</li>
                    <li>• **Juizados Especiais (JEC):** Contagem em **dias úteis** (Lei 9.099/95, Art. 12-A).</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <h5 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    Substabelecimento & Renúncia
                  </h5>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                    <li>• **Com Reserva:** Transfere poderes mas mantém o advogado principal habilitado. Dispensa notificar o cliente.</li>
                    <li>• **Sem Reserva:** Transfere todos os poderes e desliga o advogado anterior. Exige ciência do cliente.</li>
                    <li>• **Renúncia (Art. 112 CPC):** Notificar o cliente por AR e continuar representando por **10 dias**.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <h5 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Alvarás, RPVs e Precatórios
                  </h5>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                    <li>• **Alvará Eletrônico:** Transferência automática para a conta bancária indicada na petição com poderes específicos.</li>
                    <li>• **RPV Federal (TRF/INSS):** Até 60 salários mínimos, pago em até 60 dias após a expedição.</li>
                    <li>• **Precatório:** Valores superiores ao teto de RPV, pago conforme a ordem cronológica orçamentária anual.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <h5 className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Desbloqueio de Penhora (SISBAJUD)
                  </h5>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                    <li>• **Impenhorabilidade:** Salários (Art. 833, IV) e até 40 salários mínimos em conta/poupança (Art. 833, X).</li>
                    <li>• **Prazo de Manifestação:** 5 dias úteis após a intimação do bloqueio (Art. 854, § 3º do CPC).</li>
                    <li>• **Provas:** Juntar os 3 últimos contracheques e extrato da conta comprovando a origem salarial.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
