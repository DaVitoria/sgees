import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/utils/exportToExcel";
import { 
  generateAproveitamentoDisciplinaPDF, 
  generateAproveitamentoGeralPDF, 
  generateVerbetesPDF 
} from "@/utils/generatePedagogicalReportPDF";

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

type ReportType = "aproveitamento_disciplina" | "aproveitamento_geral" | "verbetes";
type PeriodoType = "trimestral" | "anual";

const RelatoriosPedagogicos = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [selectedAnoLectivo, setSelectedAnoLectivo] = useState<string>("");
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>("1");
  const [reportType, setReportType] = useState<ReportType>("aproveitamento_disciplina");
  const [periodoType, setPeriodoType] = useState<PeriodoType>("trimestral");
  
  const [disciplinaStats, setDisciplinaStats] = useState<DisciplinaStats[]>([]);
  const [turmaStats, setTurmaStats] = useState<TurmaStats[]>([]);
  const [verbetesData, setVerbetesData] = useState<AlunoNota[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAnoLectivo) {
      fetchTurmas();
    }
  }, [selectedAnoLectivo]);

  useEffect(() => {
    if (selectedAnoLectivo && (selectedTurma || reportType === "aproveitamento_geral")) {
      fetchReportData();
    }
  }, [selectedTurma, selectedAnoLectivo, selectedTrimestre, reportType, periodoType]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const { data: anos, error: anosError } = await supabase
        .from("anos_lectivos")
        .select("*")
        .order("ano", { ascending: false });

      if (anosError) throw anosError;

      setAnosLectivos(anos || []);
      const anoActivo = anos?.find(a => a.activo);
      if (anoActivo) {
        setSelectedAnoLectivo(anoActivo.id);
      } else if (anos && anos.length > 0) {
        setSelectedAnoLectivo(anos[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("ano_lectivo_id", selectedAnoLectivo)
        .order("classe");

      if (error) throw error;

      setTurmas(data || []);
      if (data && data.length > 0) {
        setSelectedTurma(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar turmas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchReportData = async () => {
    setLoadingData(true);
    try {
      if (reportType === "aproveitamento_disciplina") {
        await fetchAproveitamentoDisciplina();
      } else if (reportType === "aproveitamento_geral") {
        await fetchAproveitamentoGeral();
      } else if (reportType === "verbetes") {
        await fetchVerbetes();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar relatório",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getNotasQuery = (alunoIds: string[]) => {
    let query = supabase
      .from("notas")
      .select(`
        aluno_id,
        trimestre,
        media_trimestral,
        nota_as1,
        nota_as2,
        nota_as3,
        nota_at,
        media_as,
        disciplina:disciplinas!fk_notas_disciplina(id, nome)
      `)
      .in("aluno_id", alunoIds)
      .eq("ano_lectivo_id", selectedAnoLectivo);

    if (periodoType === "trimestral") {
      query = query.eq("trimestre", parseInt(selectedTrimestre));
    }

    return query;
  };

  const calculateAnnualAverage = (notas: any[], disciplinaId: string, alunoId: string) => {
    const notasDisciplina = notas.filter(
      n => (n.disciplina as any)?.id === disciplinaId && n.aluno_id === alunoId && n.media_trimestral !== null
    );
    if (notasDisciplina.length === 0) return null;
    return notasDisciplina.reduce((acc, n) => acc + (n.media_trimestral || 0), 0) / notasDisciplina.length;
  };

  const fetchAproveitamentoDisciplina = async () => {
    const turmaInfo = turmas.find(t => t.id === selectedTurma);
    if (!turmaInfo) return;

    const { data: alunos, error: alunosError } = await supabase
      .from("alunos")
      .select(`
        id,
        estado,
        profiles:user_id (nome_completo, sexo)
      `)
      .eq("turma_id", selectedTurma);

    if (alunosError) throw alunosError;

    const alunoIds = alunos?.map(a => a.id) || [];
    if (alunoIds.length === 0) {
      setDisciplinaStats([]);
      return;
    }

    const { data: notas, error: notasError } = await getNotasQuery(alunoIds);
    if (notasError) throw notasError;

    const { data: disciplinasData, error: discError } = await supabase
      .from("disciplinas")
      .select("id, nome")
      .order("nome");

    if (discError) throw discError;

    const stats: DisciplinaStats[] = (disciplinasData || []).map(disc => {
      const alunosMatriculados = alunos?.filter(a => a.estado === "activo") || [];
      const matriculadosH = alunosMatriculados.filter(a => (a.profiles as any)?.sexo === "M").length;
      const matriculadosM = alunosMatriculados.filter(a => (a.profiles as any)?.sexo === "F").length;
      const matriculadosHM = alunosMatriculados.length;

      let avaliadosIds: string[] = [];
      let notasParaCalculo: number[] = [];

      if (periodoType === "anual") {
        // For annual, calculate average across trimesters per student
        alunosMatriculados.forEach(aluno => {
          const avgMedia = calculateAnnualAverage(notas || [], disc.id, aluno.id);
          if (avgMedia !== null) {
            avaliadosIds.push(aluno.id);
            notasParaCalculo.push(avgMedia);
          }
        });
      } else {
        const notasDisciplina = notas?.filter(n => (n.disciplina as any)?.id === disc.id) || [];
        const notasComMedia = notasDisciplina.filter(n => n.media_trimestral !== null);
        avaliadosIds = notasComMedia.map(n => n.aluno_id);
        notasParaCalculo = notasComMedia.map(n => n.media_trimestral!);
      }

      const alunosAvaliados = alunos?.filter(a => avaliadosIds.includes(a.id)) || [];
      const avaliadosM = alunosAvaliados.filter(a => (a.profiles as any)?.sexo === "F").length;
      const avaliadosHM = [...new Set(avaliadosIds)].length;

      const notasPositivas = notasParaCalculo.filter(m => m >= 10);
      const alunosPositivosIds = avaliadosIds.filter((_, idx) => notasParaCalculo[idx] >= 10);
      const alunosPositivos = alunos?.filter(a => alunosPositivosIds.includes(a.id)) || [];
      const positivosH = [...new Set(alunosPositivos.filter(a => (a.profiles as any)?.sexo === "M").map(a => a.id))].length;
      const positivosM = [...new Set(alunosPositivos.filter(a => (a.profiles as any)?.sexo === "F").map(a => a.id))].length;
      const positivosHM = [...new Set(alunosPositivosIds)].length;

      const escala_0_9 = notasParaCalculo.filter(m => m < 10).length;
      const escala_10_13 = notasParaCalculo.filter(m => m >= 10 && m <= 13).length;
      const escala_14_20 = notasParaCalculo.filter(m => m >= 14).length;

      const somaTotal = notasParaCalculo.reduce((acc, m) => acc + m, 0);
      const notaMedia = notasParaCalculo.length > 0 ? somaTotal / notasParaCalculo.length : 0;

      return {
        nome: disc.nome,
        matriculados_h: matriculadosH,
        matriculados_m: matriculadosM,
        matriculados_hm: matriculadosHM,
        avaliados_m: avaliadosM,
        avaliados_hm: avaliadosHM,
        percentagem_avaliados: matriculadosHM > 0 ? (avaliadosHM / matriculadosHM) * 100 : 0,
        positivos_h: positivosH,
        positivos_m: positivosM,
        positivos_hm: positivosHM,
        escala_0_9,
        escala_10_13,
        escala_14_20,
        soma_total: somaTotal,
        nota_media: notaMedia,
      };
    });

    setDisciplinaStats(stats.filter(s => s.avaliados_hm > 0 || s.matriculados_hm > 0));
  };

  const fetchAproveitamentoGeral = async () => {
    const stats: TurmaStats[] = [];

    for (const turma of turmas) {
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select(`
          id,
          estado,
          profiles:user_id (nome_completo, sexo)
        `)
        .eq("turma_id", turma.id);

      if (alunosError) continue;

      const alunoIds = alunos?.map(a => a.id) || [];
      
      let notasData: any[] = [];
      if (alunoIds.length > 0) {
        let query = supabase
          .from("notas")
          .select("aluno_id, trimestre, media_trimestral")
          .in("aluno_id", alunoIds)
          .eq("ano_lectivo_id", selectedAnoLectivo);

        if (periodoType === "trimestral") {
          query = query.eq("trimestre", parseInt(selectedTrimestre));
        }

        const { data: notas } = await query;
        notasData = notas || [];
      }

      const allAlunos = alunos || [];
      const matriculadosM = allAlunos.filter(a => (a.profiles as any)?.sexo === "F").length;
      const matriculadosHM = allAlunos.length;

      const desistentes = allAlunos.filter(a => a.estado === "desistente");
      const desistentesM = desistentes.filter(a => (a.profiles as any)?.sexo === "F").length;
      const desistentesHM = desistentes.length;

      const transferidos = allAlunos.filter(a => a.estado === "transferido");
      const transferidosM = transferidos.filter(a => (a.profiles as any)?.sexo === "F").length;
      const transferidosHM = transferidos.length;

      const pdf = allAlunos.filter(a => a.estado === "obito");
      const pdfM = pdf.filter(a => (a.profiles as any)?.sexo === "F").length;
      const pdfHM = pdf.length;

      // Calculate student averages
      const alunoMedias = new Map<string, number[]>();
      
      if (periodoType === "anual") {
        // Group by student and trimester, then average
        const alunoTrimestreMedias = new Map<string, Map<number, number[]>>();
        notasData.forEach(n => {
          if (n.media_trimestral !== null) {
            if (!alunoTrimestreMedias.has(n.aluno_id)) {
              alunoTrimestreMedias.set(n.aluno_id, new Map());
            }
            const trimestreMap = alunoTrimestreMedias.get(n.aluno_id)!;
            if (!trimestreMap.has(n.trimestre)) {
              trimestreMap.set(n.trimestre, []);
            }
            trimestreMap.get(n.trimestre)!.push(n.media_trimestral);
          }
        });
        
        alunoTrimestreMedias.forEach((trimestreMap, alunoId) => {
          const annualMedias: number[] = [];
          trimestreMap.forEach(medias => {
            const avgTrimestre = medias.reduce((a, b) => a + b, 0) / medias.length;
            annualMedias.push(avgTrimestre);
          });
          if (annualMedias.length > 0) {
            const avgAnual = annualMedias.reduce((a, b) => a + b, 0) / annualMedias.length;
            alunoMedias.set(alunoId, [avgAnual]);
          }
        });
      } else {
        notasData.forEach(n => {
          if (n.media_trimestral !== null) {
            if (!alunoMedias.has(n.aluno_id)) {
              alunoMedias.set(n.aluno_id, []);
            }
            alunoMedias.get(n.aluno_id)!.push(n.media_trimestral);
          }
        });
      }

      const alunosComNotas = new Set(alunoMedias.keys());
      const avaliadosAlunos = allAlunos.filter(a => alunosComNotas.has(a.id));
      const avaliadosM = avaliadosAlunos.filter(a => (a.profiles as any)?.sexo === "F").length;
      const avaliadosHM = avaliadosAlunos.length;

      const positivosAlunos = allAlunos.filter(a => {
        const medias = alunoMedias.get(a.id);
        if (!medias || medias.length === 0) return false;
        const avgMedia = medias.reduce((sum, m) => sum + m, 0) / medias.length;
        return avgMedia >= 10;
      });
      const positivosM = positivosAlunos.filter(a => (a.profiles as any)?.sexo === "F").length;
      const positivosHM = positivosAlunos.length;

      stats.push({
        turma: turma.nome,
        classe: turma.classe,
        matriculados_m: matriculadosM,
        matriculados_hm: matriculadosHM,
        desistentes_m: desistentesM,
        desistentes_hm: desistentesHM,
        transferidos_m: transferidosM,
        transferidos_hm: transferidosHM,
        pdf_m: pdfM,
        pdf_hm: pdfHM,
        avaliados_m: avaliadosM,
        avaliados_hm: avaliadosHM,
        positivos_m: positivosM,
        positivos_hm: positivosHM,
        percentagem_positivos: avaliadosHM > 0 ? (positivosHM / avaliadosHM) * 100 : 0,
      });
    }

    setTurmaStats(stats);
  };

  const fetchVerbetes = async () => {
    const { data: alunos, error: alunosError } = await supabase
      .from("alunos")
      .select(`
        id,
        estado,
        profiles:user_id (nome_completo, sexo)
      `)
      .eq("turma_id", selectedTurma)
      .eq("estado", "activo");

    if (alunosError) throw alunosError;

    const alunoIds = alunos?.map(a => a.id) || [];
    if (alunoIds.length === 0) {
      setVerbetesData([]);
      setDisciplinas([]);
      return;
    }

    const { data: notas, error: notasError } = await getNotasQuery(alunoIds);
    if (notasError) throw notasError;

    const uniqueDisciplinas = [...new Set(notas?.map(n => (n.disciplina as any)?.nome).filter(Boolean))].sort();
    setDisciplinas(uniqueDisciplinas);

    const verbetes: AlunoNota[] = (alunos || []).map(aluno => {
      const alunoNotas = notas?.filter(n => n.aluno_id === aluno.id) || [];
      
      return {
        id: aluno.id,
        nome: (aluno.profiles as any)?.nome_completo || "N/A",
        sexo: (aluno.profiles as any)?.sexo === "F" ? "F" : "M",
        estado: aluno.estado || "activo",
        notas: uniqueDisciplinas.map(disc => {
          const notasDisciplina = alunoNotas.filter(n => (n.disciplina as any)?.nome === disc);
          
          if (periodoType === "anual" && notasDisciplina.length > 0) {
            // Calculate annual averages
            const avg = (field: string) => {
              const values = notasDisciplina.map(n => (n as any)[field]).filter((v: any) => v !== null);
              return values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : null;
            };
            
            return {
              disciplina: disc,
              nota_as1: avg("nota_as1"),
              nota_as2: avg("nota_as2"),
              nota_as3: avg("nota_as3"),
              nota_at: avg("nota_at"),
              media_as: avg("media_as"),
              media_trimestral: avg("media_trimestral"),
            };
          } else {
            const nota = notasDisciplina[0];
            return {
              disciplina: disc,
              nota_as1: nota?.nota_as1 ?? null,
              nota_as2: nota?.nota_as2 ?? null,
              nota_as3: nota?.nota_as3 ?? null,
              nota_at: nota?.nota_at ?? null,
              media_as: nota?.media_as ?? null,
              media_trimestral: nota?.media_trimestral ?? null,
            };
          }
        }),
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));

    setVerbetesData(verbetes);
  };

  const getPeriodoLabel = () => {
    if (periodoType === "anual") return "Anual";
    return `${selectedTrimestre}º Trimestre`;
  };

  const handleExportExcel = async () => {
    const turmaInfo = turmas.find(t => t.id === selectedTurma);
    const anoInfo = anosLectivos.find(a => a.id === selectedAnoLectivo);
    const periodoLabel = getPeriodoLabel();
    
    let exportData: any[] = [];
    let columns: any[] = [];
    let filename = "";

    if (reportType === "aproveitamento_disciplina") {
      exportData = disciplinaStats.map(d => ({
        disciplina: d.nome,
        matriculados_hm: d.matriculados_hm,
        avaliados_m: d.avaliados_m,
        avaliados_hm: d.avaliados_hm,
        percentagem_avaliados: `${d.percentagem_avaliados.toFixed(1)}%`,
        positivos_h: d.positivos_h,
        positivos_m: d.positivos_m,
        positivos_hm: d.positivos_hm,
        escala_0_9: d.escala_0_9,
        escala_10_13: d.escala_10_13,
        escala_14_20: d.escala_14_20,
        soma_total: d.soma_total.toFixed(1),
        nota_media: d.nota_media.toFixed(1),
      }));
      columns = [
        { header: "Disciplina", key: "disciplina", width: 25 },
        { header: "Matriculados (HM)", key: "matriculados_hm", width: 15 },
        { header: "Avaliados (M)", key: "avaliados_m", width: 12 },
        { header: "Avaliados (HM)", key: "avaliados_hm", width: 13 },
        { header: "% Avaliados", key: "percentagem_avaliados", width: 12 },
        { header: "Positivos (H)", key: "positivos_h", width: 12 },
        { header: "Positivos (M)", key: "positivos_m", width: 12 },
        { header: "Positivos (HM)", key: "positivos_hm", width: 13 },
        { header: "0-9", key: "escala_0_9", width: 8 },
        { header: "10-13", key: "escala_10_13", width: 8 },
        { header: "14-20", key: "escala_14_20", width: 8 },
        { header: "Soma Total", key: "soma_total", width: 12 },
        { header: "Nota Média", key: "nota_media", width: 12 },
      ];
      filename = `Aproveitamento_Disciplina_${turmaInfo?.nome || 'Turma'}_${periodoLabel}_${anoInfo?.ano || ''}`;
    } else if (reportType === "aproveitamento_geral") {
      exportData = turmaStats.map(t => ({
        turma: `${t.classe}ª ${t.turma}`,
        matriculados_m: t.matriculados_m,
        matriculados_hm: t.matriculados_hm,
        desistentes_m: t.desistentes_m,
        desistentes_hm: t.desistentes_hm,
        transferidos_m: t.transferidos_m,
        transferidos_hm: t.transferidos_hm,
        pdf_m: t.pdf_m,
        pdf_hm: t.pdf_hm,
        avaliados_m: t.avaliados_m,
        avaliados_hm: t.avaliados_hm,
        positivos_m: t.positivos_m,
        positivos_hm: t.positivos_hm,
        percentagem_positivos: `${t.percentagem_positivos.toFixed(1)}%`,
      }));
      columns = [
        { header: "Turma", key: "turma", width: 15 },
        { header: "Matriculados (M)", key: "matriculados_m", width: 15 },
        { header: "Matriculados (HM)", key: "matriculados_hm", width: 16 },
        { header: "Desistentes (M)", key: "desistentes_m", width: 14 },
        { header: "Desistentes (HM)", key: "desistentes_hm", width: 15 },
        { header: "Transferidos (M)", key: "transferidos_m", width: 15 },
        { header: "Transferidos (HM)", key: "transferidos_hm", width: 16 },
        { header: "PDF (M)", key: "pdf_m", width: 10 },
        { header: "PDF (HM)", key: "pdf_hm", width: 10 },
        { header: "Avaliados (M)", key: "avaliados_m", width: 13 },
        { header: "Avaliados (HM)", key: "avaliados_hm", width: 14 },
        { header: "Positivos (M)", key: "positivos_m", width: 13 },
        { header: "Positivos (HM)", key: "positivos_hm", width: 14 },
        { header: "% Positivos", key: "percentagem_positivos", width: 12 },
      ];
      filename = `Aproveitamento_Geral_${periodoLabel}_${anoInfo?.ano || ''}`;
    } else if (reportType === "verbetes") {
      exportData = verbetesData.map(aluno => {
        const row: any = {
          nome: aluno.nome,
          sexo: aluno.sexo,
        };
        aluno.notas.forEach(nota => {
          row[`${nota.disciplina}_AS1`] = nota.nota_as1?.toFixed(1) ?? "-";
          row[`${nota.disciplina}_AS2`] = nota.nota_as2?.toFixed(1) ?? "-";
          row[`${nota.disciplina}_AS3`] = nota.nota_as3?.toFixed(1) ?? "-";
          row[`${nota.disciplina}_AT`] = nota.nota_at?.toFixed(1) ?? "-";
          row[`${nota.disciplina}_Media`] = nota.media_trimestral?.toFixed(1) ?? "-";
        });
        return row;
      });
      columns = [
        { header: "Nome do Aluno", key: "nome", width: 30 },
        { header: "Sexo", key: "sexo", width: 8 },
      ];
      disciplinas.forEach(disc => {
        columns.push({ header: `${disc} AS1`, key: `${disc}_AS1`, width: 8 });
        columns.push({ header: `${disc} AS2`, key: `${disc}_AS2`, width: 8 });
        columns.push({ header: `${disc} AS3`, key: `${disc}_AS3`, width: 8 });
        columns.push({ header: `${disc} AT`, key: `${disc}_AT`, width: 8 });
        columns.push({ header: `${disc} Média`, key: `${disc}_Media`, width: 10 });
      });
      filename = `Verbetes_${turmaInfo?.nome || 'Turma'}_${periodoLabel}_${anoInfo?.ano || ''}`;
    }

    if (exportData.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const result = await exportToExcel(exportData, {
      filename,
      sheetName: "Relatório",
      columns,
    });

    if (result.success) {
      toast({
        title: "Exportado",
        description: "Ficheiro Excel gerado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o ficheiro.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    const turmaInfo = turmas.find(t => t.id === selectedTurma);
    const anoInfo = anosLectivos.find(a => a.id === selectedAnoLectivo);
    const periodoLabel = getPeriodoLabel();

    const reportInfo = {
      reportType,
      periodo: periodoLabel,
      anoLectivo: anoInfo?.ano || "",
      turma: turmaInfo?.nome,
      classe: turmaInfo?.classe,
    };

    let result: { success: boolean; path?: string; error?: string };

    if (reportType === "aproveitamento_disciplina") {
      if (disciplinaStats.length === 0) {
        toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
        return;
      }
      result = await generateAproveitamentoDisciplinaPDF(disciplinaStats, reportInfo);
    } else if (reportType === "aproveitamento_geral") {
      if (turmaStats.length === 0) {
        toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
        return;
      }
      result = await generateAproveitamentoGeralPDF(turmaStats, reportInfo);
    } else {
      if (verbetesData.length === 0) {
        toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
        return;
      }
      result = await generateVerbetesPDF(verbetesData, disciplinas, reportInfo);
    }

    if (result.success) {
      toast({
        title: "PDF Gerado",
        description: result.path ? "Ficheiro PDF guardado com sucesso." : "Ficheiro PDF gerado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  };

  const renderAproveitamentoDisciplina = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Aproveitamento Pedagógico por Disciplina</CardTitle>
        <CardDescription>Estatísticas detalhadas por disciplina - {getPeriodoLabel()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-center">Matr. (HM)</TableHead>
                <TableHead className="text-center">Aval. (M)</TableHead>
                <TableHead className="text-center">Aval. (HM)</TableHead>
                <TableHead className="text-center">% Aval.</TableHead>
                <TableHead className="text-center">Pos. (H)</TableHead>
                <TableHead className="text-center">Pos. (M)</TableHead>
                <TableHead className="text-center">Pos. (HM)</TableHead>
                <TableHead className="text-center">0-9</TableHead>
                <TableHead className="text-center">10-13</TableHead>
                <TableHead className="text-center">14-20</TableHead>
                <TableHead className="text-center">Soma</TableHead>
                <TableHead className="text-center">Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinaStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                disciplinaStats.map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stat.nome}</TableCell>
                    <TableCell className="text-center">{stat.matriculados_hm}</TableCell>
                    <TableCell className="text-center">{stat.avaliados_m}</TableCell>
                    <TableCell className="text-center">{stat.avaliados_hm}</TableCell>
                    <TableCell className="text-center">{stat.percentagem_avaliados.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{stat.positivos_h}</TableCell>
                    <TableCell className="text-center">{stat.positivos_m}</TableCell>
                    <TableCell className="text-center">{stat.positivos_hm}</TableCell>
                    <TableCell className="text-center text-destructive">{stat.escala_0_9}</TableCell>
                    <TableCell className="text-center text-warning">{stat.escala_10_13}</TableCell>
                    <TableCell className="text-center text-success">{stat.escala_14_20}</TableCell>
                    <TableCell className="text-center">{stat.soma_total.toFixed(1)}</TableCell>
                    <TableCell className="text-center font-bold">{stat.nota_media.toFixed(1)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderAproveitamentoGeral = () => (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Aproveitamento Pedagógico Geral</CardTitle>
        <CardDescription>Estatísticas gerais por turma - {getPeriodoLabel()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turma</TableHead>
                <TableHead className="text-center">Matr. (M)</TableHead>
                <TableHead className="text-center">Matr. (HM)</TableHead>
                <TableHead className="text-center">Desist. (M)</TableHead>
                <TableHead className="text-center">Desist. (HM)</TableHead>
                <TableHead className="text-center">Transf. (M)</TableHead>
                <TableHead className="text-center">Transf. (HM)</TableHead>
                <TableHead className="text-center">PDF (M)</TableHead>
                <TableHead className="text-center">PDF (HM)</TableHead>
                <TableHead className="text-center">Aval. (M)</TableHead>
                <TableHead className="text-center">Aval. (HM)</TableHead>
                <TableHead className="text-center">Pos. (M)</TableHead>
                <TableHead className="text-center">Pos. (HM)</TableHead>
                <TableHead className="text-center">% Pos.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turmaStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                turmaStats.map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stat.classe}ª {stat.turma}</TableCell>
                    <TableCell className="text-center">{stat.matriculados_m}</TableCell>
                    <TableCell className="text-center">{stat.matriculados_hm}</TableCell>
                    <TableCell className="text-center">{stat.desistentes_m}</TableCell>
                    <TableCell className="text-center">{stat.desistentes_hm}</TableCell>
                    <TableCell className="text-center">{stat.transferidos_m}</TableCell>
                    <TableCell className="text-center">{stat.transferidos_hm}</TableCell>
                    <TableCell className="text-center">{stat.pdf_m}</TableCell>
                    <TableCell className="text-center">{stat.pdf_hm}</TableCell>
                    <TableCell className="text-center">{stat.avaliados_m}</TableCell>
                    <TableCell className="text-center">{stat.avaliados_hm}</TableCell>
                    <TableCell className="text-center text-success">{stat.positivos_m}</TableCell>
                    <TableCell className="text-center text-success">{stat.positivos_hm}</TableCell>
                    <TableCell className="text-center font-bold">{stat.percentagem_positivos.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderVerbetes = () => (
    <Card>
      <CardHeader>
        <CardTitle>Verbetes</CardTitle>
        <CardDescription>Notas detalhadas por aluno e disciplina - {getPeriodoLabel()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10">Nome do Aluno</TableHead>
                <TableHead className="text-center">Sexo</TableHead>
                {disciplinas.map(disc => (
                  <TableHead key={disc} colSpan={5} className="text-center border-l">
                    {disc}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                <TableHead></TableHead>
                {disciplinas.map(disc => (
                  <>
                    <TableHead key={`${disc}-as1`} className="text-center text-xs border-l">AS1</TableHead>
                    <TableHead key={`${disc}-as2`} className="text-center text-xs">AS2</TableHead>
                    <TableHead key={`${disc}-as3`} className="text-center text-xs">AS3</TableHead>
                    <TableHead key={`${disc}-at`} className="text-center text-xs">AT</TableHead>
                    <TableHead key={`${disc}-media`} className="text-center text-xs font-bold">Média</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {verbetesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + disciplinas.length * 5} className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                verbetesData.map((aluno, idx) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">{idx + 1}. {aluno.nome}</TableCell>
                    <TableCell className="text-center">{aluno.sexo}</TableCell>
                    {aluno.notas.map((nota, nIdx) => (
                      <>
                        <TableCell key={`${aluno.id}-${nIdx}-as1`} className="text-center border-l">{nota.nota_as1?.toFixed(1) ?? "-"}</TableCell>
                        <TableCell key={`${aluno.id}-${nIdx}-as2`} className="text-center">{nota.nota_as2?.toFixed(1) ?? "-"}</TableCell>
                        <TableCell key={`${aluno.id}-${nIdx}-as3`} className="text-center">{nota.nota_as3?.toFixed(1) ?? "-"}</TableCell>
                        <TableCell key={`${aluno.id}-${nIdx}-at`} className="text-center">{nota.nota_at?.toFixed(1) ?? "-"}</TableCell>
                        <TableCell 
                          key={`${aluno.id}-${nIdx}-media`} 
                          className={`text-center font-bold ${nota.media_trimestral !== null ? (nota.media_trimestral >= 10 ? 'text-success' : 'text-destructive') : ''}`}
                        >
                          {nota.media_trimestral?.toFixed(1) ?? "-"}
                        </TableCell>
                      </>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/pedagogico")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Relatórios Pedagógicos</h2>
              <p className="text-muted-foreground">Visualizar estatísticas de aproveitamento</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione os parâmetros do relatório</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Relatório</label>
                <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aproveitamento_disciplina">Aproveitamento por Disciplina</SelectItem>
                    <SelectItem value="aproveitamento_geral">Aproveitamento Geral</SelectItem>
                    <SelectItem value="verbetes">Verbetes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ano Lectivo</label>
                <Select value={selectedAnoLectivo} onValueChange={setSelectedAnoLectivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosLectivos.map((ano) => (
                      <SelectItem key={ano.id} value={ano.id}>
                        {ano.ano} {ano.activo && "(Activo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {reportType !== "aproveitamento_geral" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turma</label>
                  <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome} ({turma.classe}ª)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <Select value={periodoType} onValueChange={(v) => setPeriodoType(v as PeriodoType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodoType === "trimestral" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trimestre</label>
                  <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o trimestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º Trimestre</SelectItem>
                      <SelectItem value="2">2º Trimestre</SelectItem>
                      <SelectItem value="3">3º Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {reportType === "aproveitamento_disciplina" && renderAproveitamentoDisciplina()}
        {reportType === "aproveitamento_geral" && renderAproveitamentoGeral()}
        {reportType === "verbetes" && renderVerbetes()}
      </div>
    </Layout>
  );
};

export default RelatoriosPedagogicos;
