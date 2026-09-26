import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Video,
  Instagram,
  Clock,
  User,
  Headphones,
  Edit,
  Trash2,
  List,
  LayoutGrid,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { AttendanceModal } from './AttendanceModal';
import { Select } from '../common/Select';

const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  email: 'E-mail',
  videoconferencia: 'Videoconferência',
  presencial: 'Presencial',
  instagram: 'Instagram',
};

export function AttendanceList({ onOpenNewAttendance, onEditAttendance }) {
  const { attendances = [], deleteAttendance } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  // Visualização em lista ou em blocos (lembrada entre sessões)
  const [viewMode, setViewModeState] = useState(() => {
    try { return window.localStorage.getItem('jurisflow_atendimentos_visao') || 'list'; } catch { return 'list'; }
  });
  const setViewMode = (mode) => {
    setViewModeState(mode);
    try { window.localStorage.setItem('jurisflow_atendimentos_visao', mode); } catch { /* sem storage */ }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);

  const [localEditModalOpen, setLocalEditModalOpen] = useState(false);
  const [localAttendanceToEdit, setLocalAttendanceToEdit] = useState(null);

  const handleEditClick = (att) => {
    if (onEditAttendance) {
      onEditAttendance(att);
    } else {
      setLocalAttendanceToEdit(att);
      setLocalEditModalOpen(true);
    }
  };

  const handleDeleteClick = (att) => {
    setAttendanceToDelete(att);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (attendanceToDelete) {
      deleteAttendance(attendanceToDelete.id);
      setDeleteModalOpen(false);
      setAttendanceToDelete(null);
    }
  };

  const filtered = (attendances || []).filter(a => {
    if (!a) return false;
    const term = (search || '').toLowerCase().trim();
    const clientName = String(a.clientName || a.client_name || '').toLowerCase();
    const subject = String(a.subject || '').toLowerCase();
    const description = String(a.description || '').toLowerCase();

    const matchesSearch = !term ||
      clientName.includes(term) ||
      subject.includes(term) ||
      description.includes(term);

    const matchesChannel = !selectedChannel || (a.channel || 'whatsapp') === selectedChannel;

    return matchesSearch && matchesChannel;
  });

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-emerald-500" />;
      case 'telefone': return <Phone className="h-4 w-4 text-blue-500" />;
      case 'email': return <Mail className="h-4 w-4 text-gold-500" />;
      case 'videoconferencia': return <Video className="h-4 w-4 text-brand-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      default: return <MapPin className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Busca, filtro e ação numa linha só */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, assunto ou detalhes..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500 focus:outline-none"
          />
        </div>

        <Select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Todos os Canais</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telefone">Telefone</option>
          <option value="email">E-mail</option>
          <option value="videoconferencia">Videoconferência</option>
          <option value="presencial">Presencial</option>
          <option value="instagram">Instagram Direct</option>
        </Select>

        {(selectedChannel || search) && (
          <button
            onClick={() => {
              setSelectedChannel('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-1"
          >
            Limpar
          </button>
        )}

        <div className="funil-tabs ml-auto">
          <button type="button" onClick={() => setViewMode('list')} className={`funil-tab ${viewMode === 'list' ? 'is-active' : ''}`}>
            <List className="h-3.5 w-3.5" /> Lista
          </button>
          <button type="button" onClick={() => setViewMode('grid')} className={`funil-tab ${viewMode === 'grid' ? 'is-active' : ''}`}>
            <LayoutGrid className="h-3.5 w-3.5" /> Blocos
          </button>
        </div>

        <button
          onClick={onOpenNewAttendance}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all btn-tactile"
        >
          <Plus className="h-4 w-4" /> Novo Atendimento
        </button>
      </div>

      {/* Attendance Items */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum registro de atendimento encontrado"
          description="Registre os atendimentos e contatos com clientes para manter o histórico sempre seguro."
          iconName="Headphones"
          actionLabel="Registrar Atendimento"
          onAction={onOpenNewAttendance}
        />
      ) : viewMode === 'list' ? (
        /* Lista: uma linha por atendimento */
        <div className="dash-panel !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400">
                  <th className="px-5 py-3 font-label">Data</th>
                  <th className="px-4 py-3 font-label">Cliente</th>
                  <th className="px-4 py-3 font-label">Assunto</th>
                  <th className="px-4 py-3 font-label">Canal</th>
                  <th className="px-4 py-3 font-label">Responsável</th>
                  <th className="px-5 py-3 font-label text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filtered.map((att) => (
                  <tr key={att.id} onClick={() => handleEditClick(att)} className="group cursor-pointer transition-colors hover:bg-gold-500/[0.035]">
                    <td className="px-5 py-3 font-numeric text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {formatDate(att.date || new Date().toISOString().split('T')[0])}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 transition-colors group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-300">
                      {att.clientName || att.client_name || 'Cliente'}
                    </td>
                    <td className="max-w-[20rem] px-4 py-3">
                      <div className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{att.subject || 'Atendimento geral'}</div>
                      {att.description && <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{att.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs capitalize text-slate-700 dark:text-slate-200">
                        {getChannelIcon(att.channel)} {CHANNEL_LABELS[att.channel || 'whatsapp'] || att.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {att.responsibleName || att.responsible_lawyer_name || 'Equipe'}
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => handleEditClick(att)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Editar atendimento"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteClick(att)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" title="Excluir atendimento"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Blocos: um cartão por atendimento */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((att) => (
            <div
              key={att.id}
              onClick={() => handleEditClick(att)}
              className="dash-panel group flex cursor-pointer flex-col justify-between !p-5 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700 dark:bg-white/[0.05] dark:text-slate-200">
                    {getChannelIcon(att.channel)} {CHANNEL_LABELS[att.channel || 'whatsapp'] || att.channel}
                  </span>
                  <span className="font-numeric text-[11px] text-slate-500 dark:text-slate-400">
                    {formatDate(att.date || new Date().toISOString().split('T')[0])}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 transition-colors group-hover:text-gold-700 dark:text-white dark:group-hover:text-gold-300">
                  {att.subject || 'Atendimento geral'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {att.clientName || att.client_name || 'Cliente'}
                </p>
                {att.description && (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{att.description}</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Resp.: {att.responsibleName || att.responsible_lawyer_name || 'Equipe'}</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleEditClick(att)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Editar atendimento"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDeleteClick(att)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" title="Excluir atendimento"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAttendanceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Registro de Atendimento"
        message={`Tem certeza que deseja excluir o atendimento do cliente "${attendanceToDelete?.clientName || attendanceToDelete?.client_name || 'Cliente'}" sobre "${attendanceToDelete?.subject || 'Atendimento'}"? Esta ação removerá o registro do histórico.`}
        confirmLabel="Sim, Excluir Atendimento"
      />

      {/* Local Edit Attendance Modal (if used standalone) */}
      <AttendanceModal
        isOpen={localEditModalOpen}
        onClose={() => {
          setLocalEditModalOpen(false);
          setLocalAttendanceToEdit(null);
        }}
        attendanceToEdit={localAttendanceToEdit}
      />
    </div>
  );
}
