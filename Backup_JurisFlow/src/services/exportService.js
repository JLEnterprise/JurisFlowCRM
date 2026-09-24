// Serviço de exportação para CSV e planilhas

export const exportService = {
  exportToCSV(filename, rows, headers) {
    if (!rows || !rows.length) return;

    const separator = ';';
    const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(separator);
    
    const csvContent = [
      headerRow,
      ...rows.map(row => 
        headers.map(header => {
          let val = row[header.key];
          if (header.formatter) {
            val = header.formatter(val, row);
          }
          if (val === undefined || val === null) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(separator)
      )
    ].join('\r\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportToExcel(filename, rows, headers) {
    // Exporta em formato HTML compatível com Excel (.xls) com tabela formatada
    if (!rows || !rows.length) return;

    let tableHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    tableHtml += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Relatorio</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    tableHtml += '<body style="font-family: Arial, sans-serif;">';
    tableHtml += '<h2 style="color: #0b3f6d;">JurisFlow CRM — Relatório Gerencial</h2>';
    tableHtml += `<p>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>`;
    tableHtml += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; border: 1px solid #ddd;">';
    
    // Header
    tableHtml += '<tr style="background-color: #0c8de3; color: #ffffff; font-weight: bold;">';
    headers.forEach(h => {
      tableHtml += `<th style="padding: 8px 12px; text-align: left;">${h.label}</th>`;
    });
    tableHtml += '</tr>';

    // Rows
    rows.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      tableHtml += `<tr style="background-color: ${bgColor};">`;
      headers.forEach(h => {
        let val = row[h.key];
        if (h.formatter) {
          val = h.formatter(val, row);
        }
        if (val === undefined || val === null) val = '';
        tableHtml += `<td style="padding: 6px 12px;">${val}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</table></body></html>';

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
