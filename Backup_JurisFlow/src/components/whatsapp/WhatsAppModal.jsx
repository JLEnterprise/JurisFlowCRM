import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { whatsappService } from '../../services/whatsappService';
import {
  MessageSquare,
  Send,
  Gavel,
  Calendar,
  FileText,
  FileCheck,
  Bell,
  Coins,
  Copy,
  Check,
  Sparkles,
  Phone,
} from 'lucide-react';

export function WhatsAppModal({ isOpen, onClose, initialData = {} }) {
  const [phone, setPhone] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('lembrete_audiencia');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultPhone = initialData.phone || initialData.telefone || '';
      setPhone(defaultPhone);

      const template = whatsappService.templates.find(t => t.id === (initialData.templateId || 'lembrete_audiencia')) || whatsappService.templates[0];
      setSelectedTemplateId(template.id);

      const generated = template.generate({
        clientName: initialData.clientName || initialData.name || 'Cliente',
        date: initialData.date || new Date().toLocaleDateString('pt-BR'),
        time: initialData.time || '14:00',
        location: initialData.location || 'Fórum da Comarca / Sala Virtual',
        virtualLink: initialData.virtualLink || '',
        legalArea: initialData.legalArea || 'Direito Civil / Trabalhista',
        value: initialData.value || 0,
        signatureLink: initialData.signatureLink || 'https://jurisflowcrmofc.netlify.app',
        processNumber: initialData.processNumber || '',
        updateSummary: initialData.updateSummary || 'Decisão proferida pelo magistrado.',
        dueDate: initialData.dueDate || new Date().toLocaleDateString('pt-BR'),
        pixKey: initialData.pixKey || 'pix@escritorioadv.com.br',
        officeName: initialData.officeName || 'JurisFlow Advocacia & Consultoria',
      });

      setMessageText(generated);
    }
  }, [isOpen, initialData]);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = whatsappService.templates.find(t => t.id === templateId);
    if (template) {
      const generated = template.generate({
        clientName: initialData.clientName || initialData.name || 'Cliente',
        date: initialData.date || new Date().toLocaleDateString('pt-BR'),
        time: initialData.time || '14:00',
        location: initialData.location || 'Fórum da Comarca / Sala Virtual',
        virtualLink: initialData.virtualLink || '',
        legalArea: initialData.legalArea || 'Direito Civil / Trabalhista',
        value: initialData.value || 0,
        signatureLink: initialData.signatureLink || 'https://jurisflowcrmofc.netlify.app',
        processNumber: initialData.processNumber || '',
        updateSummary: initialData.updateSummary || 'Decisão proferida pelo magistrado.',
        dueDate: initialData.dueDate || new Date().toLocaleDateString('pt-BR'),
        pixKey: initialData.pixKey || 'pix@escritorioadv.com.br',
        officeName: initialData.officeName || 'JurisFlow Advocacia & Consultoria',
      });
      setMessageText(generated);
    }
  };

  const handleSend = () => {
    if (!phone.trim()) {
      alert('Por favor, informe o número de WhatsApp com DDD.');
      return;
    }
    whatsappService.openWhatsApp(phone, messageText);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTemplateIcon = (id) => {
    switch (id) {
      case 'lembrete_audiencia': return <Gavel className="h-3.5 w-3.5 text-purple-500" />;
      case 'lembrete_reuniao': return <Calendar className="h-3.5 w-3.5 text-blue-500" />;
      case 'envio_proposta': return <FileText className="h-3.5 w-3.5 text-amber-500" />;
      case 'assinatura_contrato': return <FileCheck className="h-3.5 w-3.5 text-emerald-500" />;
      case 'andamento_processual': return <Bell className="h-3.5 w-3.5 text-brand-500" />;
      case 'cobranca_elegante': return <Coins className="h-3.5 w-3.5 text-teal-500" />;
      default: return <MessageSquare className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disparo de WhatsApp & Notificações"
      subtitle="Envie atualizações, lembretes de audiência e contratos formatados para o cliente"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Telefone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Número do WhatsApp do Destinatário *
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (11) 99876-5432"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Templates Rápidos */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Modelos de Mensagem Jurídica:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {whatsappService.templates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {getTemplateIcon(tpl.id)}
                  <span className="truncate">{tpl.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mensagem Preview & Edição */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Texto da Mensagem (Você pode personalizar antes de enviar):
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:underline"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>
          <textarea
            rows={7}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 p-3 text-xs text-slate-900 dark:text-white font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-emerald-600 transition-all btn-tactile"
          >
            <Send className="h-4 w-4" />
            Abrir e Enviar no WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
}
