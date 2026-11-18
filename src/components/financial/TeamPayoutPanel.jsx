import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, Percent, Save, Settings2, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import { instAmount, instPaidOn } from './financeUtils';

// Repasses da equipe: cada colaborador (fora o titular) recebe um percentual do valor BRUTO
// que entrou no mês (parcelas pagas, pela data de pagamento). O titular fica com o restante.
// Os percentuais ficam em office_settings.payoutShares = { [userId]: número } — só a tela lê isso,
// nenhuma parcela é alterada.

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad = (n) => String(n).padStart(2, '0');

const rolesOf = (u) => (Array.isArray(u?.roles) && u.roles.length ? u.roles : [u?.role]).filter(Boolean);
const isOwner = (u) => rolesOf(u).includes('admin');

export function TeamPayoutPanel() {
  const { users: allUsers = [], currentUser, permissions } = useAuth();
  const { installments = [], officeSettings = {}, updateOfficeSettings, showToast, logActivity } = useCRM();

  const users = useMemo(
    () => allUsers.filter((u) => !u.fromMatriz && (u.status || 'active') === 'active'),
    [allUsers]
  );
  const savedShares = officeSettings.payoutShares || {};
  const canManage = !!permissions?.canAccessSettings || isOwner(currentUser) || currentUser?.role === 'dev';

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [draftOwnerId, setDraftOwnerId] = useState('');

  // Titular = quem fica com o restante. Escolhido no editor; padrão: o sócio-administrador que não é da TI
  const defaultOwner = users.find((u) => isOwner(u) && !rolesOf(u).includes('dev')) || users.find(isOwner) || users[0] || null;
  const savedOwnerId = officeSettings.payoutOwnerId && users.some((u) => String(u.id) === String(officeSettings.payoutOwnerId))
    ? String(officeSettings.payoutOwnerId)
    : String(defaultOwner?.id || '');
  const ownerId = editing ? draftOwnerId : savedOwnerId;
  const owner = users.find((u) => String(u.id) === ownerId) || null;
  const members = users.filter((u) => String(u.id) !== ownerId);

  const shares = editing ? draft : savedShares;
  const shareOf = (u) => Math.max(0, Number(shares[String(u.id)]) || 0);

  const monthKey = `${month.y}-${pad(month.m + 1)}`;
  const monthPaid = useMemo(
    () => (installments || []).filter((i) => i.status === 'paid' && instPaidOn(i).startsWith(monthKey)),
    [installments, monthKey]
  );
  const gross = monthPaid.reduce((acc, i) => acc + instAmount(i), 0);

  const sharedMembers = members.filter((u) => shareOf(u) > 0);
  const sharedPercent = sharedMembers.reduce((acc, u) => acc + shareOf(u), 0);
  const ownerPercent = Math.max(0, 100 - sharedPercent);
  const overLimit = sharedPercent > 100;

  // Quem não administra só vê a própria parte (e só se tiver repasse)
  const myShare = currentUser ? shareOf(currentUser) : 0;
  if (!canManage && myShare <= 0) return null;
  const visibleMembers = canManage
    ? sharedMembers
    : sharedMembers.filter((u) => String(u.id) === String(currentUser?.id));

  const shiftMonth = (delta) => setMonth(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const startEdit = () => {
    setDraft(Object.fromEntries(users.map((u) => [String(u.id), Number(savedShares[String(u.id)]) || 0])));
    setDraftOwnerId(savedOwnerId);
    setEditing(true);
  };

  const handleSave = () => {
    if (overLimit) return;
    const clean = Object.fromEntries(
      Object.entries(draft)
        .filter(([id]) => id !== draftOwnerId)
        .map(([id, v]) => [id, Math.round((Number(v) || 0) * 100) / 100])
        .filter(([, v]) => v > 0)
    );
    updateOfficeSettings({ payoutShares: clean, payoutOwnerId: draftOwnerId || null });
    const resumo = members
      .filter((u) => clean[String(u.id)])
      .map((u) => `${u.name}: ${clean[String(u.id)]}%`)
      .join(', ') || 'nenhum repasse';
    logActivity && logActivity('Repasses da Equipe', 'Percentuais de repasse', resumo);
    showToast && showToast('Percentuais de repasse salvos.', 'success');
    setEditing(false);
  };

  const ownerName = owner?.name || 'Titular do escritório';

  return (
    <div className="dash-panel !p-0 overflow-hidden">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-gold-600 dark:text-gold-400" />
            {canManage ? 'Repasses da equipe' : 'Meu repasse'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Percentual sobre o valor bruto recebido no mês (parcelas pagas, pela data do pagamento)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/[0.08]">
            <button type="button" onClick={() => shiftMonth(-1)} className="rounded-l-full p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[8.5rem] text-center text-xs font-semibold text-slate-700 dark:text-slate-200">
              {MONTHS[month.m].charAt(0).toUpperCase() + MONTHS[month.m].slice(1)} de {month.y}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} className="rounded-r-full p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {canManage && !editing && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/40 hover:text-slate-900 dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white"
            >
              <Settings2 className="h-3.5 w-3.5" /> Configurar
            </button>
          )}
        </div>
      </div>

      {/* Base do cálculo */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-5 pt-4">
        <div>
          <div className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Recebido no mês (bruto)</div>
          <div className="font-numeric text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(gross)}</div>
        </div>
        <div className="text-[11px] text-slate-400">{monthPaid.length} pagamento(s)</div>
      </div>

      {/* Editor de percentuais (só quem administra) */}
      {editing && (
        <div className="mx-5 mt-4 rounded-2xl border border-gold-500/25 bg-gold-500/[0.04] p-4">
          <div className="mb-3 text-xs text-slate-600 dark:text-slate-300">
            Informe o percentual de cada colaborador. O titular fica com o restante. Deixe 0 para quem não recebe repasse.
          </div>
          <label className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Crown className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" /> Titular (fica com o restante):
            <select
              value={draftOwnerId}
              onChange={(e) => setDraftOwnerId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 focus:border-gold-500/50 focus:outline-none dark:border-white/[0.1] dark:bg-navy-900 dark:text-white"
            >
              {users.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((u) => (
              <label key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                </span>
                <span className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={draft[String(u.id)] ?? 0}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [String(u.id)]: e.target.value }))}
                    className="w-20 rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-right font-numeric text-sm text-slate-900 focus:border-gold-500/50 focus:outline-none dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white"
                    aria-label={`Percentual de ${u.name}`}
                  />
                  <Percent className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </span>
              </label>
            ))}
            {members.length === 0 && (
              <div className="text-xs text-slate-500">Não há colaboradores além do titular. Cadastre a equipe em Colaboradores.</div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className={`text-xs font-semibold ${overLimit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {overLimit
                ? `A soma passa de 100% (${sharedPercent}%). Ajuste os valores.`
                : `Equipe: ${sharedPercent}% · Titular: ${ownerPercent}%`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={overLimit}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" /> Salvar percentuais
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divisão do mês */}
      <div className="px-5 py-4">
        {canManage && sharedMembers.length === 0 && !editing ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
            Nenhum repasse configurado: hoje todo o valor fica com o titular. Clique em <b>Configurar</b> para definir o percentual de cada colaborador.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {visibleMembers.map((u) => {
              const pct = shareOf(u);
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{u.name}</span>
                      <span className="block text-[11px] text-slate-400">{pct}% do bruto</span>
                    </span>
                  </span>
                  <span className="font-numeric text-base font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency((gross * pct) / 100)}
                  </span>
                </div>
              );
            })}
            {canManage && !overLimit && (
              <div className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400">
                    <Crown className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{ownerName}</span>
                    <span className="block text-[11px] text-slate-400">{ownerPercent}% · restante do bruto</span>
                  </span>
                </span>
                <span className="font-numeric text-base font-semibold text-slate-900 dark:text-white">
                  {formatCurrency((gross * ownerPercent) / 100)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
