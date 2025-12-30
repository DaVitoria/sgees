import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { savePDF } from "./fileDownload";

interface AlunoData {
  numero_matricula: string;
  nome_completo: string;
  sexo: string | null;
  mediaGeral: number;
  status: string;
}

interface DisciplinaMedia {
  nome: string;
  media: number;
}

interface TurmaStats {
  totalAlunos: number;
  homens: number;
  mulheres: number;
  aprovados: number;
  reprovados: number;
  emExame: number;
  pendentes: number;
  mediaGeral: number;
}

interface TurmaReportData {
  turma: {
    nome: string;
    classe: number;
  };
  directorNome: string;
  anoLectivo: string;
  alunos: AlunoData[];
  disciplinas: DisciplinaMedia[];
  stats: TurmaStats;
}

export const generateTurmaReportPDF = async (data: TurmaReportData): Promise<{ success: boolean; path?: string; error?: string }> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DA TURMA", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão Escolar", pageWidth / 2, 28, { align: "center" });

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(14, 33, pageWidth - 14, 33);

  // Turma info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMAÇÕES DA TURMA", 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const infoStartY = 50;
  const lineHeight = 6;

  doc.text(`Turma: ${data.turma.classe}ª Classe - ${data.turma.nome}`, 14, infoStartY);
  doc.text(`Director de Turma: ${data.directorNome}`, 14, infoStartY + lineHeight);
  doc.text(`Ano Lectivo: ${data.anoLectivo}`, 14, infoStartY + lineHeight * 2);
  doc.text(`Data do Relatório: ${new Date().toLocaleDateString("pt-MZ")}`, 14, infoStartY + lineHeight * 3);

  // Statistics Section
  let currentY = infoStartY + lineHeight * 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ESTATÍSTICAS GERAIS", 14, currentY);
  currentY += 8;

  // Stats table
  const statsData = [
    ["Total de Alunos", data.stats.totalAlunos.toString()],
    ["Homens", data.stats.homens.toString()],
    ["Mulheres", data.stats.mulheres.toString()],
    ["Aprovados", data.stats.aprovados.toString()],
    ["Em Exame", data.stats.emExame.toString()],
    ["Reprovados", data.stats.reprovados.toString()],
    ["Pendentes", data.stats.pendentes.toString()],
    ["Média Geral da Turma", data.stats.mediaGeral.toFixed(2) + "/20"],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Indicador", "Valor"]],
    body: statsData,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: "center" },
    },
    margin: { left: 14, right: pageWidth - 148 },
  });

  // Approval rates
  const approvalY = (doc as any).lastAutoTable.finalY + 5;
  const total = data.stats.aprovados + data.stats.reprovados + data.stats.emExame + data.stats.pendentes;
  const taxaAprovacao = total > 0 ? ((data.stats.aprovados / total) * 100).toFixed(1) : "0";

  doc.setFillColor(34, 197, 94);
  doc.rect(130, 85, 66, 25, "F");
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Taxa de Aprovação", 163, 94, { align: "center" });
  doc.setFontSize(18);
  doc.text(`${taxaAprovacao}%`, 163, 106, { align: "center" });
  doc.setTextColor(0);

  // Grades by discipline
  currentY = approvalY + 10;

  if (data.disciplinas.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MÉDIAS POR DISCIPLINA", 14, currentY);
    currentY += 5;

    const disciplinaData = data.disciplinas.map((d) => [
      d.nome,
      d.media.toFixed(2),
      d.media >= 10 ? "Bom" : d.media >= 7 ? "Regular" : "Insuficiente",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Disciplina", "Média", "Desempenho"]],
      body: disciplinaData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 40, halign: "center" },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // New page for students list
  doc.addPage();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("LISTA DE ALUNOS", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.turma.classe}ª Classe - Turma ${data.turma.nome}`, 14, 28);

  // Sort alunos by nome
  const sortedAlunos = [...data.alunos].sort((a, b) =>
    a.nome_completo.localeCompare(b.nome_completo)
  );

  const alunosTableData = sortedAlunos.map((aluno, index) => {
    const statusLabel =
      aluno.status === "aprovado"
        ? "Aprovado"
        : aluno.status === "reprovado"
        ? "Reprovado"
        : aluno.status === "em_exame"
        ? "Em Exame"
        : "Pendente";
    const sexoLabel = aluno.sexo === "H" ? "M" : aluno.sexo === "M" ? "F" : "-";

    return [
      (index + 1).toString(),
      aluno.numero_matricula,
      aluno.nome_completo,
      sexoLabel,
      aluno.mediaGeral.toFixed(2),
      statusLabel,
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [["Nº", "Matrícula", "Nome Completo", "Sexo", "Média", "Situação"]],
    body: alunosTableData,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 70 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 25, halign: "center" },
    },
    didParseCell: function (data) {
      if (data.section === "body" && data.column.index === 5) {
        const value = data.cell.raw as string;
        if (value === "Aprovado") {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = "bold";
        } else if (value === "Reprovado") {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        } else if (value === "Em Exame") {
          data.cell.styles.textColor = [234, 179, 8];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);

    const today = new Date().toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    doc.text(`Documento gerado em ${today}`, 14, 285);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, 285, { align: "right" });
    doc.text("Sistema de Gestão Escolar - Moçambique", pageWidth / 2, 290, { align: "center" });
  }

  // Save
  const fileName = `Relatorio_Turma_${data.turma.classe}${data.turma.nome}_${data.anoLectivo.replace("/", "-")}.pdf`;
  return await savePDF(doc, fileName);
};
