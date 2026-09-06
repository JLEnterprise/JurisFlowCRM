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
  Settings
} from 'lucide-react';
import {
  analyzeLegalPublication,
  generateLegalDraft,
  explainToClient,
  consultAdvJuris,
  analyzeContractWithAdvJuris,
  generateContractWithAdvJuris,
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

export function LegalCopilotModal({ isOpen, onClose, onAddTask, initialData = null, initialTab = null }) {
  const { 
    showToast, 
    addTask,
    clients = [], 
    processes = [], 
    tasks = [], 
    contracts = [], 
    leads = [], 
    officeSettings = {} 
  } = useCRM();

  const normalizeTab = (t) => {
    if (!t) return 'chat';
    if (t === 'intimacoes' || t === 'publicacao' || t === 'publicacoes' || t === 'prazos') return 'publicacoes';
    if (t === 'minuta' || t === 'minutas' || t === 'pecas' || t === 'peticoes') return 'minutas';
    if (t === 'whatsapp' || t === 'cliente') return 'whatsapp';
    return 'chat';
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab || initialData?.tab));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  // Multi-Provider state
  const [currentProvider, setCurrentProvider] = useState('gemini'); // 'gemini' | 'openai' | 'local'
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [openAiKeyInput, setOpenAiKeyInput] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [activeKeyTab, setActiveKeyTab] = useState('gemini'); // 'gemini' | 'openai'
  const [testingKey, setTestingKey] = useState(false);

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

  const handleProviderChange = (prov) => {
    setCurrentProvider(prov);
    setAiProvider(prov);
    const provName = prov === 'gemini' ? 'Google Gemini ⚡' : prov === 'openai' ? 'OpenAI ChatGPT 🤖' : 'AdvJuris Local 🛡️';
    showToast(`Provedor de IA alterado para: ${provName}`, 'info');
  };

  // Tab 1: Publicações
  const [pubText, setPubText] = useState(initialData?.publicationText || '');
  const [pubResult, setPubResult] = useState(null);

  // Tab 2: Minutas
  const [draftType, setDraftType] = useState('procuracao');
  const [draftClientId, setDraftClientId] = useState('');
  const [draftClientName, setDraftClientName] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftValue, setDraftValue] = useState('');
  const [draftResult, setDraftResult] = useState(null);

  // Tab 3: Explicador Cliente
  const [explainerInput, setExplainerInput] = useState('');
  const [explainerClient, setExplainerClient] = useState('');
  const [explainerResult, setExplainerResult] = useState('');

  // Tab 4: Chat Consultor
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: `Olá, Doutor(a)! Sou o **Agente Jurídico Sênior (AdvJuris)** do JurisFlow.

Tenho acesso em tempo real à base de dados do seu escritório (clientes, processos cadastrados, prazos e contratos).

Como posso auxiliá-lo(a) agora?
- 📋 *Consultar processo ou cliente (ex: "Processo do Bruno Alexssander")*
- ⏱️ *Calcular prazos de publicações e intimações (CPC/CLT)*
- ⚖️ *Dúvidas sobre artigos, súmulas e teses (CPC, CLT, CPP, CC, CDC)*
- 📑 *Auditar contratos e redigir petições, procurações ou notificações*`
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Testar e Salvar Chave Gemini
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

  // 2. Testar e Salvar Chave OpenAI
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
    leads,
    officeSettings
  };

  // 3. Analisar Publicação
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

  // 4. Criar Tarefa a partir da Publicação
  const handleCreateTaskFromPub = () => {
    if (!pubResult) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (pubResult.days || 15));

    const taskPayload = {
      title: `Prazo Fatal: ${pubResult.action || 'Manifestação nos autos'}`,
      processNumber: pubResult.processNumber,
      dueDate: dueDate.toISOString().split('T')[0],
      priority: pubResult.days <= 5 ? 'alta' : 'media',
      status: 'pending',
      legalArea: pubResult.type === 'trabalhista' ? 'Direito do Trabalho' : pubResult.type === 'penal' ? 'Direito Penal' : 'Direito Civil',
      description: pubResult.text
    };

    if (typeof onAddTask === 'function') {
      onAddTask(taskPayload);
    } else if (typeof addTask === 'function') {
      addTask(taskPayload);
    }

    showToast('Prazo vinculado ao CRM e salvo com sucesso!', 'success');
    onClose();
  };

  // 5. Gerar Minuta
  const handleGenerateDraft = async () => {
    const client = clients.find(c => String(c.id) === String(draftClientId));
    const payload = {
      clientName: client ? client.name : (draftClientName || 'Cliente Outorgante'),
      cpf: client?.cpf || '000.000.000-00',
      address: client?.address || 'Endereço completo',
      lawyerName: officeSettings.officeName || 'JurisFlow Advocacia',
      subject: draftSubject || 'Inadimplemento contratual',
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

  // 6. Traduzir para o Cliente
  const handleExplainClient = async () => {
    if (!explainerInput.trim()) {
      showToast('Informe o despacho ou termo jurídico.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await explainToClient(explainerInput, explainerClient || 'Cliente', crmContext);
      setExplainerResult(res.text);
      showToast('Mensagem traduzida com sucesso!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 7. Chat Consultivo com Histórico e Contexto Total do CRM
  const handleSendMessage = async (queryText = null) => {
    const q = queryText || chatQuestion;
    if (!q || !q.trim()) return;

    setChatQuestion('');
    const updatedHistory = [...chatHistory, { role: 'user', content: q.trim() }];
    setChatHistory(updatedHistory);
    setLoading(true);

    try {
      const res = await consultAdvJuris(q.trim(), updatedHistory, crmContext);
      const answerContent = res.text || res.answer || 'Resposta gerada com sucesso.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: answerContent }]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Ocorreu um erro ao processar a consulta: ' + err.message }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Qual o prazo de Agravo de Instrumento e hipóteses do art. 1.015 do CPC?',
    'Como desbloquear penhora de salário ou poupança no SISBAJUD?',
    'Quais os requisitos para Rescisão Indireta por falta de FGTS na CLT?',
    'Como funciona a Usucapião Extraordinária e os prazos de posse?',
    'Quais as regras de honorários Quota Litis no Código de Ética da OAB?',
    'O que fazer quando o juiz indefere o pedido de gratuidade da justiça?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-4 text-white dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">Copiloto Jurídico & AdvJuris IA</h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                  Senior Legal Agent
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Prazos CPC/CLT, Precedentes STF/STJ, Minutas e Gestão Integrada ao CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor de Provedor */}
            <div className="flex items-center rounded-lg bg-slate-800/80 p-1 border border-slate-700">
              <button
                onClick={() => handleProviderChange('gemini')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  currentProvider === 'gemini'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Google Gemini (Gemini 2.5 / 2.0 / 1.5 Flash)"
              >
                <span>⚡</span> Gemini
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  currentProvider === 'openai'
                    ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="OpenAI ChatGPT (GPT-4o / GPT-4o-mini)"
              >
                <span>🤖</span> OpenAI
              </button>
              <button
                onClick={() => handleProviderChange('local')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  currentProvider === 'local'
                    ? 'bg-indigo-500 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Motor Cognitivo AdvJuris Local"
              >
                <span>🛡️</span> Local
              </button>
            </div>

            {/* Botão Config de Chaves */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
              title="Configurar Chaves de API (Gemini / OpenAI)"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal de Configuração de Chaves de API */}
        {showKeyConfig && (
          <div className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Configuração de Chaves de API de Inteligência Artificial
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveKeyTab('gemini')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    activeKeyTab === 'gemini' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => setActiveKeyTab('openai')}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    activeKeyTab === 'openai' ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleSaveGeminiKey}
                  disabled={testingKey}
                  className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-sm"
                >
                  {testingKey ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
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
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleSaveOpenAiKey}
                  disabled={testingKey}
                  className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm"
                >
                  {testingKey ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Testar & Salvar OpenAI
                </button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              * Suas chaves são armazenadas localmente no seu navegador com segurança e nunca são compartilhadas. Se preferir não usar chave, o motor cognitivo local AdvJuris responderá automaticamente.
            </p>
          </div>
        )}

        {/* Navegação de Abas */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 dark:border-slate-800 dark:bg-slate-800/40">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Estratégico & Dossiê
          </button>

          <button
            onClick={() => setActiveTab('publicacoes')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === 'publicacoes'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Análise de Publicações & Prazos
          </button>

          <button
            onClick={() => setActiveTab('minutas')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === 'minutas'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Gerador de Peças & Minutas
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
              activeTab === 'whatsapp'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Explicador WhatsApp
          </button>
        </div>

        {/* Corpo Principal das Abas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ABA 1: CHAT CONSULTIVO */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[52vh] justify-between gap-4">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                      {msg.role === 'assistant' && idx > 0 && (
                        <div className="mt-2 flex justify-end border-t border-slate-200/50 pt-2 dark:border-slate-700/50">
                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-500 dark:text-slate-400"
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            Copiar Parecer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                    <span>AdvJuris está analisando os autos e fundamentando a tese...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Sugestões Rápidas */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {suggestedQuestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-all"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Input do Chat */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Pergunte ao AdvJuris (ex: 'Quais os processos do cliente Bruno?' ou 'Elabore tese de usucapião')..."
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !chatQuestion.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-md"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: ANÁLISE DE PUBLICAÇÕES */}
          {activeTab === 'publicacoes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cole o Texto da Publicação Judicial / Intimação:
                </label>
                <textarea
                  rows={5}
                  value={pubText}
                  onChange={(e) => setPubText(e.target.value)}
                  placeholder="Ex: 'Fica intimado o patrono do autor para que, no prazo legal de 15 (quinze) dias, manifeste-se sobre a contestação e documentos juntados...'"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyzePublication}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Analisar Publicação & Extrair Prazos
                </button>
              </div>

              {pubResult && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Resultado da Análise Jurídica
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(pubResult.text)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-500 dark:text-slate-300"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </button>
                      <button
                        onClick={handleCreateTaskFromPub}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-sm"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Criar Prazo no CRM
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {pubResult.text}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: GERADOR DE MINUTAS */}
          {activeTab === 'minutas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Peça / Minuta:
                  </label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="procuracao">Procuração Ad Judicia et Extra</option>
                    <option value="notificacao">Notificação Extrajudicial</option>
                    <option value="contrato">Contrato de Honorários Advocatícios</option>
                    <option value="inicial">Petição Inicial (Ação de Cobrança / Obrigação)</option>
                    <option value="contestacao">Contestação com Preliminares</option>
                    <option value="agravo">Agravo de Instrumento (Art. 1.015 CPC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular Cliente do CRM:
                  </label>
                  <select
                    value={draftClientId}
                    onChange={(e) => {
                      setDraftClientId(e.target.value);
                      const c = clients.find(cl => String(cl.id) === String(e.target.value));
                      if (c) setDraftClientName(c.name);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Selecione um cliente cadastrado ou digite avulso</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (CPF: {c.cpf || 'N/I'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Objeto / Causa / Resumo:
                  </label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    placeholder="Ex: Cobrança de duplicata mercantil / Prestação de serviços"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor da Causa / Honorários (R$):
                  </label>
                  <input
                    type="text"
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    placeholder="Ex: 15.000,00"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                  Gerar Minuta Profissional
                </button>
              </div>

              {draftResult && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Minuta Redigida pelo AdvJuris
                    </span>
                    <button
                      onClick={() => handleCopy(draftResult)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-amber-500 dark:text-slate-300 font-medium"
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

          {/* ABA 4: EXPLICADOR WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Traduzir para Linguagem Simples (WhatsApp)
                </button>
              </div>

              {explainerResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2 dark:border-emerald-800/50">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Mensagem Pronta para Envio
                    </span>
                    <button
                      onClick={() => handleCopy(explainerResult)}
                      className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 font-medium"
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
        </div>
      </div>
    </div>
  );
}
