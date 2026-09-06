import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useCRM } from '../../context/CRMContext';
import { signatureService } from '../../services/signatureService';
import { whatsappService } from '../../services/whatsappService';
import {
  FileCheck,
  ShieldCheck,
  Send,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  QrCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export function SignatureModal({ isOpen, onClose, contract = null }) {
  const { updateContract, showToast, triggerConfetti, logActivity } = useCRM();

  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signatureDone, setSignatureDone] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  React.useEffect(() => {
    if (contract && isOpen) {
      setSignerName(contract.clientName || 'Cliente');
      setSignerEmail(contract.clientEmail || 'cliente@email.com');
      setSignerDocument(contract.clientDocument || contract.document || '000.000.000-00');
      setSignatureDone(null);
    }
  }, [contract, isOpen]);

  const signLink = contract ? signatureService.generateSignLink(contract.id) : '';

  const handleExecuteSign = () => {
    if (!signerName.trim()) {
      alert('Informe o nome completo do signatário.');
      return;
    }

    setIsSigning(true);
    setTimeout(() => {
      const record = signatureService.createSignatureRecord({
        contractId: contract.id,
        clientName: signerName,
        clientEmail: signerEmail,
        clientDocument: signerDocument,
      });

      setSignatureDone(record);
      setIsSigning(false);

      if (typeof updateContract === 'function') {
        updateContract(contract.id, {
          status: 'assinado',
          signedAt: record.signedAt,
          signatureData: record,
        });
      }

      triggerConfetti();
      logActivity('Contrato Assinado Digitalmente', contract.title, `Hash: ${record.legalCompliance.sha256Hash.substring(0, 16)}...`);
      showToast('Contrato assinado digitalmente com validade jurídica!');
    }, 500);
  };

  const handleCopySignLink = () => {
    navigator.clipboard.writeText(signLink);
    setCopiedLink(true);
    showToast('Link de assinatura copiado!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendLinkWhatsApp = () => {
    const msg = whatsappService.templates.find(t => t.id === 'assinatura_contrato')?.generate({
      clientName: signerName,
      signatureLink: signLink,
      officeName: 'JurisFlow Advocacia & Consultoria',
    }) || `Olá, ${signerName}! Seu contrato está pronto para assinatura digital no link: ${signLink}`;

    whatsappService.openWhatsApp(contract?.clientPhone || '', msg);
  };

  if (!contract) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assinatura Eletrônica com Validade Jurídica"
      subtitle="Conformidade integral com a MP nº 2.200-2/2001 e Lei Federal nº 14.063/2020"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Detalhes do Contrato */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {contract.title || 'Contrato de Prestação de Serviços'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Valor: R$ {Number(contract.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Área: {contract.legalArea || 'Geral'}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> ICP-Brasil Ready
          </span>
        </div>

        {!signatureDone ? (
          <div className="space-y-4">
            {/* Opção 1: Enviar Link para o Cliente Assinar */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                Opção 1: Enviar Link para o Cliente Assinar no Celular / WhatsApp
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                O cliente receberá um link seguro onde poderá ler o contrato e assinar na tela pelo smartphone.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySignLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? 'Link Copiado!' : 'Copiar Link de Assinatura'}
                </button>

                <button
                  type="button"
                  onClick={handleSendLinkWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" /> Enviar Link pelo WhatsApp
                </button>
              </div>
            </div>

            {/* Opção 2: Coletar Assinatura Agora no Escritório */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Opção 2: Coletar Assinatura Presencial / Imediata:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nome Completo do Signatário *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    value={signerDocument}
                    onChange={(e) => setSignerDocument(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Lock className="h-4 w-4 text-brand-500 shrink-0" />
                <span>
                  A assinatura registrará o IP, carimbo de data/hora UTC e gerará um Hash Criptográfico SHA-256 com validade jurídica perante os tribunais.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSigning}
                  onClick={handleExecuteSign}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-brand-500 hover:to-brand-600 transition-all btn-tactile"
                >
                  <FileCheck className="h-4 w-4" />
                  {isSigning ? 'Processando Assinatura...' : 'Assinar Digitalmente Agora'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Recibo / Certificado de Assinatura Concluída */
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2.5 border-b border-emerald-200 dark:border-emerald-800 pb-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Documento Assinado Digitalmente com Sucesso!
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90">
                  Certificado de Autenticidade emitido nos termos da Lei 14.063/2020.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] text-slate-400 font-bold block">Signatário:</span>
                <span className="font-bold text-slate-900 dark:text-white">{signatureDone.signer.name}</span>
                <span className="text-[10px] text-slate-500 block">Doc: {signatureDone.signer.document}</span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-navy-900 border border-emerald-100 dark:border-emerald-900">
                <span className="text-[10px] text-slate-400 font-bold block">Data e Hora da Assinatura:</span>
                <span className="font-bold text-slate-900 dark:text-white">{new Date(signatureDone.signedAt).toLocaleString('pt-BR')}</span>
                <span className="text-[10px] text-slate-500 block">IP: {signatureDone.signer.ipAddress}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-emerald-100 dark:border-emerald-900 text-[10px] font-mono break-all text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 font-bold block">Hash Criptográfico SHA-256:</span>
              {signatureDone.legalCompliance.sha256Hash}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-emerald-600 text-white px-5 py-2 text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
