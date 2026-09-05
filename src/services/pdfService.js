import { formatCurrency, formatDate, formatCPF, formatCNPJ } from '../utils/formatters';

export const pdfService = {
  printContract(contract = {}, client = {}, officeSettings = {}) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o contrato.');
      return;
    }

    const contractNumber = contract.contractNumber || contract.contract_number || 'CTR-2026/S/N';
    const clientName = client.name || contract.clientName || contract.client_name || 'Cliente';
    const docNumber = client.cnpj ? `CNPJ nº ${formatCNPJ(client.cnpj)}` : client.cpf ? `CPF nº ${formatCPF(client.cpf)}` : 'Documento não informado';
    const fullAddress = `${client.address || 'Endereço Principal'}, ${client.city || officeSettings?.city || 'São Paulo'} - ${client.state || officeSettings?.state || 'SP'}`;
    const firmName = officeSettings?.officeName || officeSettings?.name || 'JurisFlow Advocacia Estratégica';
    const city = officeSettings?.city || 'São Paulo';
    const state = officeSettings?.state || 'SP';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Contrato de Prestação de Serviços Advocatícios – ${contractNumber}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: "Times New Roman", Times, serif;
            color: #1a1a1a;
            line-height: 1.6;
            font-size: 13pt;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0b3f6d;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .firm-name {
            font-size: 18pt;
            font-weight: bold;
            color: #0b3f6d;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .firm-details {
            font-size: 10pt;
            color: #555;
            margin-top: 5px;
          }
          .title {
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 25px 0;
          }
          .clause {
            margin-bottom: 18px;
            text-align: justify;
          }
          .clause-title {
            font-weight: bold;
          }
          .signatures {
            margin-top: 50px;
            page-break-inside: avoid;
          }
          .sig-row {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
          }
          .sig-block {
            width: 45%;
            text-align: center;
            border-top: 1px solid #333;
            padding-top: 8px;
            font-size: 11pt;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 9pt;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="firm-name">${firmName}</div>
          <div class="firm-details">
            ${officeSettings?.oabSociety ? officeSettings.oabSociety + ' | ' : ''}CNPJ: ${officeSettings?.cnpj || ''}<br>
            ${officeSettings?.address || 'Av. Paulista, 1000'} – ${city}/${state} – Tel: ${officeSettings?.phone || '(11) 99999-9999'}
          </div>
        </div>

        <div class="title">
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS<br>
          <span style="font-size: 11pt; font-weight: normal;">Instrumento Particular nº ${contractNumber}</span>
        </div>

        <div class="clause">
          <strong>CONTRATADA:</strong> ${firmName}, inscrita no CNPJ sob o nº ${officeSettings?.cnpj || 'não informado'}, com sede em ${officeSettings?.address || 'Av. Paulista, 1000'}, ${city}/${state}.<br><br>
          <strong>CONTRATANTE:</strong> ${clientName}, ${docNumber}, residente e domiciliado(a) em ${fullAddress}.
        </div>

        <div class="clause">
          <span class="clause-title">CLÁUSULA PRIMEIRA – DO OBJETO:</span><br>
          O presente instrumento tem por objeto a prestação de serviços advocatícios e consultoria jurídica especializada para <strong>${contract.serviceDescription || contract.title || 'defesa e assessoria dos direitos do(a) CONTRATANTE'}</strong>, na esfera administrativa ou judicial que se fizer necessária.
        </div>

        <div class="clause">
          <span class="clause-title">CLÁUSULA SEGUNDA – DOS HONORÁRIOS E FORMA DE PAGAMENTO:</span><br>
          Pelos serviços ora contratados, o(a) CONTRATANTE pagará à CONTRATADA o valor total líquido de <strong>${formatCurrency(contract.value || 0)}</strong>, a ser adimplido sob a seguinte modalidade: <strong>${contract.paymentMethod || contract.payment_method || 'Conforme acordado'}</strong> (${contract.installmentsCount || contract.installments_count || 1} parcela(s)).
        </div>

        <div class="clause">
          <span class="clause-title">CLÁUSULA TERCEIRA – DAS CUSTAS E DESPESAS:</span><br>
          Todas as despesas processuais, custas de distribuição, taxas judiciárias, certidões cartorárias e emolumentos correrão por conta exclusiva do(a) CONTRATANTE, mediante prévia prestação de contas.
        </div>

        <div class="clause">
          <span class="clause-title">CLÁUSULA QUARTA – DA CONFIDENCIALIDADE E LGPD:</span><br>
          As partes comprometem-se a manter sigilo absoluto sobre todas as informações e dados pessoais compartilhados, em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e ao Código de Ética e Disciplina da OAB.
        </div>

        <div class="clause">
          <span class="clause-title">CLÁUSULA QUINTA – DO FORO:</span><br>
          Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o Foro da Comarca de ${city}/${state}, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </div>

        <p style="margin-top: 30px;">
          E, por estarem justos e contratados, assinam o presente instrumento em 2 (duas) vias de igual teor e forma.
        </p>

        <p style="text-align: right; margin-top: 30px;">
          ${city}, ${formatDate(contract.signedDate || contract.signed_date || contract.createdDate || contract.created_date || new Date().toISOString())}.
        </p>

        <div class="signatures">
          <div class="sig-row">
            <div class="sig-block">
              <strong>${firmName}</strong><br>
              ${contract.responsibleLawyerName || contract.responsible_lawyer_name || 'Advogado(a) Responsável'}<br>
              OAB
            </div>
            <div class="sig-block">
              <strong>${clientName}</strong><br>
              CONTRATANTE<br>
              ${docNumber}
            </div>
          </div>
        </div>

        <div class="footer">
          Documento gerado e autenticado digitalmente pelo JurisFlow CRM – Sistema de Gestão Jurídica.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  printProposal(proposal = {}, officeSettings = {}) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a proposta.');
      return;
    }

    const firmName = officeSettings?.officeName || officeSettings?.name || 'JurisFlow Advocacia Estratégica';
    const propNumber = proposal.proposalNumber || proposal.proposal_number || 'PROP-2026/S/N';
    const clientName = proposal.clientName || proposal.client_name || proposal.leadName || proposal.lead_name || 'Cliente';
    const feeValue = proposal.feeValue || proposal.value || 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial de Serviços Jurídicos – ${propNumber}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            font-size: 11pt;
            margin: 0;
            padding: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0c8de3;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .firm-title {
            font-size: 16pt;
            font-weight: 800;
            color: #0b3f6d;
          }
          .prop-badge {
            background: #e0effe;
            color: #02589e;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 10pt;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
          }
          .card-title {
            font-weight: bold;
            color: #0c8de3;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 10pt;
            letter-spacing: 0.5px;
          }
          .price-box {
            background: #0b3f6d;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 25px 0;
          }
          .price-val {
            font-size: 24pt;
            font-weight: 800;
            color: #fbbf24;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="firm-title">${firmName}</div>
            <div style="font-size: 9pt; color: #64748b;">${officeSettings?.address || 'Av. Paulista, 1000'} – ${officeSettings?.phone || '(11) 99999-9999'}</div>
          </div>
          <div class="prop-badge">PROPOSTA Nº ${propNumber}</div>
        </div>

        <p><strong>A/C:</strong> ${clientName}</p>
        <p><strong>Data de Emissão:</strong> ${formatDate(proposal.createdAt || new Date().toISOString())} | <strong>Validade:</strong> ${formatDate(proposal.validityDate || new Date().toISOString())}</p>

        <div class="card">
          <div class="card-title">1. Objeto e Escopo dos Serviços</div>
          <h3 style="margin-top: 0; color: #1e293b;">${proposal.serviceName || proposal.title || 'Assessoria Jurídica'}</h3>
          <p>${proposal.description || 'Prestação de serviços jurídicos consultivos e contenciosos.'}</p>
        </div>

        <div class="price-box">
          <div style="font-size: 11pt; text-transform: uppercase; letter-spacing: 1px;">Investimento em Honorários Advocatícios</div>
          <div class="price-val">${formatCurrency(feeValue)}</div>
          <div style="font-size: 10pt; color: #e2e8f0; margin-top: 5px;">Condições: ${proposal.paymentTerms || proposal.paymentMethod || 'A combinar'}</div>
        </div>

        <div class="card">
          <div class="card-title">2. Diferenciais e Metodologia</div>
          <ul>
            <li>Atuação estratégica especializada com foco em resultados céleres e seguros;</li>
            <li>Acompanhamento digital em tempo real e relatórios periódicos de andamento;</li>
            <li>Equipe jurídica de alto padrão com suporte direto via WhatsApp e reuniões agendadas.</li>
          </ul>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 10pt; color: #64748b;">
          Elaborado por: <strong>${proposal.responsibleName || 'Equipe Comercial'}</strong><br>
          ${officeSettings?.email || 'contato@jurisflow.adv.br'} | ${officeSettings?.website || 'https://jurisflow.adv.br'}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
