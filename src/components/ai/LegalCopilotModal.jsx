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
  Briefcase
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

export function LegalCopilotModal({ isOpen, onClose, onAddTask, initialData = null }) {
  const { 
    showToast, 
    clients = [], 
    processes = [], 
    tasks = [], 
    contracts = [], 
    leads = [], 
    officeSettings = {} 
  } = useCRM();

  const [activeTab, setActiveTab] = useState(initialData?.tab || 'chat');
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
    setCurrentProvider(getAiProvider());
    setGeminiKeyInput(getGeminiApiKey());
    setOpenAiKeyInput(getOpenAiApiKey());
  }, [isOpen]);

  const handleProviderChange = (prov) => {
    setCurrentProvider(prov);
    setAiProvider(prov);
    showToast(`Provedor de IA alterado para: ${prov === 'gemini' ? 'Google Gemini ⚡' : prov === 'openai' ? 'OpenAI ChatGPT 🟢' : 'AdvJuris Local 🛡️'}`, 'info');
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
- 🔍 *Consultar processo ou cliente (ex: "Processo do Bruno Alexssander")*
- ⚖️ *Dúvidas sobre artigos, súmulas e teses (CPC, CLT, CPP, CC, CDC)*
- ✍️ *Estruturar ou redigir petições, recursos e notificações*`
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  if (!isOpen) return null;

  const handleCopy = (text) => {
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
      showToast('Chave Google Gemini salva e validada com sucesso!', 'success');
      setShowKeyConfig(false);
    } else {
      showToast(`Falha na validação: ${test.message}`, 'error');
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
      showToast('Chave OpenAI (ChatGPT) salva e validada com sucesso!', 'success');
      setShowKeyConfig(false);
    } else {
      showToast(`Falha na validação: ${test.message}`, 'error');
    }
  };

  // 3. Analisar Publicação
  const handleAnalyzePublication = async () => {
    if (!pubText.trim()) {
      showToast('Cole o texto da publicação.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeLegalPublication(pubText);
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
    if (!pubResult || !onAddTask) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (pubResult.days || 15));

    onAddTask({
      title: `Prazo Fatal: ${pubResult.action || 'Manifestação nos autos'}`,
      processNumber: pubResult.processNumber,
      dueDate: dueDate.toISOString().split('T')[0],
      priority: pubResult.days <= 5 ? 'high' : 'medium',
      legalArea: pubResult.type === 'trabalhista' ? 'Direito do Trabalho' : pubResult.type === 'penal' ? 'Direito Penal' : 'Direito Civil',
      description: pubResult.text
    });
    showToast('Prazo adicionado com sucesso ao painel de Tarefas!', 'success');
    onClose();
  };

  // 5. Gerar Minuta
  const handleGenerateDraft = async () => {
    const client = clients.find(c => String(c.id) === String(draftClientId));
    const payload = {
      clientName: client ? client.name : (draftClientName || 'Cliente Outorgante'),
      cpf: client?.cpf || '000.000.000-00',
      address: client?.address || 'Endereço completo',
      lawyerName: officeSettings.officeName || 'JurisFlow Advocacia Estratégica',
      subject: draftSubject || 'Inadimplemento contratual',
      value: draftValue || '5.000,00'
    };

    setLoading(true);
    try {
      const res = await generateLegalDraft(draftType, payload);
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
      const res = await explainToClient(explainerInput, explainerClient || 'Cliente');
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

    const crmContext = {
      clients,
      processes,
      tasks,
      contracts,
      leads,
      officeSettings
    };

    try {
      const res = await consultAdvJuris(q.trim(), '', '', updatedHistory, crmContext);
      setChatHistory(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Ocorreu um erro ao processar a consulta. Detalhes: ' + err.message }
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
                title="Google Gemini (Gemini 2.0 / 1.5 Flash)"
              >
                <span>⚡</span> Gemini
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  currentProvider === 'openai'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="OpenAI ChatGPT (GPT-4o / GPT-4o-mini)"
              >
                <span>🟢</span> ChatGPT
              </button>
              <button
                onClick={() => handleProviderChange('local')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  currentProvider === 'local'
                    ? 'bg-indigo-500 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="AdvJuris Local (Offline / CRM Native)"
              >
                <span>🛡️</span> AdvJuris
              </button>
            </div>

            {/* Botão de Chaves */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
                (currentProvider === 'gemini' && !getGeminiApiKey()) || (currentProvider === 'openai' && !getOpenAiApiKey())
                  ? 'text-amber-400 ring-1 ring-amber-400/50'
                  : ''
              }`}
              title="Configurar Chaves de API (Gemini / OpenAI)"
            >
              <Key className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Banner de Configuração de Chaves (se aberto) */}
        {showKeyConfig && (
          <div className="border-b border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Configuração de Chaves de API
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveKeyTab('gemini')}
                  className={`px-2 py-0.5 text-xs rounded ${activeKeyTab === 'gemini' ? 'bg-amber-600 text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => setActiveKeyTab('openai')}
                  className={`px-2 py-0.5 text-xs rounded ${activeKeyTab === 'openai' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  OpenAI (ChatGPT)
                </button>
              </div>
            </div>

            {activeKeyTab === 'gemini' ? (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Cole sua chave Google Gemini (AIzaSy...)"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleSaveGeminiKey}
                  disabled={testingKey}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {testingKey ? 'Validando...' : 'Salvar & Testar'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Cole sua chave OpenAI API (sk-...)"
                  value={openAiKeyInput}
                  onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleSaveOpenAiKey}
                  disabled={testingKey}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {testingKey ? 'Validando...' : 'Salvar & Testar'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Consultor Jurídico AdvJuris
            </button>
            <button
              onClick={() => setActiveTab('publication')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'publication'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              Leitor de Intimações & Prazos
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'draft'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Gerador de Minutas & Peças
            </button>
            <button
              onClick={() => setActiveTab('explainer')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === 'explainer'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explicador para o Cliente (WhatsApp)
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: CHAT CONSULTOR */}
          {activeTab === 'chat' && (
            <div className="flex h-[520px] flex-col">
              {/* Sugestões Rápidas */}
              <div className="mb-3 flex flex-wrap gap-1.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Lightbulb className="h-3 w-3 text-amber-500" /> Consultas Rápidas:
                </span>
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sq)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-500/50 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                  >
                    {sq.length > 45 ? sq.substring(0, 45) + '...' : sq}
                  </button>
                ))}
              </div>

              {/* Mensagens do Chat */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
                        <Scale className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium shadow-md'
                          : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">
                        {msg.content}
                      </div>

                      {msg.role === 'assistant' && (
                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            {copied ? 'Copiado!' : 'Copiar Parecer'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                      Analisando legislação, jurisprudência e dados do CRM...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input do Chat */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Pergunte sobre um cliente do CRM (ex: 'Bruno Alexssander'), prazos, artigos do CPC/CLT ou teses..."
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !chatQuestion.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PUBLICAÇÕES */}
          {activeTab === 'publication' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cole o texto do Diário Oficial / DJE / Intimação Judicial:
                </label>
                <textarea
                  rows={6}
                  placeholder="Ex: 'Fica a parte autora intimada para, no prazo de 15 (quinze) dias úteis, manifestar-se acerca da contestação apresentada...'"
                  value={pubText}
                  onChange={(e) => setPubText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyzePublication}
                  disabled={loading || !pubText.trim()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Analisar com IA & Calcular Prazo
                </button>
              </div>

              {pubResult && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-amber-500" /> Parecer de Análise de Publicação
                    </span>
                    <button
                      onClick={() => handleCopy(pubResult.text)}
                      className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 flex items-center gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 mb-4 font-sans leading-relaxed">
                    {pubResult.text}
                  </div>
                  {onAddTask && (
                    <button
                      onClick={handleCreateTaskFromPub}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Criar Tarefa Fatal no CRM (+{pubResult.days} dias)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GERADOR DE MINUTAS */}
          {activeTab === 'draft' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Tipo da Peça:
                  </label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="procuracao">Procuração Ad Judicia</option>
                    <option value="notificacao">Notificação Extrajudicial</option>
                    <option value="inicial_cobranca">Petição Inicial - Cobrança</option>
                    <option value="inicial_indenizacao">Petição Inicial - Danos Morais</option>
                    <option value="contestacao">Contestação Cível</option>
                    <option value="recurso_apelacao">Recurso de Apelação</option>
                    <option value="agravo_instrumento">Agravo de Instrumento</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Vincular Cliente do CRM:
                  </label>
                  <select
                    value={draftClientId}
                    onChange={(e) => {
                      setDraftClientId(e.target.value);
                      const c = clients.find(cl => String(cl.id) === String(e.target.value));
                      if (c) setDraftClientName(c.name);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Digitar Nome Manualmente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.cpf || 'Sem CPF'})</option>
                    ))}
                  </select>
                </div>

                {!draftClientId && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Nome do Cliente:
                    </label>
                    <input
                      type="text"
                      placeholder="Nome completo..."
                      value={draftClientName}
                      onChange={(e) => setDraftClientName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Assunto / Fatos Principais:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Quebra contratual por atraso de entrega de imóvel..."
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Valor da Causa / Débito (R$):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 25.000,00"
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateDraft}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Gerar Peça Completa
                </button>
              </div>

              {draftResult && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80">
                  <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      Minuta Gerada (Pronta para Edição e Protocolo)
                    </span>
                    <button
                      onClick={() => handleCopy(draftResult)}
                      className="text-xs text-slate-500 hover:text-amber-600 dark:text-slate-400 flex items-center gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar Minuta
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 font-serif leading-relaxed max-h-72 overflow-y-auto">
                    {draftResult}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPLICADOR CLIENTE */}
          {activeTab === 'explainer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nome do Cliente:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bruno Alexssander"
                    value={explainerClient}
                    onChange={(e) => setExplainerClient(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Cole a Decisão, Despacho ou Movimentação Complexa:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: 'Vistos. Defiro o pedido de penhora de ativos financeiros via SISBAJUD pelo sistema teimosinha...'"
                  value={explainerInput}
                  onChange={(e) => setExplainerInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExplainClient}
                  disabled={loading || !explainerInput.trim()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Traduzir para WhatsApp
                </button>
              </div>

              {explainerResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                      Mensagem Pronta para o WhatsApp:
                    </span>
                    <button
                      onClick={() => handleCopy(explainerResult)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 flex items-center gap-1 font-medium"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar Mensagem
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                    {explainerResult}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>AdvJuris Legal Engine ativo | Total conformidade com o Estatuto da OAB e LGPD</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Fechar Copiloto
          </button>
        </div>

      </div>
    </div>
  );
}
