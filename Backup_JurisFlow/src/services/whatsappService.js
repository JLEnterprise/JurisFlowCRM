// ==============================================================================
// JURISFLOW WHATSAPP ENGINE - DISPARO E TEMPLATES JURÍDICOS
// ==============================================================================

export const whatsappService = {
  /**
   * Limpa e padroniza o número de telefone para o formato internacional E.164 (BR)
   */
  formatPhone(phone) {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return digits;
    }
    return digits;
  },

  /**
   * Gera o link do WhatsApp para abrir diretamente no app ou navegador
   */
  createWhatsAppLink(phone, message) {
    const formattedPhone = this.formatPhone(phone);
    const encodedMessage = encodeURIComponent(message || '');
    if (!formattedPhone) {
      return `https://wa.me/?text=${encodedMessage}`;
    }
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  },

  /**
   * Abre o WhatsApp com a mensagem em uma nova aba
   */
  openWhatsApp(phone, message) {
    const link = this.createWhatsAppLink(phone, message);
    window.open(link, '_blank', 'noopener,noreferrer');
  },

  /**
   * Templates Jurídicos Padronizados
   */
  templates: [
    {
      id: 'lembrete_audiencia',
      title: 'Lembrete de Audiência',
      category: 'Agenda & Prazos',
      icon: 'Gavel',
      generate: (data) => `⚖️ *LEMBRETE IMPORTANTE DE AUDIÊNCIA* ⚖️\n\nOlá, *${data.clientName || 'Cliente'}*!\n\nPassando para confirmar sua audiência designada para:\n📅 *Data:* ${data.date || '[DATA]'}\n⏰ *Horário:* ${data.time || '[HORA]'}\n🏛️ *Local/Vara:* ${data.location || 'Vara do Trabalho / Cível'}\n\n${data.virtualLink ? `🔗 *Link da Sala Virtual:* ${data.virtualLink}\n\n` : ''}💡 *Recomendações:* Favor entrar com 15 minutos de antecedência e estar com documento oficial com foto (RG/CNH).\n\nQualquer dúvida, estamos à disposição!\n*${data.officeName || 'Equipe Jurídica'}*`
    },
    {
      id: 'lembrete_reuniao',
      title: 'Confirmação de Reunião / Consulta',
      category: 'Atendimento',
      icon: 'Calendar',
      generate: (data) => `👋 Olá, *${data.clientName || 'Cliente'}*!\n\nTudo bem? Confirmamos nossa reunião de alinhamento jurídico:\n\n📅 *Data:* ${data.date || '[DATA]'}\n⏰ *Horário:* ${data.time || '[HORA]'}\n📍 *Formato:* ${data.format || 'Videoconferência / Presencial'}\n\nNos vemos em breve!\n*${data.officeName || 'Equipe Jurídica'}*`
    },
    {
      id: 'envio_proposta',
      title: 'Envio de Proposta de Honorários',
      category: 'Comercial',
      icon: 'FileText',
      generate: (data) => `📄 *PROPOSTA DE HONORÁRIOS JURÍDICOS* 📄\n\nOlá, *${data.clientName || 'Prezado(a)'}*!\n\nConforme conversamos, preparamos uma proposta personalizada para atendimento da sua demanda jurídica na área de *${data.legalArea || 'Direito'}*.\n\n💰 *Valor Global:* R$ ${Number(data.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nEstamos à disposição para esclarecer qualquer ponto e darmos início à atuação.\n\n*${data.officeName || 'Equipe Jurídica'}*`
    },
    {
      id: 'assinatura_contrato',
      title: 'Envio de Contrato para Assinatura',
      category: 'Contratos',
      icon: 'FileCheck',
      generate: (data) => `✍️ *CONTRATO DISPONÍVEL PARA ASSINATURA* ✍️\n\nOlá, *${data.clientName || 'Cliente'}*!\n\nSeu Contrato de Prestação de Serviços Advocatícios já está pronto para assinatura digital com validade jurídica.\n\n📲 *Você pode assinar pelo celular no link abaixo:*\n${data.signatureLink || 'https://jurisflowcrmofc.netlify.app'}\n\nAssim que assinado, daremos andamento imediato aos procedimentos.\n\n*${data.officeName || 'Equipe Jurídica'}*`
    },
    {
      id: 'andamento_processual',
      title: 'Atualização de Andamento do Processo',
      category: 'Processos',
      icon: 'Bell',
      generate: (data) => `🔔 *ATUALIZAÇÃO DO SEU PROCESSO* 🔔\n\nOlá, *${data.clientName || 'Cliente'}*!\n\nInformamos que seu processo nº *${data.processNumber || '[NÚMERO]'}* teve uma nova movimentação:\n\n📌 *Resumo:* ${data.updateSummary || 'Movimentação processual registrada nos autos.'}\n\nNossa equipe já está tomando as providências necessárias. Você pode ficar tranquilo(a)!\n\n*${data.officeName || 'Equipe Jurídica'}*`
    },
    {
      id: 'cobranca_elegante',
      title: 'Lembrete de Parcela / Honorários',
      category: 'Financeiro',
      icon: 'Coins',
      generate: (data) => `💳 *LEMBRETE DE HONORÁRIOS ADVOCATÍCIOS* 💳\n\nOlá, *${data.clientName || 'Cliente'}*!\n\nEsperamos que esteja tudo bem. Passando para lembrar sobre a parcela referente aos serviços jurídicos:\n\n💵 *Valor:* R$ ${Number(data.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📅 *Vencimento:* ${data.dueDate || '[DATA]'}\n\n🔑 *Chave PIX:* ${data.pixKey || '[CHAVE PIX DO ESCRITÓRIO]'}\n\nCaso já tenha efetuado o pagamento, por favor desconsidere esta mensagem. Obrigado!\n*${data.officeName || 'Departamento Financeiro'}*`
    }
  ]
};
