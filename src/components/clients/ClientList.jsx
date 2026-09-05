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

export function ClientList({ onOpenNewClient, onEditClient, onSelectClient, onOpenProfile, onNavigate }) {
  const { clients, deleteClient, legalAreas, showToast, logActivity } = useCRM();
  const { users } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-gold-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-gold-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/20 transition-all btn-tactile"
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

        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todas as Áreas Jurídicas</option>
          {legalAreas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todos os Status</option>
          <option value="active">Ativo na Base</option>
          <option value="inactive">Inativo / Concluído</option>
        </select>

        <select
          value={selectedLawyer}
          onChange={(e) => setSelectedLawyer(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none font-medium cursor-pointer"
        >
          <option value="">Todos os Advogados</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

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
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      {formatCurrency(client.totalContracted || 0)}
                    </span>
                  </div>
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
        /* Modo Tabela Compacta */
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111827] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/75 dark:bg-[#0b0f17]/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Área Jurídica</th>
                  <th className="px-4 py-3.5">Contato & WhatsApp</th>
                  <th className="px-4 py-3.5">Advogado Responsável</th>
                  <th className="px-4 py-3.5">Valor Contratado</th>
                  <th className="px-4 py-3.5">Honorários Pagos</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={client.avatar}
                          name={client.name}
                          size="sm"
                          className="rounded-xl ring-1 ring-gold-500/20"
                        />
                        <div>
                          <div
                            onClick={() => selectClientFn(client.id || client)}
                            className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-gold-400 cursor-pointer transition-colors"
                          >
                            {client.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {client.cpf ? formatCPF(client.cpf) : client.cnpj ? formatCNPJ(client.cnpj) : 'Sem documento'} • {client.city}/{client.state}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                        {getAreaLabel(client.legalArea)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <a
                        href={`https://wa.me/55${(client.whatsapp || client.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {formatPhone(client.whatsapp || client.phone)}
                      </a>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                      {getLawyerName(client.responsibleLawyerId)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white font-sans">
                      {formatCurrency(client.totalContracted || 0)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      {formatCurrency(client.totalPaid || 0)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        client.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => selectClientFn(client.id || client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Ver Perfil 360°"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onEditClient(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          title="Editar cliente"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 transition-colors"
                          title="Excluir cliente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] px-4 py-3 text-xs text-slate-500">
            <div>Mostrando <strong>{filteredClients.length}</strong> de <strong>{clients.length}</strong> clientes</div>
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
