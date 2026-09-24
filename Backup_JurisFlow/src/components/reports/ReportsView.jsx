import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Scale,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportService } from '../../services/exportService';

export function ReportsView() {
  const [reportType, setReportType] = useState('comercial'); // 'comercial' | 'contratos' | 'clientes' | 'financeiro'
  const { leads, contracts, clients, installments, legalAreas, leadSources } = useCRM();

  const handleExportCSV = () => {
    if (reportType === 'comercial') {
      const headers = [
        { key: 'name', label: 'Nome do Lead' },
        { key: 'legalArea', label: 'Área Jurídica' },
        { key: 'source', label: 'Origem' },
        { key: 'stage', label: 'Estágio do Funil' },
        { key: 'estimatedValue', label: 'Valor Estimado (R$)' },
        { key: 'temperature', label: 'Temperatura' },
        { key: 'firstContactDate', label: 'Data do 1º Contato' },
      ];
      exportService.exportToCSV('Relatorio_Comercial_Leads', leads, headers);
    } else if (reportType === 'contratos') {
      const headers = [
        { key: 'contractNumber', label: 'Nº Contrato' },
        { key: 'clientName', label: 'Cliente' },
        { key: 'legalArea', label: 'Área' },
        { key: 'value', label: 'Valor (R$)' },
        { key: 'status', label: 'Status' },
        { key: 'signedDate', label: 'Data Assinatura' },
      ];
      exportService.exportToCSV('Relatorio_Contratos_Honorarios', contracts, headers);
    } else if (reportType === 'clientes') {
      const headers = [
        { key: 'name', label: 'Nome do Cliente' },
        { key: 'cpf', label: 'Documento', formatter: (v, r) => r.cpf || r.cnpj },
        { key: 'city', label: 'Cidade' },
        { key: 'legalArea', label: 'Área' },
        { key: 'totalContracted', label: 'Total Contratado (R$)' },
        { key: 'status', label: 'Status' },
      ];
      exportService.exportToCSV('Relatorio_Base_Clientes', clients, headers);
    } else {
      const headers = [
        { key: 'clientName', label: 'Cliente' },
        { key: 'number', label: 'Parcela', formatter: (v, r) => `${v}/${r.totalInstallments}` },
        { key: 'amount', label: 'Valor (R$)' },
        { key: 'dueDate', label: 'Vencimento' },
        { key: 'paymentDate', label: 'Data Pagamento' },
        { key: 'status', label: 'Status' },
      ];
      exportService.exportToCSV('Relatorio_Financeiro_Geral', installments, headers);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'comercial') {
      const headers = [
        { key: 'name', label: 'Nome do Lead' },
        { key: 'legalArea', label: 'Área Jurídica' },
        { key: 'source', label: 'Origem' },
        { key: 'stage', label: 'Estágio do Funil' },
        { key: 'estimatedValue', label: 'Valor Estimado', formatter: (v) => formatCurrency(v) },
        { key: 'firstContactDate', label: '1º Contato', formatter: (v) => formatDate(v) },
      ];
      exportService.exportToExcel('Relatorio_Comercial_Leads', leads, headers);
    } else if (reportType === 'contratos') {
      const headers = [
        { key: 'contractNumber', label: 'Nº Contrato' },
        { key: 'clientName', label: 'Cliente' },
        { key: 'value', label: 'Honorários', formatter: (v) => formatCurrency(v) },
        { key: 'status', label: 'Status' },
        { key: 'signedDate', label: 'Assinado em', formatter: (v) => formatDate(v) },
      ];
      exportService.exportToExcel('Relatorio_Contratos', contracts, headers);
    } else if (reportType === 'clientes') {
      const headers = [
        { key: 'name', label: 'Cliente' },
        { key: 'city', label: 'Cidade' },
        { key: 'legalArea', label: 'Área' },
        { key: 'totalContracted', label: 'Contratado', formatter: (v) => formatCurrency(v) },
      ];
      exportService.exportToExcel('Relatorio_Clientes', clients, headers);
    } else {
      const headers = [
        { key: 'clientName', label: 'Cliente' },
        { key: 'amount', label: 'Valor', formatter: (v) => formatCurrency(v) },
        { key: 'dueDate', label: 'Vencimento', formatter: (v) => formatDate(v) },
        { key: 'status', label: 'Status' },
      ];
      exportService.exportToExcel('Relatorio_Financeiro', installments, headers);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Central de Relatórios & Inteligência de Negócios
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Geração de relatórios executivos com exportação em múltiplos formatos (PDF, Excel, CSV)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel (.xls)
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-brand-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'comercial', label: '1. Relatório Comercial & Leads', icon: TrendingUp },
          { id: 'contratos', label: '2. Relatório de Contratos & Honorários', icon: FileText },
          { id: 'clientes', label: '3. Relatório da Base de Clientes', icon: UserCheck },
          { id: 'financeiro', label: '4. Relatório Financeiro & Receitas', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Report Content Table */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm overflow-hidden printable-document">
        {reportType === 'comercial' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstrativo de Leads Captados e Funil Comercial
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Área</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Estágio</th>
                    <th className="px-4 py-3">Valor Estimado</th>
                    <th className="px-4 py-3">1º Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leads.map(l => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-bold">{l.name}</td>
                      <td className="px-4 py-3">{l.legalArea}</td>
                      <td className="px-4 py-3">{l.source}</td>
                      <td className="px-4 py-3 capitalize">{l.stage.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-600">{formatCurrency(l.estimatedValue)}</td>
                      <td className="px-4 py-3">{formatDate(l.firstContactDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'contratos' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstrativo de Contratos de Honorários Advocatícios
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nº Contrato</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Área Jurídica</th>
                    <th className="px-4 py-3">Honorários Contratados</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Data de Assinatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {contracts.map(cnt => (
                    <tr key={cnt.id}>
                      <td className="px-4 py-3 font-bold text-brand-600">{cnt.contractNumber}</td>
                      <td className="px-4 py-3 font-semibold">{cnt.clientName}</td>
                      <td className="px-4 py-3">{cnt.legalArea}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-600">{formatCurrency(cnt.value)}</td>
                      <td className="px-4 py-3 capitalize">{cnt.status}</td>
                      <td className="px-4 py-3">{formatDate(cnt.signedDate || cnt.createdDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'clientes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstrativo da Base de Clientes Cadastrados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Cidade / UF</th>
                    <th className="px-4 py-3">Área Jurídica</th>
                    <th className="px-4 py-3">Total Contratado</th>
                    <th className="px-4 py-3">Total Liquidado</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {clients.map(cli => (
                    <tr key={cli.id}>
                      <td className="px-4 py-3 font-bold">{cli.name}</td>
                      <td className="px-4 py-3">{cli.city}/{cli.state}</td>
                      <td className="px-4 py-3">{cli.legalArea}</td>
                      <td className="px-4 py-3 font-bold">{formatCurrency(cli.totalContracted)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(cli.totalPaid)}</td>
                      <td className="px-4 py-3 capitalize">{cli.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'financeiro' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Demonstrativo Financeiro de Parcelas e Recebimentos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Parcela</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {installments.map(inst => (
                    <tr key={inst.id}>
                      <td className="px-4 py-3 font-bold">{inst.clientName}</td>
                      <td className="px-4 py-3">{inst.number} / {inst.totalInstallments}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-600">{formatCurrency(inst.amount)}</td>
                      <td className="px-4 py-3">{formatDate(inst.dueDate)}</td>
                      <td className="px-4 py-3 capitalize">{inst.status === 'paid' ? 'Liquidado' : 'Pendente'}</td>
                      <td className="px-4 py-3">{formatDate(inst.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
