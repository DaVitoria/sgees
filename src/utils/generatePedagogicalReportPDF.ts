import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePDF } from "./fileDownload";

interface DisciplinaStats {
  nome: string;
  matriculados_h: number;
  matriculados_m: number;
  matriculados_hm: number;
  avaliados_m: number;
  avaliados_hm: number;
  percentagem_avaliados: number;
  positivos_h: number;
  positivos_m: number;
  positivos_hm: number;
  escala_0_9: number;
  escala_10_13: number;
  escala_14_20: number;
  soma_total: number;
  nota_media: number;
}

interface TurmaStats {
  turma: string;
  classe: number;
  matriculados_m: number;
  matriculados_hm: number;
  desistentes_m: number;
  desistentes_hm: number;
  transferidos_m: number;
  transferidos_hm: number;
  pdf_m: number;
  pdf_hm: number;
  avaliados_m: number;
  avaliados_hm: number;
  positivos_m: number;
  positivos_hm: number;
  percentagem_positivos: number;
}

interface AlunoNota {
  id: string;
  nome: string;
  sexo: string;
  estado: string;
  notas: {
    disciplina: string;
    nota_as1: number | null;
    nota_as2: number | null;
    nota_as3: number | null;
    nota_at: number | null;
    media_as: number | null;
    media_trimestral: number | null;
  }[];
}

interface ReportInfo {
  reportType: "aproveitamento_disciplina" | "aproveitamento_geral" | "verbetes";
  periodo: string;
  anoLectivo: string;
  turma?: string;
  classe?: number;
}

const addHeader = (doc: jsPDF, title: string, info: ReportInfo) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header background
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageWidth / 2, 15, { align: "center" });
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", pageWidth / 2, 23, { align: "center" });
  
  // Period info
  doc.setFontSize(9);
  doc.text(`${info.periodo} | Ano Lectivo: ${info.anoLectivo}`, pageWidth / 2, 30, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  
  // Info section
  let infoY = 45;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (info.turma && info.classe) {
    doc.text(`Turma: ${info.classe}ª Classe - ${info.turma}`, 14, infoY);
    infoY += 6;
  }
  
  doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-MZ", { 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  })}`, 14, infoY);
  
  return infoY + 10;
};

const addFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(14, 280, pageWidth - 14, 280);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    
    const today = new Date().toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    
    doc.text(`Gerado em ${today}`, 14, 287);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, 287, { align: "right" });
    doc.text("Sistema de Gestão Escolar - Moçambique", pageWidth / 2, 292, { align: "center" });
  }
};

export const generateAproveitamentoDisciplinaPDF = async (
  data: DisciplinaStats[],
  info: ReportInfo
): Promise<{ success: boolean; path?: string; error?: string }> => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const startY = addHeader(doc, "MAPA DE APROVEITAMENTO PEDAGÓGICO POR DISCIPLINA", info);
  
  // Summary stats
  const totalMatriculados = data.reduce((acc, d) => acc + d.matriculados_hm, 0) / (data.length || 1);
  const totalAvaliados = data.reduce((acc, d) => acc + d.avaliados_hm, 0);
  const totalPositivos = data.reduce((acc, d) => acc + d.positivos_hm, 0);
  const mediaGeral = data.length > 0 ? data.reduce((acc, d) => acc + d.nota_media, 0) / data.length : 0;
  
  // Summary cards
  const cardY = startY;
  const cardWidth = 60;
  const cardSpacing = 10;
  const startX = (pageWidth - (cardWidth * 4 + cardSpacing * 3)) / 2;
  
  const cards = [
    { label: "Média Matriculados", value: Math.round(totalMatriculados).toString(), color: [59, 130, 246] },
    { label: "Total Avaliados", value: totalAvaliados.toString(), color: [34, 197, 94] },
    { label: "Total Positivos", value: totalPositivos.toString(), color: [16, 185, 129] },
    { label: "Média Geral", value: mediaGeral.toFixed(1), color: [245, 158, 11] },
  ];
  
  cards.forEach((card, idx) => {
    const x = startX + idx * (cardWidth + cardSpacing);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, cardY, cardWidth, 20, 3, 3, "F");
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardWidth / 2, cardY + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardWidth / 2, cardY + 16, { align: "center" });
  });
  
  doc.setTextColor(0);
  
  // Table
  const tableData = data.map(d => [
    d.nome,
    d.matriculados_hm.toString(),
    d.avaliados_m.toString(),
    d.avaliados_hm.toString(),
    `${d.percentagem_avaliados.toFixed(1)}%`,
    d.positivos_h.toString(),
    d.positivos_m.toString(),
    d.positivos_hm.toString(),
    d.escala_0_9.toString(),
    d.escala_10_13.toString(),
    d.escala_14_20.toString(),
    d.soma_total.toFixed(1),
    d.nota_media.toFixed(1),
  ]);
  
  autoTable(doc, {
    startY: cardY + 30,
    head: [[
      "Disciplina",
      "Matr.(HM)",
      "Aval.(M)",
      "Aval.(HM)",
      "% Aval.",
      "Pos.(H)",
      "Pos.(M)",
      "Pos.(HM)",
      "0-9",
      "10-13",
      "14-20",
      "Soma",
      "Média"
    ]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "center", cellWidth: 16 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 16 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "center", cellWidth: 16 },
      7: { halign: "center", cellWidth: 18 },
      8: { halign: "center", cellWidth: 14, fillColor: [254, 226, 226] },
      9: { halign: "center", cellWidth: 14, fillColor: [254, 249, 195] },
      10: { halign: "center", cellWidth: 14, fillColor: [220, 252, 231] },
      11: { halign: "center", cellWidth: 16 },
      12: { halign: "center", cellWidth: 16, fontStyle: "bold" },
    },
  });
  
  addFooter(doc);
  
  const filename = `Aproveitamento_Disciplina_${info.turma || 'Turma'}_${info.periodo}_${info.anoLectivo.replace("/", "-")}.pdf`;
  return await savePDF(doc, filename);
};

export const generateAproveitamentoGeralPDF = async (
  data: TurmaStats[],
  info: ReportInfo
): Promise<{ success: boolean; path?: string; error?: string }> => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const startY = addHeader(doc, "MAPA DE APROVEITAMENTO PEDAGÓGICO GERAL", info);
  
  // Summary stats
  const totalMatriculados = data.reduce((acc, t) => acc + t.matriculados_hm, 0);
  const totalAvaliados = data.reduce((acc, t) => acc + t.avaliados_hm, 0);
  const totalPositivos = data.reduce((acc, t) => acc + t.positivos_hm, 0);
  const percentagemGeral = totalAvaliados > 0 ? (totalPositivos / totalAvaliados) * 100 : 0;
  
  // Summary cards
  const cardY = startY;
  const cardWidth = 60;
  const cardSpacing = 10;
  const startX = (pageWidth - (cardWidth * 4 + cardSpacing * 3)) / 2;
  
  const cards = [
    { label: "Total Matriculados", value: totalMatriculados.toString(), color: [59, 130, 246] },
    { label: "Total Avaliados", value: totalAvaliados.toString(), color: [34, 197, 94] },
    { label: "Total Positivos", value: totalPositivos.toString(), color: [16, 185, 129] },
    { label: "% Aprovação", value: `${percentagemGeral.toFixed(1)}%`, color: [245, 158, 11] },
  ];
  
  cards.forEach((card, idx) => {
    const x = startX + idx * (cardWidth + cardSpacing);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, cardY, cardWidth, 20, 3, 3, "F");
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardWidth / 2, cardY + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardWidth / 2, cardY + 16, { align: "center" });
  });
  
  doc.setTextColor(0);
  
  // Table
  const tableData = data.map(t => [
    `${t.classe}ª ${t.turma}`,
    t.matriculados_m.toString(),
    t.matriculados_hm.toString(),
    t.desistentes_m.toString(),
    t.desistentes_hm.toString(),
    t.transferidos_m.toString(),
    t.transferidos_hm.toString(),
    t.pdf_m.toString(),
    t.pdf_hm.toString(),
    t.avaliados_m.toString(),
    t.avaliados_hm.toString(),
    t.positivos_m.toString(),
    t.positivos_hm.toString(),
    `${t.percentagem_positivos.toFixed(1)}%`,
  ]);
  
  autoTable(doc, {
    startY: cardY + 30,
    head: [[
      "Turma",
      "Matr.(M)",
      "Matr.(HM)",
      "Desist.(M)",
      "Desist.(HM)",
      "Transf.(M)",
      "Transf.(HM)",
      "PDF(M)",
      "PDF(HM)",
      "Aval.(M)",
      "Aval.(HM)",
      "Pos.(M)",
      "Pos.(HM)",
      "% Pos."
    ]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: "center", cellWidth: 17 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 17 },
      4: { halign: "center", cellWidth: 19 },
      5: { halign: "center", cellWidth: 18 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "center", cellWidth: 15 },
      8: { halign: "center", cellWidth: 17 },
      9: { halign: "center", cellWidth: 16 },
      10: { halign: "center", cellWidth: 18 },
      11: { halign: "center", cellWidth: 16, fillColor: [220, 252, 231] },
      12: { halign: "center", cellWidth: 18, fillColor: [220, 252, 231] },
      13: { halign: "center", cellWidth: 18, fontStyle: "bold" },
    },
  });
  
  // Totals row
  const totals = {
    matriculados_m: data.reduce((acc, t) => acc + t.matriculados_m, 0),
    matriculados_hm: data.reduce((acc, t) => acc + t.matriculados_hm, 0),
    desistentes_m: data.reduce((acc, t) => acc + t.desistentes_m, 0),
    desistentes_hm: data.reduce((acc, t) => acc + t.desistentes_hm, 0),
    transferidos_m: data.reduce((acc, t) => acc + t.transferidos_m, 0),
    transferidos_hm: data.reduce((acc, t) => acc + t.transferidos_hm, 0),
    pdf_m: data.reduce((acc, t) => acc + t.pdf_m, 0),
    pdf_hm: data.reduce((acc, t) => acc + t.pdf_hm, 0),
    avaliados_m: data.reduce((acc, t) => acc + t.avaliados_m, 0),
    avaliados_hm: data.reduce((acc, t) => acc + t.avaliados_hm, 0),
    positivos_m: data.reduce((acc, t) => acc + t.positivos_m, 0),
    positivos_hm: data.reduce((acc, t) => acc + t.positivos_hm, 0),
  };
  
  const finalY = (doc as any).lastAutoTable.finalY;
  
  autoTable(doc, {
    startY: finalY,
    body: [[
      "TOTAL",
      totals.matriculados_m.toString(),
      totals.matriculados_hm.toString(),
      totals.desistentes_m.toString(),
      totals.desistentes_hm.toString(),
      totals.transferidos_m.toString(),
      totals.transferidos_hm.toString(),
      totals.pdf_m.toString(),
      totals.pdf_hm.toString(),
      totals.avaliados_m.toString(),
      totals.avaliados_hm.toString(),
      totals.positivos_m.toString(),
      totals.positivos_hm.toString(),
      `${percentagemGeral.toFixed(1)}%`,
    ]],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 30, fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      1: { halign: "center", cellWidth: 17 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 17 },
      4: { halign: "center", cellWidth: 19 },
      5: { halign: "center", cellWidth: 18 },
      6: { halign: "center", cellWidth: 20 },
      7: { halign: "center", cellWidth: 15 },
      8: { halign: "center", cellWidth: 17 },
      9: { halign: "center", cellWidth: 16 },
      10: { halign: "center", cellWidth: 18 },
      11: { halign: "center", cellWidth: 16 },
      12: { halign: "center", cellWidth: 18 },
      13: { halign: "center", cellWidth: 18 },
    },
  });
  
  addFooter(doc);
  
  const filename = `Aproveitamento_Geral_${info.periodo}_${info.anoLectivo.replace("/", "-")}.pdf`;
  return await savePDF(doc, filename);
};

export const generateVerbetesPDF = async (
  data: AlunoNota[],
  disciplinas: string[],
  info: ReportInfo
): Promise<{ success: boolean; path?: string; error?: string }> => {
  // Use landscape for more disciplines
  const doc = new jsPDF({ orientation: disciplinas.length > 3 ? "landscape" : "portrait" });
  
  const startY = addHeader(doc, "VERBETES - NOTAS DOS ALUNOS", info);
  
  // Build table headers
  const headers: string[] = ["Nº", "Nome do Aluno", "Sexo"];
  disciplinas.forEach(disc => {
    headers.push(`${disc.substring(0, 8)}`);
  });
  headers.push("Média");
  
  // Build table data
  const tableData = data.map((aluno, idx) => {
    const row: string[] = [
      (idx + 1).toString(),
      aluno.nome.length > 25 ? aluno.nome.substring(0, 25) + "..." : aluno.nome,
      aluno.sexo,
    ];
    
    let totalMedia = 0;
    let countMedia = 0;
    
    aluno.notas.forEach(nota => {
      const media = nota.media_trimestral;
      row.push(media !== null ? media.toFixed(1) : "-");
      if (media !== null) {
        totalMedia += media;
        countMedia++;
      }
    });
    
    const mediaFinal = countMedia > 0 ? totalMedia / countMedia : 0;
    row.push(countMedia > 0 ? mediaFinal.toFixed(1) : "-");
    
    return row;
  });
  
  // Calculate column widths
  const availableWidth = doc.internal.pageSize.getWidth() - 28;
  const fixedWidth = 12 + 60 + 15 + 20; // Nº, Nome, Sexo, Média
  const disciplinaWidth = Math.max(15, (availableWidth - fixedWidth) / disciplinas.length);
  
  const columnStyles: any = {
    0: { cellWidth: 12, halign: "center" },
    1: { cellWidth: 60 },
    2: { cellWidth: 15, halign: "center" },
  };
  
  disciplinas.forEach((_, idx) => {
    columnStyles[3 + idx] = { cellWidth: disciplinaWidth, halign: "center" };
  });
  
  columnStyles[3 + disciplinas.length] = { cellWidth: 20, halign: "center", fontStyle: "bold" };
  
  autoTable(doc, {
    startY: startY,
    head: [headers],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", halign: "center", fontSize: 7 },
    columnStyles,
    didParseCell: function (data) {
      if (data.section === "body") {
        // Color code the final media column
        const mediaColIndex = 3 + disciplinas.length;
        if (data.column.index === mediaColIndex) {
          const value = parseFloat(data.cell.raw as string);
          if (!isNaN(value)) {
            if (value >= 10) {
              data.cell.styles.textColor = [34, 197, 94];
            } else {
              data.cell.styles.textColor = [239, 68, 68];
            }
          }
        }
        // Color code discipline grades
        if (data.column.index >= 3 && data.column.index < mediaColIndex) {
          const value = parseFloat(data.cell.raw as string);
          if (!isNaN(value)) {
            if (value >= 14) {
              data.cell.styles.fillColor = [220, 252, 231];
            } else if (value >= 10) {
              data.cell.styles.fillColor = [254, 249, 195];
            } else {
              data.cell.styles.fillColor = [254, 226, 226];
            }
          }
        }
      }
    },
  });
  
  // Add legend
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Legenda: ", 14, finalY);
  
  doc.setFillColor(220, 252, 231);
  doc.rect(35, finalY - 3, 8, 4, "F");
  doc.text("≥14 (Bom)", 45, finalY);
  
  doc.setFillColor(254, 249, 195);
  doc.rect(70, finalY - 3, 8, 4, "F");
  doc.text("10-13 (Suficiente)", 80, finalY);
  
  doc.setFillColor(254, 226, 226);
  doc.rect(120, finalY - 3, 8, 4, "F");
  doc.text("<10 (Insuficiente)", 130, finalY);
  
  addFooter(doc);
  
  const filename = `Verbetes_${info.turma || 'Turma'}_${info.periodo}_${info.anoLectivo.replace("/", "-")}.pdf`;
  return await savePDF(doc, filename);
};
