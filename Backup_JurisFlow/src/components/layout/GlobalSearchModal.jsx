import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Users, FileText, Briefcase, CheckSquare, X, ArrowRight } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatCPF, formatCNJProcessNumber } from '../../utils/formatters';

export function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const { clients, leads, contracts, proposals, processes, tasks } = useCRM();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Filtrar em todas as entidades
  const matchedClients = cleanQuery ? clients.filter(c => 
    c.name.toLowerCase().includes(cleanQuery) || 
    (c.cpf && c.cpf.includes(cleanQuery)) || 
    (c.email && c.email.toLowerCase().includes(cleanQuery)) ||
    (c.city && c.city.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : [];

  const matchedLeads = cleanQuery ? leads.filter(l => 
    l.name.toLowerCase().includes(cleanQuery) || 
    (l.email && l.email.toLowerCase().includes(cleanQuery)) ||
    (l.phone && l.phone.includes(cleanQuery)) ||
    (l.legalArea && l.legalArea.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : [];

  const matchedContracts = cleanQuery ? contracts.filter(cnt => 
    cnt.contractNumber.toLowerCase().includes(cleanQuery) ||
    cnt.clientName.toLowerCase().includes(cleanQuery) ||
    cnt.title.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchedProposals = cleanQuery ? proposals.filter(p => 
    p.proposalNumber.toLowerCase().includes(cleanQuery) ||
    (p.clientName && p.clientName.toLowerCase().includes(cleanQuery)) ||
    p.serviceName.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchedProcesses = cleanQuery ? processes.filter(pr => 
    pr.processNumber.toLowerCase().includes(cleanQuery) ||
    pr.clientName.toLowerCase().includes(cleanQuery) ||
    pr.court.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchedTasks = cleanQuery ? tasks.filter(t => 
    t.title.toLowerCase().includes(cleanQuery) ||
    t.description.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const totalResults = matchedClients.length + matchedLeads.length + matchedContracts.length + matchedProposals.length + matchedProcesses.length + matchedTasks.length;

  const handleSelect = (view, payload) => {
    onNavigate(view, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
        {/* Search input header */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por clientes, leads, contratos, processos, CPF, CNPJ..."
            className="w-full py-4 text-base bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</span>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!cleanQuery && (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>Digite um nome, telefone, CPF, número de contrato ou processo para buscar.</p>
              <div className="mt-3 flex justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">💡 Dica: "Renata"</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">"Trabalhista"</span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">"CTR-2026"</span>
              </div>
            </div>
          )}

          {cleanQuery && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Nenhum resultado encontrado para "{query}".
            </div>
          )}

          {/* Clientes */}
          {matchedClients.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-brand-500" /> Clientes ({matchedClients.length})
              </div>
              <div className="space-y-1">
                {matchedClients.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelect('clients', { clientId: c.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {c.cpf ? `CPF: ${formatCPF(c.cpf)}` : c.cnpj} • {c.city}/{c.state} • Contratado: {formatCurrency(c.totalContracted)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {matchedLeads.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-500" /> Leads / CRM ({matchedLeads.length})
              </div>
              <div className="space-y-1">
                {matchedLeads.map(l => (
                  <div
                    key={l.id}
                    onClick={() => handleSelect('leads', { leadId: l.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{l.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Área: {l.legalArea} • Estágio: {l.stage.replace('_', ' ')} • Potencial: {formatCurrency(l.estimatedValue)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contratos */}
          {matchedContracts.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-500" /> Contratos ({matchedContracts.length})
              </div>
              <div className="space-y-1">
                {matchedContracts.map(cnt => (
                  <div
                    key={cnt.id}
                    onClick={() => handleSelect('contracts', { contractId: cnt.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{cnt.contractNumber} — {cnt.clientName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {cnt.title} • {formatCurrency(cnt.value)} • Status: {cnt.status}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processos */}
          {matchedProcesses.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-purple-500" /> Processos Judiciais ({matchedProcesses.length})
              </div>
              <div className="space-y-1">
                {matchedProcesses.map(pr => (
                  <div
                    key={pr.id}
                    onClick={() => handleSelect('processes', { processId: pr.id })}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{formatCNJProcessNumber(pr.processNumber)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Cliente: {pr.clientName} • {pr.court}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
