import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasExame } from "./statusHelper";

interface NotaData {
  disciplina: string;
  trimestre: number;
  nota_as1: number | null;
  nota_as2: number | null;
  nota_as3: number | null;
  media_as: number | null;
  nota_at: number | null;
  media_trimestral: number | null;
}

interface AlunoData {
  nome: string;
  matricula: string;
  turma: string;
  classe: number;
}

interface BoletimData {
  aluno: AlunoData;
  notas: NotaData[];
  mediaAnual: number | null;
  anoLectivo: string;
}

export const generateBoletimPDF = (data: BoletimData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("BOLETIM DE NOTAS", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", pageWidth / 2, 28, { align: "center" });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(14, 33, pageWidth - 14, 33);
  
  // Student info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO ALUNO", 14, 42);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const infoStartY = 50;
  const lineHeight = 6;
  
  doc.text(`Nome Completo: ${data.aluno.nome}`, 14, infoStartY);
  doc.text(`Nº de Matrícula: ${data.aluno.matricula}`, 14, infoStartY + lineHeight);
  doc.text(`Turma: ${data.aluno.turma}`, 14, infoStartY + lineHeight * 2);
  doc.text(`Classe: ${data.aluno.classe}ª`, pageWidth / 2, infoStartY + lineHeight * 2);
  doc.text(`Ano Lectivo: ${data.anoLectivo}`, 14, infoStartY + lineHeight * 3);
  
  // Organize notas by disciplina and trimestre
  const notasByDisciplina: Record<string, Record<number, NotaData>> = {};
  
  data.notas.forEach(nota => {
    if (!notasByDisciplina[nota.disciplina]) {
      notasByDisciplina[nota.disciplina] = {};
    }
    notasByDisciplina[nota.disciplina][nota.trimestre] = nota;
  });
  
  // Generate table for each trimester
  let currentY = infoStartY + lineHeight * 5;
  
  for (let trimestre = 1; trimestre <= 3; trimestre++) {
    const trimestreNotas = data.notas.filter(n => n.trimestre === trimestre);
    
    if (trimestreNotas.length === 0) continue;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${trimestre}º TRIMESTRE`, 14, currentY);
    currentY += 5;
    
    const tableData = trimestreNotas.map(nota => [
      nota.disciplina,
      nota.nota_as1?.toFixed(1) || "-",
      nota.nota_as2?.toFixed(1) || "-",
      nota.nota_as3?.toFixed(1) || "-",
      nota.media_as !== null ? Math.ceil(nota.media_as).toString() : "-",
      nota.nota_at?.toFixed(1) || "-",
      nota.media_trimestral !== null ? Math.ceil(nota.media_trimestral).toString() : "-",
    ]);
    
    // Calculate trimester average (ceiling to integer)
    const mediasTrimestrais = trimestreNotas
      .map(n => n.media_trimestral)
      .filter((m): m is number => m !== null);
    const mediaTrimestre = mediasTrimestrais.length > 0 
      ? Math.ceil(mediasTrimestrais.reduce((a, b) => a + b, 0) / mediasTrimestrais.length).toString()
      : "-";
    
    autoTable(doc, {
      startY: currentY,
      head: [["Disciplina", "AS1", "AS2", "AS3", "MAS", "AT", "MT"]],
      body: tableData,
      foot: [["Média do Trimestre", "", "", "", "", "", mediaTrimestre]],
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [229, 231, 235],
        textColor: 0,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 20, halign: "center" },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (currentY > 250 && trimestre < 3) {
      doc.addPage();
      currentY = 20;
    }
  }
  
  // Annual average section
  if (data.mediaAnual !== null) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    
    // Box for annual average
    const boxY = currentY + 5;
    doc.setFillColor(59, 130, 246);
    doc.rect(14, boxY, pageWidth - 28, 15, "F");
    
    doc.setTextColor(255);
    doc.text("MÉDIA ANUAL (MA):", 20, boxY + 10);
    doc.text(Math.ceil(data.mediaAnual).toString(), pageWidth - 30, boxY + 10);
    
    // Status - depende se a classe tem exame
    doc.setTextColor(0);
    const classeTemExame = hasExame(data.aluno.classe);
    let status: string;
    let statusColor: number[];
    
    if (data.mediaAnual >= 10) {
      status = "APROVADO";
      statusColor = [34, 197, 94];
    } else if (data.mediaAnual >= 7) {
      status = classeTemExame ? "EM EXAME" : "PROGRIDE";
      statusColor = classeTemExame ? [234, 179, 8] : [59, 130, 246];
    } else {
      status = classeTemExame ? "REPROVADO" : "RETIDO";
      statusColor = [239, 68, 68];
    }
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(14, boxY + 20, pageWidth - 28, 12, "F");
    
    doc.setTextColor(255);
    doc.text(`SITUAÇÃO: ${status}`, pageWidth / 2, boxY + 28, { align: "center" });
  }
  
  // Footer
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  
  const today = new Date().toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  doc.text(`Documento gerado em ${today}`, pageWidth / 2, 285, { align: "center" });
  doc.text("Sistema de Gestão Escolar - Moçambique", pageWidth / 2, 290, { align: "center" });
  
  // Legend
  const legendY = currentY + 50 > 260 ? 260 : currentY + 50;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Legenda: AS - Avaliação Sistemática | MAS - Média das AS | AT - Avaliação Trimestral | MT - Média Trimestral | MA - Média Anual", 14, legendY);
  doc.text("Fórmula: MT = MAS × 0.4 + AT × 0.6 | MA = Média das MT dos 3 trimestres", 14, legendY + 4);
  
  // Save
  doc.save(`Boletim_${data.aluno.matricula}_${data.anoLectivo.replace("/", "-")}.pdf`);
};
