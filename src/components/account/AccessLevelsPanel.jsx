import React, { useMemo, useState } from 'react';
import { Crown, Lock, RotateCcw, Save, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { ACCESS_MODULES, ACCESS_ROLES, DEFAULT_ROLE_MATRIX, roleAllows } from '../../utils/accessLevels';

// Configurações → Níveis de acesso: o que cada cargo do escritório pode abrir no sistema.
// Salvo em office_settings.rolePermissions; vale na hora para todos do escritório.
export function AccessLevelsPanel() {
  const { users = [], permissions } = useAuth();
  const { officeSettings = {}, updateOfficeSettings, showToast, logActivity } = useCRM();
  const saved = officeSettings.rolePermissions || null;

  const [draft, setDraft] = useState(() => buildDraft(saved));
  const [dirty, setDirty] = useState(false);

  const membersByRole = useMemo(() => {
    const count = {};
    users.forEach(u => {
      const roles = Array.isArray(u.roles) && u.roles.length ? u.roles : [u.role];
      roles.forEach(r => { count[r] = (count[r] || 0) + 1; });
    });
    return count;
  }, [users]);

  const canEdit = !!permissions?.canAccessSettings;

  const toggle = (roleId, key) => {
    if (!canEdit) return;
    setDraft(prev => ({ ...prev, [roleId]: { ...prev[roleId], [key]: !prev[roleId][key] } }));
    setDirty(true);
  };

  const handleSave = () => {
    updateOfficeSettings({ rolePermissions: draft });
    logActivity && logActivity('Níveis de Acesso', 'Permissões por cargo', 'Tabela de acesso do escritório atualizada.');
    showToast && showToast('Níveis de acesso salvos. Já valem para toda a equipe.', 'success');
    setDirty(false);
  };

  const handleReset = () => {
    setDraft(buildDraft(null));
    setDirty(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Níveis de acesso</h3>
          <p className="mt-0.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Defina o que cada cargo pode abrir no sistema. O cargo de cada pessoa é escolhido em <b>Colaboradores</b>;
            quem tem mais de um cargo soma os acessos.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleReset} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/40 dark:border-white/[0.08] dark:text-slate-300">
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" /> Salvar níveis
            </button>
          </div>
        )}
      </div>

      {/* Quem tem acesso total */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold-500/25 bg-gold-500/[0.05] px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
        <span>
          <b className="text-slate-900 dark:text-white">Dono / Sócio-administrador</b> tem acesso total, sempre — não dá para limitar,
          para ninguém ficar trancado fora do próprio escritório. O <b className="text-slate-900 dark:text-white">histórico de ações (auditoria)</b> é
          exclusivo do dono.
        </span>
      </div>

      {/* Tabela: módulos × cargos */}
      <div className="dash-panel !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <th className="sticky left-0 z-10 bg-inherit px-5 py-3 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Módulo
                </th>
                {ACCESS_ROLES.map(r => (
                  <th key={r.id} className="px-2 py-3 text-center align-bottom">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{r.label}</div>
                    <div className="text-[10px] font-normal text-slate-400">{r.hint}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                      <Users className="h-2.5 w-2.5" /> {membersByRole[r.id] || 0}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCESS_MODULES.map(group => (
                <React.Fragment key={group.group}>
                  <tr>
                    <td colSpan={ACCESS_ROLES.length + 1} className="bg-slate-50/40 px-5 pb-1.5 pt-4 font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700 dark:bg-transparent dark:text-gold-300">
                      {group.group}
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.key} className="border-t border-slate-100 transition-colors hover:bg-gold-500/[0.03] dark:border-white/[0.04]">
                      <td className="sticky left-0 z-10 bg-white px-5 py-2.5 dark:bg-[#0c1322]">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</div>
                        {item.hint && <div className="text-[11px] text-slate-400">{item.hint}</div>}
                      </td>
                      {ACCESS_ROLES.map(r => {
                        const on = !!draft[r.id]?.[item.key];
                        return (
                          <td key={r.id} className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={on}
                              aria-label={`${item.label} para ${r.label}`}
                              onClick={() => toggle(r.id, item.key)}
                              disabled={!canEdit}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                                on ? 'bg-gold-500' : 'bg-slate-200 dark:bg-white/[0.1]'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {canEdit ? <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
        <span>
          {canEdit
            ? 'Ao salvar, o menu e as telas de cada pessoa passam a seguir esta tabela. Quem estiver com o sistema aberto vê a mudança ao recarregar a página.'
            : 'Somente quem tem acesso às Configurações do escritório pode alterar esta tabela.'}
        </span>
      </div>
    </div>
  );
}

// Tabela completa (cargo × módulo) a partir do que foi salvo, completando com o padrão
function buildDraft(saved) {
  return Object.fromEntries(ACCESS_ROLES.map(r => [
    r.id,
    Object.fromEntries(Object.keys(DEFAULT_ROLE_MATRIX[r.id]).map(k => [k, roleAllows(saved, r.id, k)])),
  ]));
}
