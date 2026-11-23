import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, Percent, Save, Settings2, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/formatters';
import { Avatar } from '../common/Avatar';
import { instAmount, instPaidOn } from './financeUtils';

// Repasses da equipe: cada colaborador (fora o titular) recebe um percentual do valor BRUTO
// que entrou no mês (parcelas pagas, pela data de pagamento). O titular fica com o restante.
// Os percentuais são sigilosos e ficam na tabela team_payout_shares: o dono (e quem tem
// "Configurações do escritório") vê e edita todos; cada colaborador lê só a própria linha.
// Nenhuma parcela é alterada.

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad = (n) => String(n).padStart(2, '0');

const rolesOf = (u) => (Array.isArray(u?.roles) && u.roles.length ? u.roles : [u?.role]).filter(Boolean);
const isOwner = (u) => rolesOf(u).includes('admin');

function useMonth() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const shiftMonth = (delta) => setMonth(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  return { month, shiftMonth, monthKey: `${month.y}-${pad(month.m + 1)}` };
}

function MonthPicker({ month, shiftMonth }) {
  return (
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
  );
}

// "Meu repasse": para quem tem percentual. O bruto vem do banco (a pessoa pode não ter acesso às parcelas).
export function MyPayoutCard() {
  const { month, shiftMonth, monthKey } = useMonth();
  const [data, setData] = useState(undefined); // undefined = carregando, null = sem repasse

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('my_team_payout', { p_month: monthKey }).then(({ data: rows, error }) => {
      if (cancelled) return;
      if (error) {
        console.warn('[repasse] erro ao carregar:', error.message);
        setData(null);
        return;
      }
      setData(rows?.[0] || null);
    });
    return () => { cancelled = true; };
  }, [monthKey]);

  if (!data) return null;
  const gross = Number(data.gross) || 0;
  const percent = Number(data.percent) || 0;

  return (
    <div className="dash-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-gold-600 dark:text-gold-400" /> Meu repasse
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {percent}% sobre o valor bruto recebido no mês ({data.payments} pagamento{data.payments === 1 ? '' : 's'})
          </p>
        </div>
        <MonthPicker month={month} shiftMonth={shiftMonth} />
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <div className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Meu valor no mês</div>
          <div className="font-numeric text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency((gross * percent) / 100)}</div>
        </div>
        <div>
          <div className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Recebido no mês (bruto)</div>
          <div className="font-numeric text-base font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(gross)}</div>
        </div>
      </div>
    </div>
  );
}

export function TeamPayoutPanel() {
  const { users: allUsers = [], currentUser, permissions } = useAuth();
  const { installments = [], currentEscritorioId, ownEscritorioId, isConsolidated, showToast, logActivity } = useCRM();
  const canManage = !!permissions?.canAccessSettings || isOwner(currentUser) || currentUser?.role === 'dev';
  const officeId = isConsolidated ? ownEscritorioId : (currentEscritorioId || ownEscritorioId);

  const users = useMemo(
    () => allUsers.filter((u) => !u.fromMatriz && (u.status || 'active') === 'active'),
    [allUsers]
  );
  const { month, shiftMonth, monthKey } = useMonth();

  // Percentuais salvos: { [userId]: { percent, is_owner } }
  const [saved, setSaved] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!officeId || !canManage) return;
    const { data, error } = await supabase
      .from('team_payout_shares')
      .select('user_id, percent, is_owner')
      .eq('escritorio_id', officeId);
    if (error) {
      console.warn('[repasse] erro ao carregar:', error.message);
      return;
    }
    setSaved(Object.fromEntries((data || []).map((r) => [String(r.user_id), { percent: Number(r.percent) || 0, isOwner: !!r.is_owner }])));
    setLoaded(true);
  }, [officeId, canManage]);

  useEffect(() => { load(); }, [load]);

  // Outro computador alterou os percentuais: atualiza aqui também
  useEffect(() => {
    if (!canManage) return undefined;
    const channel = supabase.channel(`realtime_repasses_${officeId || 'x'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_payout_shares' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [canManage, officeId, load]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [draftOwnerId, setDraftOwnerId] = useState('');

  // Titular = quem fica com o restante. Escolhido no editor; padrão: o sócio-administrador que não é da TI
  const defaultOwner = users.find((u) => isOwner(u) && !rolesOf(u).includes('dev')) || users.find(isOwner) || users[0] || null;
  const savedOwnerEntry = Object.entries(saved).find(([id, v]) => v.isOwner && users.some((u) => String(u.id) === id));
  const savedOwnerId = savedOwnerEntry ? savedOwnerEntry[0] : String(defaultOwner?.id || '');
  const ownerId = editing ? draftOwnerId : savedOwnerId;
  const owner = users.find((u) => String(u.id) === ownerId) || null;
  const members = users.filter((u) => String(u.id) !== ownerId);

  const shareOf = (u) => Math.max(0, Number(editing ? draft[String(u.id)] : saved[String(u.id)]?.percent) || 0);

  const monthPaid = useMemo(
    () => (installments || []).filter((i) => i.status === 'paid' && instPaidOn(i).startsWith(monthKey)),
    [installments, monthKey]
  );
  const gross = monthPaid.reduce((acc, i) => acc + instAmount(i), 0);

  const sharedMembers = members.filter((u) => shareOf(u) > 0);
  const sharedPercent = Math.round(sharedMembers.reduce((acc, u) => acc + shareOf(u), 0) * 100) / 100;
  const ownerPercent = Math.max(0, Math.round((100 - sharedPercent) * 100) / 100);
  const overLimit = sharedPercent > 100;

  // Quem não administra vê só o próprio repasse (calculado no banco)
  if (!canManage) return <MyPayoutCard />;

  const startEdit = () => {
    setDraft(Object.fromEntries(users.map((u) => [String(u.id), Number(saved[String(u.id)]?.percent) || 0])));
    setDraftOwnerId(savedOwnerId);
    setEditing(true);
  };

  const handleSave = async () => {
    if (overLimit || !officeId) return;
    setSaving(true);
    const rows = users.map((u) => {
      const id = String(u.id);
      const isTitular = id === draftOwnerId;
      return {
        escritorio_id: officeId,
        user_id: id,
        percent: isTitular ? 0 : Math.round((Number(draft[id]) || 0) * 100) / 100,
        is_owner: isTitular,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || null,
      };
    });
    const { error } = await supabase.from('team_payout_shares').upsert(rows, { onConflict: 'escritorio_id,user_id' });
    setSaving(false);
    if (error) {
      console.warn('[repasse] erro ao salvar:', error.message);
      showToast && showToast('Não foi possível salvar os percentuais. Nada foi alterado.', 'danger', 6000);
      return;
    }
    await load();
    // O histórico registra que houve alteração, sem os percentuais (são sigilosos)
    logActivity && logActivity('Repasses da Equipe', 'Percentuais de repasse', 'Percentuais da equipe atualizados.');
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
            Repasses da equipe
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Percentual sobre o valor bruto recebido no mês (parcelas pagas, pela data do pagamento). Cada colaborador vê só o próprio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker month={month} shiftMonth={shiftMonth} />
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              disabled={!loaded}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/40 hover:text-slate-900 disabled:opacity-40 dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white"
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

      {/* Editor de percentuais */}
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
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={overLimit || saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? 'Salvando...' : 'Salvar percentuais'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Divisão do mês */}
      <div className="px-5 py-4">
        {sharedMembers.length === 0 && !editing ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/[0.08] dark:text-slate-400">
            Nenhum repasse configurado: hoje todo o valor fica com o titular. Clique em <b>Configurar</b> para definir o percentual de cada colaborador.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {sharedMembers.map((u) => {
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
            {!overLimit && (
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
