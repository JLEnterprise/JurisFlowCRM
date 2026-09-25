import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MessageCircle,
  Phone,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Download,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatCPF, formatCNPJ, formatPhone, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { exportService } from '../../services/exportService';
import { Select } from '../common/Select';
import { todayStr, addDays, fmtDay, relativeDay } from '../financial/financeUtils';

export function ClientList({ onOpenNewClient, onEditClient, onSelectClient, onOpenProfile, onNavigate }) {
  const { clients, contracts = [], installments = [], deleteClient, legalAreas, showToast, logActivity } = useCRM();
  const { users } = useAuth();

  const today = todayStr();
  const in30 = addDays(today, 30);

  // Dados de contrato de cada cliente: valor somado, assinatura mais recente e vencimento
  // (fim do contrato quando existe; senão a última parcela)
  const contractInfo = (client) => {
    const name = (client.name || '').trim().toLowerCase();
    const own = contracts.filter(c =>
      c.status !== 'cancelado' && c.status !== 'rescindido' &&
      (String(c.clientId || c.client_id || '') === String(client.id) || (c.clientName || '').trim().toLowerCase() === name)
    );
    const ids = new Set(own.map(c => String(c.id)));
    const inst = installments.filter(i =>
      ids.has(String(i.contractId || i.contract_id || '')) ||
      String(i.clientId || i.client_id || '') === String(client.id) ||
      (i.clientName || i.client_name || '').trim().toLowerCase() === name
    );
    const day = (v) => String(v || '').split('T')[0];
    const signed = own.map(c => day(c.signedDate || c.signed_date || c.createdDate || c.created_date)).filter(Boolean).sort().pop() || '';
    const ends = [
      ...own.map(c => day(c.endDate || c.end_date || c.expirationDate)),
      ...inst.map(i => day(i.dueDate || i.due_date)),
    ].filter(Boolean).sort();
    const value = own.reduce((a, c) => a + (Number(c.value) || 0), 0) || Number(client.totalContracted) || 0;
    return { count: own.length, value, signed, end: ends.pop() || '' };
  };

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  // 'grid' | 'table' — lembrado entre sessões
  const [viewMode, setViewModeState] = useState(() => {
    try { return window.localStorage.getItem('jurisflow_clientes_visao') || 'table'; } catch { return 'table'; }
  });
  const setViewMode = (mode) => {
    setViewModeState(mode);
    try { window.localStorage.setItem('jurisflow_clientes_visao', mode); } catch { /* sem storage */ }
  };

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const selectClientFn = onSelectClient || onOpenProfile || (() => {});

  const filteredClients = clients.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch =
      c.name?.toLowerCase().includes(term) ||
      (c.cpf && c.cpf.includes(term)) ||
      (c.cnpj && c.cnpj.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term));

    const matchesArea = !selectedArea || c.legalArea === selectedArea;
    const matchesStatus = !selectedStatus || c.status === selectedStatus;
    const matchesLawyer = !selectedLawyer || c.responsibleLawyerId === selectedLawyer;

    return matchesSearch && matchesArea && matchesStatus && matchesLawyer;
  });

  const getAreaLabel = (areaId) => {
    const found = legalAreas.find(a => a.id === areaId);
    return found ? found.name : areaId;
  };

  const getLawyerName = (lawyerId) => {
    const found = users.find(u => u.id === lawyerId);
    return found ? found.name : 'Advogado do Escritório';
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'name', label: 'Nome do Cliente' },
      { key: 'cpf', label: 'CPF/CNPJ', formatter: (val, row) => row.cpf || row.cnpj || '' },
      { key: 'phone', label: 'Telefone' },
      { key: 'email', label: 'E-mail' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'UF' },
      { key: 'legalArea', label: 'Área Jurídica' },
      { key: 'totalContracted', label: 'Valor Contratado (R$)', formatter: (val) => val || 0 },
      { key: 'totalPaid', label: 'Valor Pago (R$)', formatter: (val) => val || 0 },
      { key: 'status', label: 'Status' },
    ];
    exportService.exportToCSV('Relatorio_Clientes_JurisFlow', filteredClients, headers);
    showToast('Base de clientes exportada com sucesso!');
  };

  const handleRequestDelete = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      const clientId = clientToDelete.id;
      const clientName = clientToDelete.name;
      setDeleteModalOpen(false);
      setClientToDelete(null);
      deleteClient(clientId);
      logActivity('Exclusão de Cliente', clientName, 'Cliente removido da base de dados.');
      showToast(`Cliente "${clientName}" excluído(a) com sucesso!`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Search & Actions Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar cliente por nome, CPF/CNPJ, e-mail, cidade..."
            className="w-full rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500 focus:outline-none shadow-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Layout switcher */}
          <div className="funil-tabs">
            <button type="button" onClick={() => setViewMode('table')} className={`funil-tab ${viewMode === 'table' ? 'is-active' : ''}`}>
              <List className="h-3.5 w-3.5" /> Lista
            </button>
            <button type="button" onClick={() => setViewMode('grid')} className={`funil-tab ${viewMode === 'grid' ? 'is-active' : ''}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all shadow-xs btn-tactile"
            title="Exportar base de clientes em CSV"
          >
            <Download className="h-3.5 w-3.5 text-gold-500" /> Exportar CSV
          </button>
          <button
            onClick={onOpenNewClient}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:brightness-110 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-900/20 transition-all btn-tactile"
          >
            <Plus className="h-4 w-4" /> Cadastrar Cliente
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
          <Filter className="h-3 w-3 text-gold-500" /> Filtros:
        </span>

        <Select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todas as Áreas Jurídicas</option>
          {legalAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>

        <Select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativo na Base</option>
          <option value="inactive">Inativo / Concluído</option>
        </Select>

        <Select
          value={selectedLawyer}
          onChange={(e) => setSelectedLawyer(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todos os Advogados</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>

        {(selectedArea || selectedStatus || selectedLawyer || search) && (
          <button
            onClick={() => {
              setSelectedArea('');
              setSelectedStatus('');
              setSelectedLawyer('');
              setSearch('');
            }}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente ativo' : 'clientes ativos'}
        </div>
      </div>

      {/* Content */}
      {filteredClients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente localizado"
          description="Ajuste os filtros de busca ou cadastre um novo cliente na carteira."
          iconName="UserCheck"
          actionLabel="Cadastrar Cliente"
          onAction={onOpenNewClient}
        />
      ) : viewMode === 'grid' ? (
        /* Modo Cards Executivos de Clientes */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="executive-card p-5 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-sm hover:shadow-xl dark:hover:shadow-brand-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={client.avatar}
                      name={client.name}
                      size="md"
                      className="rounded-2xl ring-2 ring-gold-500/30"
                    />
                    <div>
                      <h3
                        onClick={() => selectClientFn(client.id || client)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400 cursor-pointer transition-colors"
                      >
                        {client.name}
                      </h3>
                      <div className="text-[11px] text-slate-400">
                        {client.cpf ? formatCPF(client.cpf) : client.cnpj ? formatCNPJ(client.cnpj) : 'Documento N/I'}
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    client.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                  }`}>
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Scale className="h-3.5 w-3.5 text-gold-500" /> Área:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {getAreaLabel(client.legalArea)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> Cidade/UF:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {client.city ? `${client.city}/${client.state}` : 'Não informado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Contratado:
                    </span>
                    <span className="font-numeric font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(contractInfo(client).value)}
                    </span>
                  </div>

                  {contractInfo(client).end && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <FileText className="h-3.5 w-3.5 text-gold-500" /> Vencimento:
                      </span>
                      <span className="font-numeric font-medium text-slate-700 dark:text-slate-300">
                        {fmtDay(contractInfo(client).end)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <a
                  href={`https://wa.me/55${(client.whatsapp || client.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => selectClientFn(client.id || client)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors btn-tactile"
                    title="Ver Perfil Completo 360°"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onEditClient(client)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors btn-tactile"
                    title="Editar Cliente"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleRequestDelete(client)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 transition-colors btn-tactile"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Modo Lista: uma linha por cliente com área, UF, contrato e datas */
        <div className="dash-panel !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
                  <th className="px-5 py-3 font-label">Cliente</th>
                  <th className="px-4 py-3 font-label">Área</th>
                  <th className="px-3 py-3 font-label">UF</th>
                  <th className="px-4 py-3 font-label text-right">Contratado</th>
                  <th className="px-4 py-3 font-label">Assinatura</th>
                  <th className="px-4 py-3 font-label">Vencimento</th>
                  <th className="px-4 py-3 font-label">Status</th>
                  <th className="px-5 py-3 font-label text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredClients.map((client) => {
                  const info = contractInfo(client);
                  const endSoon = info.end && info.end >= today && info.end <= in30;
                  const ended = info.end && info.end < today;
                  return (
                    <tr key={client.id} className="group transition-colors hover:bg-gold-500/[0.035]">
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => selectClientFn(client.id || client)} className="flex items-center gap-3 text-left">
                          <Avatar src={client.avatar} name={client.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block max-w-[15rem] truncate font-semibold text-slate-900 transition-colors group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-300">
                              {client.name}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {client.cpf ? formatCPF(client.cpf) : client.cnpj ? formatCNPJ(client.cnpj) : formatPhone(client.whatsapp || client.phone) || 'Sem documento'}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center whitespace-nowrap rounded-full border border-gold-500/25 bg-gold-500/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-gold-800 dark:text-gold-200">
                          {getAreaLabel(client.legalArea) || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{client.state || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-numeric font-semibold text-slate-900 dark:text-white">{formatCurrency(info.value)}</div>
                        {info.count > 1 && <div className="text-[11px] text-slate-400">{info.count} contratos</div>}
                      </td>
                      <td className="px-4 py-3 font-numeric text-xs text-slate-700 dark:text-slate-300">
                        {info.signed ? fmtDay(info.signed) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {info.end ? (
                          <>
                            <div className={`font-numeric text-xs ${ended ? 'text-slate-400' : endSoon ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {fmtDay(info.end)}
                            </div>
                            <div className="text-[11px] text-slate-400">{ended ? 'encerrado' : relativeDay(info.end)}</div>
                          </>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          client.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
                            : 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400'
                        }`}>
                          {client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <a
                            href={`https://wa.me/55${(client.whatsapp || client.phone || '').replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button onClick={() => onEditClient(client)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Editar cliente">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleRequestDelete(client)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" title="Excluir cliente">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 dark:border-white/[0.06]">
            Mostrando <strong>{filteredClients.length}</strong> de <strong>{clients.length}</strong> clientes · Vencimento = fim do contrato ou última parcela
          </div>
        </div>
      )}

      {/* Pop-up de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Cadastro de Cliente"
        message={`Deseja excluir o cadastro de "${clientToDelete?.name}" da base de clientes?`}
        confirmLabel="Sim, Excluir Cadastro"
      />
    </div>
  );
}
