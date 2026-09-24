import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  FolderLock,
  DollarSign,
  Clock,
  Plus,
  Edit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  ExternalLink,
  Trash2,
  Printer,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatCurrency,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatDate,
  formatRelativeTime,
  formatCNJProcessNumber,
} from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { Avatar } from '../common/Avatar';
import { pdfService } from '../../services/pdfService';

export function ClientDetail({
  clientId,
  client: propClient,
  onBack,
  onEditClient,
  onOpenNewContract,
  onOpenNewProcess,
  onOpenNewAttendance,
  onOpenNewTask,
  onOpenNewProposal,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    clients,
    deleteClient,
    contracts,
    processes,
    documents,
    deleteDocument,
    attendances,
    installments,
    tasks,
    officeSettings,
    markInstallmentPaid,
    legalAreas,
    showToast,
    logActivity,
  } = useCRM();
  const { users } = useAuth();

  // Delete Modals
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const client = propClient || clients.find(c => c.id === clientId);

  if (!client) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-500">Cliente não encontrado ou excluído.</p>
        <button
          onClick={onBack}
          className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
        >
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Filtrar entidades vinculadas ao cliente
  const clientContracts = contracts.filter(c => c.clientId === client.id);
  const clientProcesses = processes.filter(p => p.clientId === client.id);
  const clientDocuments = documents.filter(d => d.clientId === client.id || d.clientName === client.name);
  const clientAttendances = attendances.filter(a => a.clientId === client.id || a.clientName === client.name);
  const clientInstallments = installments.filter(i => i.clientId === client.id || i.clientName === client.name);
  const clientTasks = tasks.filter(t => t.clientId === client.id);

  const responsibleLawyer = users.find(u => u.id === client.responsibleLawyerId);
  const areaObj = legalAreas.find(a => a.id === client.legalArea);

  const totalContracted = clientContracts.reduce((acc, c) => acc + (Number(c.value) || 0), client.totalContracted || 0);
  const totalPaid = clientInstallments.filter(i => i.status === 'paid').reduce((acc, i) => acc + (Number(i.amount) || 0), client.totalPaid || 0);
  const totalPending = Math.max(0, totalContracted - totalPaid);

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'personal', label: 'Dados Pessoais', icon: ShieldCheck },
    { id: 'attendance', label: 'Atendimentos & Contatos', icon: MessageCircle, count: clientAttendances.length },
    { id: 'timeline', label: 'Histórico / Linha do Tempo', icon: Clock },
    { id: 'contracts', label: 'Contratos', icon: FileText, count: clientContracts.length },
    { id: 'processes', label: 'Processos', icon: Briefcase, count: clientProcesses.length },
    { id: 'documents', label: 'Documentos', icon: FolderLock, count: clientDocuments.length },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, count: clientInstallments.length },
  ];

  const handleConfirmDeleteClient = () => {
    const clientId = client.id;
    const clientName = client.name;
    setDeleteClientModalOpen(false);
    deleteClient(clientId);
    logActivity('Exclusão de Cliente', clientName, 'Cliente e registros vinculados foram excluídos da base.');
    showToast(`Cliente "${clientName}" excluído com sucesso!`);
    onBack();
  };

  const handleConfirmDeleteDoc = () => {
    if (docToDelete) {
      const docId = docToDelete.id;
      const docTitle = docToDelete.title;
      setDeleteDocModalOpen(false);
      setDocToDelete(null);
      deleteDocument(docId);
      logActivity('Exclusão de Documento', docTitle, `Documento do cliente ${client.name} excluído.`);
      showToast('Documento excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back button & Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para Lista de Clientes
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditClient(client)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Edit className="h-3.5 w-3.5" /> Editar Cadastro
          </button>
          <button
            onClick={() => onOpenNewAttendance({ clientId: client.id, clientName: client.name })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar Atendimento
          </button>
          <button
            onClick={() => setDeleteClientModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            title="Excluir cliente"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Customer 360 Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Main Info */}
          <div className="flex items-start gap-4">
            <Avatar
              src={client.avatar}
              name={client.name}
              size="xl"
              className="rounded-2xl ring-2 ring-brand-500/30 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {client.name}
                </h1>
                <Badge variant={client.status === 'active' ? 'success' : 'default'}>
                  {client.status === 'active' ? 'Cliente Ativo' : 'Inativo'}
                </Badge>
                {areaObj && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {areaObj.name}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{client.cpf ? `CPF: ${formatCPF(client.cpf)}` : `CNPJ: ${formatCNPJ(client.cnpj)}`}</span>
                {client.city && <span>• {client.city}/{client.state}</span>}
                <span>• Cadastrado em {formatDate(client.createdAt)}</span>
              </div>

              {/* Fast Direct Contact Bar */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/55${(client.whatsapp || client.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp: {formatPhone(client.whatsapp || client.phone)}
                </a>

                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> {client.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary Pill Box */}
          <div className="flex flex-row md:flex-col gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-right">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Contratado</div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">{formatCurrency(totalContracted)}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Total Pago</div>
              <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</div>
            </div>
            {totalPending > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Pendente</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalPending)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* 1. Visão Geral */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-brand-500" /> Resumo do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Advogado Condutor</span>
                  <span className="font-bold text-slate-900 dark:text-white">{responsibleLawyer?.name || 'Escritório'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Canal de Origem</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{client.source || 'Indicação'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data de Entrada</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(client.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Status Contratual</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{client.status}</span>
                </div>
              </div>

              {client.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Observações do Cliente</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-navy-950 p-3 rounded-xl">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" /> Endereço & Localização
              </h3>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <p><strong>Logradouro:</strong> {client.address || 'Não informado'}</p>
                <p><strong>Bairro:</strong> {client.neighborhood || 'Centro'}</p>
                <p><strong>Cidade / UF:</strong> {client.city} - {client.state}</p>
                <p><strong>CEP:</strong> {client.cep || '00000-000'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Dados Pessoais */}
        {activeTab === 'personal' && (
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Qualificação Civil Completa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Nome Completo</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.name}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">CPF / CNPJ</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.cpf || client.cnpj || 'Não cadastrado'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">RG / Órgão Emissor</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.rg || 'Não informado'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Estado Civil</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.maritalStatus || 'Não informado'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Profissão / Ocupação</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.profession || 'Não informada'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Nacionalidade</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.nationality || 'Brasileira'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Atendimentos */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Histórico de Atendimentos</h3>
              <button
                onClick={() => onOpenNewAttendance({ clientId: client.id, clientName: client.name })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Novo Atendimento
              </button>
            </div>
            {clientAttendances.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum atendimento registrado para este cliente.</p>
            ) : (
              <div className="space-y-3">
                {clientAttendances.map(att => (
                  <div key={att.id} className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-slate-900 dark:text-white">{att.subject} ({att.channel})</span>
                      <span className="text-slate-400 text-[10px]">{formatDate(att.date, true)}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{att.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Timeline */}
        {activeTab === 'timeline' && (
          <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Linha do Tempo de Relacionamento</h3>
            <div className="border-l-2 border-brand-500/30 pl-4 space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white dark:ring-navy-900" />
                <span className="text-[10px] text-slate-400 font-bold">{formatDate(client.createdAt)}</span>
                <p className="font-bold text-slate-900 dark:text-white">Cadastro de Cliente Realizado</p>
                <p className="text-slate-500">Cliente registrado na base jurídica pelo canal {client.source || 'Indicação'}.</p>
              </div>
              {clientContracts.map(c => (
                <div key={c.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-navy-900" />
                  <span className="text-[10px] text-slate-400 font-bold">{formatDate(c.signedDate || c.createdDate)}</span>
                  <p className="font-bold text-slate-900 dark:text-white">Contrato Assinado ({c.contractNumber})</p>
                  <p className="text-slate-500">Honorários contratados no valor de {formatCurrency(c.value)}.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Contratos */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contratos de Honorários</h3>
              <button
                onClick={onOpenNewContract}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Novo Contrato
              </button>
            </div>
            {clientContracts.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum contrato formalizado ainda.</p>
            ) : (
              <div className="space-y-3">
                {clientContracts.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{c.contractNumber}</div>
                      <div className="text-slate-400 text-[11px]">{c.legalArea} • Assinado em {formatDate(c.signedDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(c.value)}</div>
                      <button
                        onClick={() => pdfService.printContract(c, officeSettings)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline mt-1"
                      >
                        <Printer className="h-3 w-3" /> Imprimir Minuta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Processos */}
        {activeTab === 'processes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Processos Judiciais Vinculados</h3>
              <button
                onClick={() => onOpenNewProcess(client)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Vincular Processo
              </button>
            </div>
            {clientProcesses.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum processo judicial cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {clientProcesses.map(proc => (
                  <div key={proc.id} className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-brand-600 dark:text-brand-400">{formatCNJProcessNumber(proc.processNumber)}</div>
                      <div className="text-slate-500">{proc.court} • {proc.tribunal}</div>
                    </div>
                    <Badge variant={proc.status === 'active' ? 'success' : 'default'}>{proc.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Documentos */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Acervo de Documentos do Cliente</h3>
            {clientDocuments.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum documento anexado ainda.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clientDocuments.map(doc => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                      <div className="text-[10px] text-slate-400">{doc.category} • {doc.fileName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => showToast(`Download iniciado: ${doc.fileName}`, 'info')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Baixar arquivo"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDocToDelete(doc);
                          setDeleteDocModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Excluir documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. Financeiro */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Parcelas e Honorários</h3>
            {clientInstallments.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhuma parcela gerada.</p>
            ) : (
              <div className="space-y-2">
                {clientInstallments.map(inst => (
                  <div key={inst.id} className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">Parcela {inst.number}/{inst.totalInstallments}</span>
                      <span className="text-slate-400 ml-2">Vencimento: {formatDate(inst.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(inst.amount)}</span>
                      <Badge variant={inst.status === 'paid' ? 'success' : 'warning'}>{inst.status === 'paid' ? 'Pago' : 'Pendente'}</Badge>
                      {inst.status !== 'paid' && (
                        <button
                          onClick={() => {
                            markInstallmentPaid(inst.id);
                            showToast('Parcela baixada com sucesso!');
                          }}
                          className="bg-emerald-600 px-2.5 py-1 text-white font-bold rounded-lg text-[11px]"
                        >
                          Dar Baixa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pop-up de Confirmação de Exclusão do Cliente (Fecha Imediatamente) */}
      <ConfirmModal
        isOpen={deleteClientModalOpen}
        onClose={() => setDeleteClientModalOpen(false)}
        onConfirm={handleConfirmDeleteClient}
        title="Excluir Cliente Definitivamente"
        message={`Tem certeza que deseja excluir o cliente "${client.name}"? Todos os contratos, atendimentos e históricos serão removidos da base.`}
        confirmLabel="Sim, Excluir Cliente"
      />

      {/* Pop-up de Confirmação de Exclusão de Documento (Fecha Imediatamente) */}
      <ConfirmModal
        isOpen={deleteDocModalOpen}
        onClose={() => {
          setDeleteDocModalOpen(false);
          setDocToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDoc}
        title="Excluir Documento do Cliente"
        message={`Deseja excluir o documento "${docToDelete?.title}" do acervo deste cliente?`}
        confirmLabel="Sim, Excluir"
      />
    </div>
  );
}
