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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { DEFAULT_LOGO_BASE64 } from '../../data/defaultLogo';

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

  const [activeTab, setActiveTab] = useState('office'); // 'office' | 'multitenant' | 'areas' | 'sources' | 'system'
  const [firmData, setFirmData] = useState(officeSettings || {});
  const [newAreaName, setNewAreaName] = useState('');
  const [newSourceName, setNewSourceName] = useState('');

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
              <Settings className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              Configurações do Escritório & JurisFlow CRM
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalize a identidade da sua banca jurídica, logotipo, dados cadastrais, ramos de atuação e canais de captação
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL & Storage Ativo</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        {availableTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap btn-tactile ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content: Dados do Escritorio */}
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
                  Nome Fantasia / Marca do CRM
                </label>
                <input
                  type="text"
                  value={firmData.tradeName || ''}
                  onChange={(e) => setFirmData({ ...firmData, tradeName: e.target.value })}
                  placeholder="Ex: JurisFlow CRM"
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
                  Registro da Sociedade na OAB
                </label>
                <input
                  type="text"
                  value={firmData.oabSociety || ''}
                  onChange={(e) => setFirmData({ ...firmData, oabSociety: e.target.value })}
                  placeholder="Ex: OAB/SP 18.940"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Oficial Institucional
                </label>
                <input
                  type="email"
                  value={firmData.email || ''}
                  onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  placeholder="contato@jurisflow.adv.br"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp Principal
                </label>
                <input
                  type="text"
                  value={firmData.phone || ''}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endereço Completo da Sede
                </label>
                <input
                  type="text"
                  value={firmData.address || ''}
                  onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                  placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo/SP"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Secao Especial de Logotipo e Imagens */}
              <div className="md:col-span-2 p-5 rounded-3xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-gold-500" /> Logotipo Oficial da Banca / JurisFlow
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Esta imagem é exibida na Barra Lateral (com o nome JurisFlow), Tela de Login, Cabeçalhos e Minutas de Contratos geradas em PDF.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                    PNG, JPG, SVG ou Base64
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Visual Preview Box */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                    <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2 mb-2 overflow-hidden shadow-inner">
                      {firmData.logoUrl ? (
                        <img
                          src={firmData.logoUrl}
                          alt="Logo Preview"
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.target.src = DEFAULT_LOGO_BASE64;
                          }}
                        />
                      ) : (
                        <img
                          src={DEFAULT_LOGO_BASE64}
                          alt="Logo Padrão"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-full">
                      {firmData.officeName || 'JurisFlow Advocacia'}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                      Pré-visualização do Logotipo
                    </div>
                  </div>

                  {/* Controls & Inputs */}
                  <div className="lg:col-span-8 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                        Carregar Logotipo do Dispositivo (Arquivos & Imagens)
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Selecione uma imagem do seu computador ou celular (PNG, JPG, SVG ou WEBP).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Upload Direto do Computador (Converte para Base64 Data URL) */}
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-500/20 transition-all btn-tactile">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Escolher Imagem do Computador</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64Data = ev.target?.result;
                                if (base64Data) {
                                  setFirmData(prev => ({ ...prev, logoUrl: String(base64Data) }));
                                  showToast('Foto do computador carregada com sucesso!');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* Restaurar Logo Oficial Padrao */}
                      <button
                        type="button"
                        onClick={() => {
                          setFirmData(prev => ({ ...prev, logoUrl: DEFAULT_LOGO_BASE64 }));
                          showToast('Logotipo padrão oficial JurisFlow restaurado!');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-semibold transition-all btn-tactile"
                      >
                        <RefreshCw className="h-3.5 w-3.5 text-gold-500" />
                        <span>Restaurar Logo Padrão JurisFlow</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all btn-tactile"
              >
                <Save className="h-4 w-4" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content: Multi-Escritorios (Exclusivo Dev/TI) */}
      {activeTab === 'multitenant' && isDevUser && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gerenciador de Multi-Escritórios (Tenants)</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Acesso Exclusivo Dev/TI
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie matriz e filiais da banca jurídica com isolamento seguro de dados
                </p>
              </div>

              <button
                onClick={() => setNewEscritorioOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 btn-tactile self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Criar Nova Filial
              </button>
            </div>

            {/* Grid de Escritorios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {escritorios.map(esc => {
                const isActive = esc.id === currentEscritorioId;
                const isPrincipal = esc.id === 'escritorio_principal';

                return (
                  <div
                    key={esc.id}
                    className={`rounded-2xl border p-5 transition-all relative ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/10 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{esc.nome}</span>
                          {isPrincipal && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-gold-500/20 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                              Matriz de Origem
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{esc.cidade ? esc.cidade + ' - ' + esc.estado : 'Sede Principal'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">ID: {esc.id}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isActive ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ativo
                          </span>
                        ) : (
                          <button
                            onClick={() => switchEscritorio(esc.id)}
                            className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 transition-all"
                          >
                            Alternar
                          </button>
                        )}

                        {/* Botao de Exclusao (Apenas para filiais secundarias) */}
                        {!isPrincipal && escritorios.length > 1 && (
                          <button
                            onClick={() => setEscritorioToDelete(esc)}
                            title="Excluir filial"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Areas Juridicas */}
      {activeTab === 'areas' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ramos de Atuação Jurídica</h3>
                <p className="text-xs text-slate-500">Configure as áreas do direito atendidas pela sua banca</p>
              </div>
            </div>

            <form onSubmit={handleAddArea} className="flex gap-2">
              <input
                type="text"
                required
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="Ex: Direito Imobiliário, Agronegócio..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all btn-tactile"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {legalAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: area.color || '#0c8de3' }} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{area.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLegalArea(area.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Origens de Leads */}
      {activeTab === 'sources' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Canais de Captação de Clientes</h3>
                <p className="text-xs text-slate-500">Mapeie de onde surgem as oportunidades comerciais do escritório</p>
              </div>
            </div>

            <form onSubmit={handleAddSource} className="flex gap-2">
              <input
                type="text"
                required
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Ex: Tráfego Pago Google Ads, Parcerias..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all btn-tactile"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {leadSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color || '#10b981' }} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{source.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLeadSource(source.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Dados & Sistema */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Diagnóstico e Gestão de Base de Dados</h3>
            <p className="text-xs text-slate-500">
              O JurisFlow opera com sincronização híbrida inteligente (PostgreSQL Supabase e Cache de Alta Velocidade).
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Restaurar Base Limpa Original</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Esta ação redefine todos os dados locais e remotos para a base limpa padrão da JurisFlow.
                </p>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-all btn-tactile"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar Base Limpa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restaurar Base de Dados?"
        message="Tem certeza que deseja restaurar a base para os dados limpos padrão da JurisFlow? Esta ação sincronizará a base zerada no Supabase e localStorage."
        confirmText="Sim, Restaurar"
        type="danger"
      />

      {/* Confirmation Modal: Delete Escritorio */}
      <ConfirmModal
        isOpen={Boolean(escritorioToDelete)}
        onClose={() => setEscritorioToDelete(null)}
        onConfirm={() => handleDeleteEscritorio(escritorioToDelete?.id)}
        title="Excluir Filial?"
        message={'Tem certeza que deseja remover a filial "' + (escritorioToDelete?.nome || '') + '"? Apenas o escritório matriz permanecerá.'}
        confirmText="Sim, Excluir"
        type="danger"
      />

      {/* Modal: Novo Escritorio */}
      {newEscritorioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-600" />
                Criar Nova Filial / Escritório
              </h3>
              <button
                onClick={() => setNewEscritorioOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewEscritorio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Filial *
                </label>
                <input
                  type="text"
                  required
                  value={newEscritorioNome}
                  onChange={(e) => setNewEscritorioNome(e.target.value)}
                  placeholder="Ex: JurisFlow Filial Rio de Janeiro"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ da Filial (Opcional)
                </label>
                <input
                  type="text"
                  value={newEscritorioCnpj}
                  onChange={(e) => setNewEscritorioCnpj(e.target.value)}
                  placeholder="00.000.000/0002-00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEscritorioOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-sm"
                >
                  Criar Filial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
