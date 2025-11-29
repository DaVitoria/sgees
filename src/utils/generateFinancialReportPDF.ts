import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FinancialSummary {
  total_entradas: number;
  total_saidas: number;
  saldo_actual: number;
  entradas_mes_actual: number;
  saidas_mes_actual: number;
}

interface MonthlyFinancial {
  mes: string;
  mes_ano: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface SchoolStats {
  total_alunos: number;
  total_professores: number;
  total_funcionarios: number;
  total_turmas: number;
  total_disciplinas: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  }).format(value);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateFinancialReportPDF = (
  financialSummary: FinancialSummary,
  monthlyFinancial: MonthlyFinancial[],
  schoolStats: SchoolStats
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFillColor(30, 64, 175); // Primary blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório Financeiro", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", pageWidth / 2, 28, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${formatDate(new Date())}`, pageWidth / 2, 36, { align: "center" });

  yPosition = 55;
  doc.setTextColor(0, 0, 0);

  // School Summary Section
  doc.setFillColor(240, 249, 255);
  doc.rect(14, yPosition - 5, pageWidth - 28, 35, 'F');
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo da Escola", 20, yPosition + 5);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const statsCol1X = 25;
  const statsCol2X = 80;
  const statsCol3X = 135;
  
  doc.text(`Alunos Activos: ${schoolStats.total_alunos}`, statsCol1X, yPosition + 15);
  doc.text(`Professores: ${schoolStats.total_professores}`, statsCol2X, yPosition + 15);
  doc.text(`Funcionários: ${schoolStats.total_funcionarios}`, statsCol3X, yPosition + 15);
  doc.text(`Turmas: ${schoolStats.total_turmas}`, statsCol1X, yPosition + 23);
  doc.text(`Disciplinas: ${schoolStats.total_disciplinas}`, statsCol2X, yPosition + 23);

  yPosition += 45;

  // Financial Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Situação Financeira Actual", 20, yPosition);
  
  yPosition += 10;

  // Summary Cards as Table
  const summaryData = [
    ["Saldo Actual", formatCurrency(financialSummary.saldo_actual)],
    ["Total de Entradas", formatCurrency(financialSummary.total_entradas)],
    ["Total de Saídas", formatCurrency(financialSummary.total_saidas)],
    ["Entradas (Mês Actual)", formatCurrency(financialSummary.entradas_mes_actual)],
    ["Saídas (Mês Actual)", formatCurrency(financialSummary.saidas_mes_actual)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Descrição", "Valor"]],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right' }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    margin: { left: 20, right: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Monthly Evolution Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Evolução Financeira Mensal (Últimos 12 Meses)", 20, yPosition);
  
  yPosition += 10;

  const monthlyData = monthlyFinancial.map(item => [
    item.mes_ano,
    formatCurrency(item.entradas),
    formatCurrency(item.saidas),
    formatCurrency(item.saldo)
  ]);

  // Calculate totals
  const totalEntradas = monthlyFinancial.reduce((sum, item) => sum + item.entradas, 0);
  const totalSaidas = monthlyFinancial.reduce((sum, item) => sum + item.saidas, 0);
  const totalSaldo = totalEntradas - totalSaidas;

  autoTable(doc, {
    startY: yPosition,
    head: [["Mês/Ano", "Entradas", "Saídas", "Saldo Mensal"]],
    body: monthlyData,
    foot: [[
      "TOTAL",
      formatCurrency(totalEntradas),
      formatCurrency(totalSaidas),
      formatCurrency(totalSaldo)
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 45, halign: 'right' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    margin: { left: 20, right: 20 },
    didParseCell: function(data) {
      // Highlight negative saldo in red
      if (data.column.index === 3 && data.section === 'body') {
        const value = monthlyFinancial[data.row.index]?.saldo;
        if (value && value < 0) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Check if we need a new page for analysis
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Financial Analysis Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Análise Financeira", 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const saldoStatus = financialSummary.saldo_actual >= 0 ? "positivo" : "negativo";
  const saldoColor = financialSummary.saldo_actual >= 0 ? [22, 163, 74] : [220, 38, 38];
  
  // Analysis box
  doc.setFillColor(249, 250, 251);
  doc.rect(14, yPosition - 3, pageWidth - 28, 45, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(14, yPosition - 3, pageWidth - 28, 45, 'S');

  doc.setTextColor(0, 0, 0);
  doc.text(`• Saldo actual: ${saldoStatus}`, 20, yPosition + 7);
  
  const avgEntradas = totalEntradas / 12;
  const avgSaidas = totalSaidas / 12;
  doc.text(`• Média mensal de entradas: ${formatCurrency(avgEntradas)}`, 20, yPosition + 17);
  doc.text(`• Média mensal de saídas: ${formatCurrency(avgSaidas)}`, 20, yPosition + 27);
  
  const balanco = avgEntradas - avgSaidas;
  const balancoStatus = balanco >= 0 ? "superavitário" : "deficitário";
  doc.text(`• Balanço médio mensal: ${formatCurrency(balanco)} (${balancoStatus})`, 20, yPosition + 37);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Sistema de Gestão Escolar | Relatório Financeiro`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  const fileName = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
