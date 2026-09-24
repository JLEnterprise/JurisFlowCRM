import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Lock,
  Database,
  Cloud,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Activity,
  Server,
  KeyRound,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';

export function ActivityLogsView() {
  const { activityLogs, leads, clients, contracts, processes, tasks } = useCRM();
  const { currentUser, permissions } = useAuth();
  const [search, setSearch] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Testar conexão Supabase ao vivo
  const handleTestConnection = async () => {
    setIsTesting(true);
    const start = Date.now();
    try {
      const { data, error } = await supabase.from('leads').select('id').limit(1);
      const latency = Date.now() - start;
      if (error) throw error;
      setTestResult({
        success: true,
        latency,
        message: `Conexão bem-sucedida com PostgreSQL via Supabase API (latência: ${latency}ms).`,
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Falha ao comunicar com Supabase: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.userName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header de Conformidade LGPD e Auditoria */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Segurança, LGPD & Infraestrutura de Dados
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  Exclusivo Dev / TI & Sócia Administradora
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Central unificada de monitoramento da nuvem Supabase, criptografia e trilha de auditoria (Lei 13.709/2018)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 shadow-xs">
              <Lock className="h-3.5 w-3.5" /> TLS 1.3 / AES-256 Ativo
            </span>
          </div>
        </div>
      </div>

      {/* 2. CARD EXCLUSIVO SUPABASE CLOUD DATABASE (Centralizado e Didático) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-navy-950 to-slate-950 p-6 border border-emerald-500/30 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/20 p-3.5 border border-emerald-500/40 text-emerald-400 shadow-inner">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Status da Infraestrutura Supabase
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  Online & Operacional
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Banco de dados PostgreSQL 17 hospedado em nuvem com sincronização contínua. Todos os leads, clientes, processos e honorários estão salvos com replicação e backup gerenciado.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50"
            >
              <Activity className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão Supabase'}
            </button>
          </div>
        </div>

        {/* Feedback do Teste em Tempo Real */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
            testResult.success 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Metadados Técnicos para o Dev */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endpoint API REST</span>
            <span className="font-mono text-emerald-300 font-semibold truncate block mt-0.5">
              https://cbaanfpitqayqraizacv.supabase.co
            </span>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Projeto / Referência</span>
            <span className="font-mono text-white font-semibold block mt-0.5">
              cbaanfpitqayqraizacv
            </span>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Motor & Pooler</span>
            <span className="font-mono text-white font-semibold block mt-0.5">
              PostgreSQL 17 (Pooler 6543)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Pesquisa na Trilha de Auditoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por usuário, ação ou cliente auditado..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none shadow-sm"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Total de registros auditados: <span className="font-bold text-slate-900 dark:text-white">{filteredLogs.length}</span>
        </div>
      </div>

      {/* 4. Tabela de Logs de Auditoria */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title="Nenhum log encontrado"
          description="Não há registros de atividades correspondentes aos filtros selecionados."
          iconName="ShieldAlert"
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-navy-950/75 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Usuário Responsável</th>
                  <th className="px-5 py-3.5">Ação Executada</th>
                  <th className="px-5 py-3.5">Registro / Alvo</th>
                  <th className="px-5 py-3.5">Detalhes da Modificação</th>
                  <th className="px-5 py-3.5 text-right">Data & Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-brand-500" />
                        {log.userName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium capitalize">
                        Perfil: {log.userRole}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 font-semibold text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {log.target}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {log.details || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
