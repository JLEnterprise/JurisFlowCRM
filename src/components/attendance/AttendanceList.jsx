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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { ConfirmModal } from '../common/ConfirmModal';
import { AttendanceModal } from './AttendanceModal';

export function AttendanceList({ onOpenNewAttendance, onEditAttendance }) {
  const { attendances = [], deleteAttendance } = useCRM();
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');

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
      case 'email': return <Mail className="h-4 w-4 text-amber-500" />;
      case 'videoconferencia': return <Video className="h-4 w-4 text-indigo-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      default: return <MapPin className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Headphones className="h-6 w-6 text-brand-600 dark:text-gold-400" />
            Atendimentos & Contatos Comerciais
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Histórico completo de interações, ligações, reuniões e alinhamentos por cliente.
          </p>
        </div>

        <button
          onClick={onOpenNewAttendance}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
        >
          <Plus className="h-4 w-4" /> Novo Atendimento
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white dark:bg-navy-900/90 border border-slate-200/80 dark:border-white/[0.08] p-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, assunto ou detalhes..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs focus:outline-none"
        >
          <option value="">Todos os Canais</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telefone">Telefone</option>
          <option value="email">E-mail</option>
          <option value="videoconferencia">Videoconferência</option>
          <option value="presencial">Presencial</option>
          <option value="instagram">Instagram Direct</option>
        </select>

        {(selectedChannel || search) && (
          <button
            onClick={() => {
              setSelectedChannel('');
              setSearch('');
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2"
          >
            Limpar Filtros
          </button>
        )}
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
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-navy-900 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.map((att) => (
            <div
              key={att.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 p-2.5 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200/60 dark:border-white/[0.06]">
                  {getChannelIcon(att.channel)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {att.subject || 'Atendimento Geral'}
                    </h3>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-gold-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md capitalize">
                      {att.channel || 'whatsapp'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Cliente: <strong>{att.clientName || att.client_name || 'Cliente'}</strong>
                  </p>

                  {att.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                      {att.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-shrink-0 justify-between sm:justify-end">
                <div className="text-left sm:text-right">
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatDate(att.date || new Date().toISOString().split('T')[0])}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Resp: {att.responsibleName || att.responsible_lawyer_name || 'Equipe'}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(att)}
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Editar Atendimento"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(att)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Excluir Atendimento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
