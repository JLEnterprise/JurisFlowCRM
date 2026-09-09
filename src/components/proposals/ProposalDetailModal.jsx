import React from 'react';
import {
  FileCheck2,
  X,
  Printer,
  Edit,
  Trash2,
  Copy,
  Sparkles,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { pdfService } from '../../services/pdfService';
import { useCRM } from '../../context/CRMContext';

export function ProposalDetailModal({
  isOpen,
  onClose,
  proposal,
  onEdit,
  onConvertToContract,
  onRequestDelete,
}) {
  const { officeSettings = {}, updateProposal, showToast } = useCRM();

  if (!isOpen || !proposal) return null;

  const propNumber = proposal.proposalNumber || proposal.proposal_number || 'PROP-2026/S/N';
  const clientName = proposal.clientName || proposal.client_name || proposal.leadName || proposal.lead_name || 'Cliente';
  const serviceName = proposal.serviceName || proposal.service_name || proposal.title || 'Honorários Advocatícios';
  const legalArea = proposal.legalArea || proposal.legal_area || 'civil';
  const value = Number(proposal.value || proposal.feeValue) || 0;
  const status = proposal.status || 'rascunho';
  const description = proposal.description || proposal.notes || 'Sem descrição cadastrada.';
  const paymentTerms = proposal.paymentTerms || proposal.payment_terms || 'À vista ou parcelado a combinar';
  const validityDate = proposal.validityDate || proposal.validity_date;
  const sentDate = proposal.sentDate || proposal.sent_date || proposal.created_at;
  const successFee = Number(proposal.successFeePercent || proposal.success_fee_percent) || 0;

  const getStatusBadge = (st) => {
    switch (String(st).toLowerCase()) {
      case 'aceita':
      case 'accepted':
        return <Badge variant="success">Proposta Aceita</Badge>;
      case 'em_negociacao':
      case 'negotiating':
        return <Badge variant="warning">Em Negociação</Badge>;
      case 'recusada':
      case 'rejected':
        return <Badge variant="danger">Recusada</Badge>;
      default:
        return <Badge variant="default">Rascunho / Em Análise</Badge>;
    }
  };

  const handlePrint = () => {
    pdfService.printProposal(proposal, officeSettings);
  };

  const handleMarkAccepted = () => {
    updateProposal(proposal.id, { status: 'aceita' });
    showToast('Proposta marcada como Aceita! Contrato gerado automaticamente.');
    onClose();
  };

  const handleCopySummary = () => {
    const text = `PROPOSTA COMERCIAL: ${propNumber}\nCliente: ${clientName}\nServiço: ${serviceName}\nValor: ${formatCurrency(value)}\nCondições: ${paymentTerms}\nStatus: ${status}`;
    navigator.clipboard?.writeText(text);
    showToast('Resumo da proposta copiado para a área de transferência!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Proposta Comercial ${propNumber}`}
      subtitle="Detalhamento técnico da proposta de honorários e escopo de atuação jurídica"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Status and Primary Highlight Card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/30 dark:from-navy-950 dark:to-brand-950/20 p-4 border border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-brand-600 dark:text-gold-400">
                {propNumber}
              </span>
              {getStatusBadge(status)}
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {serviceName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contratante: <strong className="text-slate-700 dark:text-slate-200">{clientName}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right bg-white dark:bg-navy-900 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.06] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Valor da Proposta
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(value)}
            </span>
            {successFee > 0 && (
              <span className="block text-[10px] font-bold text-amber-600 dark:text-gold-400">
                + {successFee}% taxa de êxito
              </span>
            )}
          </div>
        </div>

        {/* Informações Estruturadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Briefcase className="h-3.5 w-3.5 text-brand-600 dark:text-gold-400" />
              Área de Atuação
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">
              {legalArea}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Condições de Pagamento
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {paymentTerms}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Data de Envio / Elaboração
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {formatDate(sentDate)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-white/[0.04] space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-gold-400" />
              Validade da Proposta
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {validityDate ? formatDate(validityDate) : '15 dias após o envio'}
            </div>
          </div>
        </div>

        {/* Escopo do Serviço */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-4 bg-white dark:bg-navy-900 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Escopo dos Serviços Jurídicos & Objeto
          </h4>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {description}
          </p>
        </div>

        {/* Rodapé de Ações */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Visualizar e Imprimir Minuta em PDF"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir Minuta
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Copiar dados"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar Resumo
            </button>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(proposal);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Editar proposta"
              >
                <Edit className="h-3.5 w-3.5" /> Editar
              </button>
            )}

            {onRequestDelete && (
              <button
                onClick={() => {
                  onClose();
                  onRequestDelete(proposal);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                title="Excluir proposta"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status !== 'aceita' && (
              <button
                onClick={handleMarkAccepted}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-emerald-600/20 transition-all btn-tactile"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Aceitar Proposta
              </button>
            )}

            {onConvertToContract && (
              <button
                onClick={() => {
                  onClose();
                  onConvertToContract(proposal);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white px-4 py-2 text-xs font-bold shadow-md shadow-brand-600/25 transition-all btn-tactile"
              >
                <Sparkles className="h-3.5 w-3.5" /> Gerar Contrato
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
