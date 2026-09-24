import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Scale,
  Share2,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  Layers,
  Database,
  ExternalLink,
  Users,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Sparkles,
  Key,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { DEFAULT_LOGO_BASE64 } from '../../data/defaultLogo';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey } from '../../services/aiService';

export function SettingsView() {
  const {
    escritorios,
    currentEscritorioId,
    currentEscritorio,
    switchEscritorio,
    addEscritorio,
    updateEscritorio,
    deleteEscritorio,
    officeSettings,
    updateOfficeSettings,
    legalAreas,
    addLegalArea,
    removeLegalArea,
    leadSources,
    addLeadSource,
    removeLeadSource,
    resetAllData,
    showToast,
    logActivity,
    supabaseConnected,
  } = useCRM();
  const { permissions, currentUser } = useAuth();

  const isDevUser = currentUser?.role === 'dev';

  const [activeTab, setActiveTab] = useState('office'); // 'office' | 'ai' | 'multitenant' | 'areas' | 'sources' | 'system'
  const [firmData, setFirmData] = useState(officeSettings || {});
  const [newAreaName, setNewAreaName] = useState('');
  const [newSourceName, setNewSourceName] = useState('');

  // Gemini API Key state
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState(null);

  useEffect(() => {
    setGeminiKeyInput(getGeminiApiKey());
  }, []);

  // Sincronizar firmData quando officeSettings for atualizado ou carregado
  useEffect(() => {
    if (officeSettings) {
      setFirmData(officeSettings);
    }
  }, [officeSettings]);

  // Se o usuario nao for Dev e tentar entrar na aba multitenant, redireciona para office
  useEffect(() => {
    if (activeTab === 'multitenant' && !isDevUser) {
      setActiveTab('office');
    }
  }, [activeTab, isDevUser]);

  // Modal para criar novo escritorio
  const [newEscritorioOpen, setNewEscritorioOpen] = useState(false);
  const [newEscritorioNome, setNewEscritorioNome] = useState('');
  const [newEscritorioCnpj, setNewEscritorioCnpj] = useState('');
  const [newEscritorioPlano, setNewEscritorioPlano] = useState('enterprise');

  // Confirmation modal state for reset & delete
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [escritorioToDelete, setEscritorioToDelete] = useState(null);

  const handleSaveFirm = (e) => {
    e.preventDefault();
    updateOfficeSettings(firmData);
    if (logActivity) {
      logActivity('Configurações do Escritório', 'Geral', 'Dados cadastrais e institucionais atualizados.');
    }
    showToast('Configurações do escritório salvas com sucesso!');
  };

  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    setKeyTesting(true);
    setKeyStatus(null);

    if (!geminiKeyInput.trim()) {
      setGeminiApiKey('');
      setKeyStatus({ success: true, message: 'Chave removida. Usando motor contextual local AdvJuris.' });
      showToast('Chave removida.', 'info');
      setKeyTesting(false);
      return;
    }

    const test = await testGeminiApiKey(geminiKeyInput.trim());
    setKeyTesting(false);
    setKeyStatus(test);

    if (test.success) {
      setGeminiApiKey(geminiKeyInput.trim());
      showToast('Chave Google Gemini salva e validada com sucesso!', 'success');
    } else {
      showToast(test.message || 'Erro ao validar chave Gemini.', 'error');
    }
  };

  const handleCreateNewEscritorio = (e) => {
    e.preventDefault();
    if (!newEscritorioNome.trim()) return;
    const created = addEscritorio({
      nome: newEscritorioNome.trim(),
      cnpj: newEscritorioCnpj.trim(),
      plano: newEscritorioPlano,
    });
    setNewEscritorioNome('');
    setNewEscritorioCnpj('');
    setNewEscritorioOpen(false);
    switchEscritorio(created.id);
  };

  const handleDeleteEscritorio = (escId) => {
    if (escId === 'escritorio_principal' || escritorios.length <= 1) {
      showToast('O escritório matriz de origem não pode ser excluído.', 'warning');
      return;
    }
    deleteEscritorio(escId);
    showToast('Escritório removido com sucesso!');
    setEscritorioToDelete(null);
  };

  const handleAddArea = (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    addLegalArea({ name: newAreaName.trim(), color: '#0c8de3', icon: 'Scale' });
    if (logActivity) {
      logActivity('Nova Área Jurídica', newAreaName.trim(), 'Ramo do direito adicionado.');
    }
    showToast('Área jurídica "' + newAreaName.trim() + '" adicionada!');
    setNewAreaName('');
  };

  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    addLeadSource({ name: newSourceName.trim(), color: '#10b981', icon: 'Share2' });
    if (logActivity) {
      logActivity('Novo Canal de Captação', newSourceName.trim(), 'Origem de lead adicionada.');
    }
    showToast('Canal de captação "' + newSourceName.trim() + '" adicionado!');
    setNewSourceName('');
  };

  const handleConfirmReset = () => {
    resetAllData();
    if (logActivity) {
      logActivity('Restauração de Dados', 'Seed Original', 'Base limpa inicial restaurada.');
    }
    showToast('Base de dados restaurada com sucesso!');
    setResetConfirmOpen(false);
  };

  // Lista de abas com controle estrito de RBAC
  const availableTabs = [
    { id: 'office', label: 'Dados do Escritório', icon: Building2 },
    { id: 'ai', label: 'IA & AdvJuris (Gemini API)', icon: Sparkles },
    ...(isDevUser ? [{ id: 'multitenant', label: 'Multi-Escritórios (Exclusivo Dev/TI)', icon: Layers }] : []),
    { id: 'areas', label: 'Áreas Jurídicas', icon: Scale },
    { id: 'sources', label: 'Origens de Leads', icon: Share2 },
    { id: 'system', label: 'Dados & Sistema', icon: RotateCcw },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl">
      {/* Header */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-500" />
              Configurações Gerais & Parâmetros do Sistema
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gerencie a identidade visual da sua banca, inteligência artificial, canais de captação e regras institucionais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              JurisFlow v1.0.0
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DADOS DO ESCRITORIO */}
      {activeTab === 'office' && (
        <form onSubmit={handleSaveFirm} className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Identificação da Sociedade de Advogados</h3>
                <p className="text-xs text-slate-500">Dados utilizados nos cabeçalhos de contratos, relatórios, propostas e minutas geradas</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Escritório: {firmData.officeName || currentEscritorio?.nome || 'JurisFlow Advocacia'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Escritório / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={firmData.officeName || ''}
                  onChange={(e) => setFirmData({ ...firmData, officeName: e.target.value, name: e.target.value })}
                  placeholder="Ex: JurisFlow Advocacia Estratégica"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia / Marca
                </label>
                <input
                  type="text"
                  value={firmData.tradeName || ''}
                  onChange={(e) => setFirmData({ ...firmData, tradeName: e.target.value })}
                  placeholder="Ex: JurisFlow Law"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ da Sociedade
                </label>
                <input
                  type="text"
                  value={firmData.cnpj || ''}
                  onChange={(e) => setFirmData({ ...firmData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registro OAB / Seccional
                </label>
                <input
                  type="text"
                  value={firmData.oabRegistry || ''}
                  onChange={(e) => setFirmData({ ...firmData, oabRegistry: e.target.value })}
                  placeholder="Ex: OAB/SP nº 123.456"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Institucional de Contato
                </label>
                <input
                  type="email"
                  value={firmData.email || ''}
                  onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  placeholder="contato@escritorio.adv.br"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  value={firmData.phone || ''}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço da Sede do Escritório (Comarca)
                </label>
                <input
                  type="text"
                  value={firmData.address || ''}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  placeholder="Av. Paulista, 1000, Cj. 120 - Bela Vista, São Paulo/SP"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
              >
                <Save className="w-4 h-4" />
                Salvar Dados do Escritório
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: IA & ADVJURIS (GEMINI API) */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveGeminiKey} className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Inteligência Artificial Jurídica — ADVJURIS & Google Gemini API
                </h3>
                <p className="text-xs text-slate-500">
                  Configure a chave de API para habilitar os modelos de linguagem Google GenAI ou use o motor local especializado
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                AdvJuris 52 Regras
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-950">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Google Gemini API Key (Opcional para Modo Turbo em Nuvem):
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Obtenha gratuitamente no Google AI Studio (<a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">aistudio.google.com</a>). Se deixado em branco, o CRM utilizará o motor de raciocínio jurídico local com precisão 100% offline.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={keyTesting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
                  >
                    {keyTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar & Testar Conexão
                  </button>
                </div>

                {keyStatus && (
                  <div className={`mt-3 rounded-xl p-3 text-xs flex items-center gap-2 ${keyStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300'}`}>
                    {keyStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-rose-600" />}
                    {keyStatus.message}
                  </div>
                )}
              </div>

              {/* Informações dos Módulos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-900">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Auditoria Contratual</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    Regra 46 (As 10 Perguntas de Ouro) e Matriz de Riscos (Regra 32).
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-900">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Cálculo de Prazos</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    Contagem estrita em dias úteis do Art. 219 do CPC e CLT.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-900">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Anti-Alucinação</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    Zero invenção de artigos de lei, números de processo ou precedentes falsos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: MULTITENANT (DEV/TI) */}
      {activeTab === 'multitenant' && isDevUser && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Escritórios Cadastrados no Ecossistema</h3>
                <p className="text-xs text-slate-500">Gestão de instâncias multi-tenant isoladas com políticas de segurança</p>
              </div>
              <button
                onClick={() => setNewEscritorioOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Escritório
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {escritorios.map((esc) => (
                <div
                  key={esc.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    currentEscritorioId === esc.id
                      ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{esc.nome}</h4>
                    {currentEscritorioId === esc.id ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500 text-white">Ativo</span>
                    ) : (
                      <button
                        onClick={() => switchEscritorio(esc.id)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        Alternar
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">CNPJ: {esc.cnpj || 'Não informado'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AREAS JURIDICAS */}
      {activeTab === 'areas' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Áreas de Atuação Jurídica</h3>
                <p className="text-xs text-slate-500">Ramos do direito disponíveis para categorizar clientes, processos e honorários</p>
              </div>
            </div>

            <form onSubmit={handleAddArea} className="flex gap-2">
              <input
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Nome da nova área (ex: Direito Médico, Ambiental)..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Área
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {legalAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 p-3"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{area.name}</span>
                  <button
                    onClick={() => removeLegalArea(area.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ORIGENS DE LEADS */}
      {activeTab === 'sources' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Canais de Captação & Origens de Leads</h3>
                <p className="text-xs text-slate-500">Mapeamento de onde vêm os novos clientes (Google Ads, Indicação, Instagram, etc.)</p>
              </div>
            </div>

            <form onSubmit={handleAddSource} className="flex gap-2">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Nome da origem (ex: TikTok, Palestra, Podcast)..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Canal
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {leadSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 p-3"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{source.name}</span>
                  <button
                    onClick={() => removeLeadSource(source.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SISTEMA & DADOS */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manutenção da Base & Restauração</h3>
                <p className="text-xs text-slate-500">Ferramentas de diagnóstico, integridade e limpeza do banco de dados</p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">Restaurar Dados Originais de Demonstração</h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Restaura os clientes, contratos e tarefas de exemplo da base original limpa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {resetConfirmOpen && (
        <ConfirmModal
          isOpen={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          onConfirm={handleConfirmReset}
          title="Restaurar Banco de Dados"
          message="Tem certeza que deseja restaurar a base de demonstração? Dados criados localmente serão reiniciados."
          confirmText="Restaurar"
          isDanger
        />
      )}
    </div>
  );
}
