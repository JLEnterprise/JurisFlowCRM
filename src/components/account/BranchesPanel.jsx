import React, { useState } from 'react';
import { Building2, Check, Crown, MapPin, Pencil, Plus, Power, X } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-gold-500/60 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white';

// Configurações → Filiais: o dono cria e administra as filiais do escritório.
// Cada filial tem os próprios clientes, tarefas, agenda, financeiro e equipe.
export function BranchesPanel() {
  const {
    escritorios = [], ownEscritorioId, currentEscritorioId, isConsolidated,
    addEscritorio, updateEscritorio, deleteEscritorio, switchEscritorio,
  } = useCRM();

  const matriz = escritorios.find(e => e.id === ownEscritorioId);
  const branches = escritorios.filter(e => e.parent_id && e.parent_id === ownEscritorioId);

  const [form, setForm] = useState(null); // null = fechado
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // { id, nome }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form?.nome?.trim()) return;
    setSaving(true);
    const created = await addEscritorio({
      nome: form.nome.trim(), cidade: form.cidade?.trim(), estado: form.estado?.trim().toUpperCase(), cnpj: form.cnpj?.trim(),
    });
    setSaving(false);
    if (created) setForm(null);
  };

  const saveRename = () => {
    if (editing?.nome?.trim()) updateEscritorio(editing.id, { nome: editing.nome.trim() });
    setEditing(null);
  };

  const Row = ({ esc, isMatriz }) => {
    const inactive = esc.status === 'inactive';
    const isOpen = !isConsolidated && esc.id === currentEscritorioId;
    return (
      <div className={`flex flex-wrap items-center gap-3 px-5 py-3.5 ${inactive ? 'opacity-55' : ''}`}>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isMatriz ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-300'}`}>
          {isMatriz ? <Crown className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          {editing?.id === esc.id ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditing(null); }}
                className={`${INPUT} max-w-xs py-1.5`} />
              <button type="button" onClick={saveRename} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10" title="Salvar"><Check className="h-4 w-4" /></button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]" title="Cancelar"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">{esc.nome}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isMatriz ? 'bg-gold-500/15 text-gold-800 dark:text-gold-200' : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'}`}>
                {isMatriz ? 'Matriz' : 'Filial'}
              </span>
              {inactive && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-300">Desativada</span>}
              {isOpen && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Aberta agora</span>}
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <MapPin className="h-3 w-3" /> {esc.cidade ? `${esc.cidade}${esc.estado ? `/${esc.estado}` : ''}` : 'Cidade não informada'}
            {esc.cnpj ? ` · CNPJ ${esc.cnpj}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!inactive && !isOpen && (
            <button type="button" onClick={() => switchEscritorio(esc.id)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-gold-500/40 dark:border-white/[0.08] dark:text-slate-200">
              Abrir
            </button>
          )}
          {editing?.id !== esc.id && (
            <button type="button" onClick={() => setEditing({ id: esc.id, nome: esc.nome })} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-white" title="Renomear">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {!isMatriz && (
            <button
              type="button"
              onClick={() => (inactive ? updateEscritorio(esc.id, { status: 'active' }) : deleteEscritorio(esc.id))}
              className={`rounded-lg p-1.5 transition-colors ${inactive ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-600'}`}
              title={inactive ? 'Reativar filial' : 'Desativar filial (os dados ficam guardados)'}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Filiais</h3>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Cada filial tem os próprios clientes, tarefas, agenda, contratos, financeiro e equipe. Você (dono) troca de
            escritório no seletor do topo e ainda pode ver <b>todos os escritórios juntos</b>.
          </p>
        </div>
        {!form && (
          <button type="button" onClick={() => setForm({ nome: '', cidade: '', estado: '', cnpj: '' })}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110">
            <Plus className="h-4 w-4" /> Nova filial
          </button>
        )}
      </div>

      {form && (
        <form onSubmit={handleCreate} className="dash-panel grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nome da filial *</label>
            <input autoFocus required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Filial Campinas" className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Cidade</label>
            <input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={INPUT} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">UF</label>
            <input maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={`${INPUT} uppercase`} />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">CNPJ (opcional)</label>
            <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={INPUT} />
          </div>
          <div className="flex items-end justify-end gap-2 sm:col-span-3">
            <button type="button" onClick={() => setForm(null)} className="premium-link">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50">
              {saving ? 'Criando…' : 'Criar filial'}
            </button>
          </div>
        </form>
      )}

      <div className="dash-panel !p-0 divide-y divide-slate-100 overflow-hidden dark:divide-white/[0.05]">
        {matriz && <Row esc={matriz} isMatriz />}
        {branches.map(b => <Row key={b.id} esc={b} />)}
        {branches.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Nenhuma filial ainda. Crie a primeira em <b>Nova filial</b>.
          </div>
        )}
      </div>

      <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        <li>• Para cadastrar colaboradores de uma filial: abra a filial no topo e vá em <b>Colaboradores</b>.</li>
        <li>• Quem trabalha numa filial só enxerga aquela filial. O dono enxerga todas.</li>
        <li>• Desativar uma filial não apaga nada: os dados ficam guardados e ela pode ser reativada.</li>
      </ul>
    </div>
  );
}
