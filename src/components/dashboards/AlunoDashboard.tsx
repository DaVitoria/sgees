import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, FileText, TrendingUp, Award, BookOpen, Download, Loader2, Filter, Calendar, History, CheckCircle, XCircle, Clock, ArrowRight, Phone, Mail, FileEdit, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LineChart, Line } from "recharts";
import { generateBoletimPDF } from "@/utils/generateBoletimPDF";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

interface AnoLectivo {
  id: string;
  ano: string;
  activo: boolean;
}

interface Matricula {
  id: string;
  ano_lectivo_id: string;
  turma_id: string | null;
  status: string;
  estado: string;
  turmas: {
    id: string;
    nome: string;
    classe: number;
  } | null;
  anos_lectivos: {
    id: string;
    ano: string;
  } | null;
}

interface HistoricoAno {
  anoLectivo: string;
  anoLectivoId: string;
  classe: number;
  turma: string;
  mediaAnual: number | null;
  status: 'aprovado' | 'reprovado' | 'em_curso' | 'em_exame';
  disciplinas: number;
  notasLancadas: number;
}

export const AlunoDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState<any>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [filteredNotas, setFilteredNotas] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [trimestreData, setTrimestreData] = useState<any[]>([]);
  const [mediaAnual, setMediaAnual] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [historico, setHistorico] = useState<HistoricoAno[]>([]);
  const [progressaoData, setProgressaoData] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  
  // Filter states
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [selectedAnoLectivo, setSelectedAnoLectivo] = useState<string>("todos");
  const [selectedClasse, setSelectedClasse] = useState<string>("todas");
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>("todos");
  const [availableClasses, setAvailableClasses] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchAlunoData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [notas, selectedAnoLectivo, selectedClasse, selectedTrimestre]);

  const fetchAlunoData = async () => {
    try {
      // Buscar dados do aluno
      const { data: alunoData } = await supabase
        .from("alunos")
        .select(`
          *,
          profiles!fk_alunos_user(nome_completo),
          turmas!fk_alunos_turma(id, nome, classe)
        `)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!alunoData) {
        setLoading(false);
        return;
      }

      setAluno(alunoData);

      // Buscar todos os anos lectivos
      const { data: anosData } = await supabase
        .from("anos_lectivos")
        .select("*")
        .order("ano", { ascending: false });

      setAnosLectivos(anosData || []);

      // Buscar matrículas do aluno (histórico)
      const { data: matriculasData } = await supabase
        .from("matriculas")
        .select(`
          id,
          ano_lectivo_id,
          turma_id,
          status,
          estado,
          turmas!fk_matriculas_turma_id (id, nome, classe),
          anos_lectivos!fk_matriculas_ano_lectivo_id (id, ano)
        `)
        .eq("aluno_id", alunoData.id)
        .order("created_at", { ascending: false });

      setMatriculas(matriculasData as unknown as Matricula[] || []);

      // Extrair classes únicas
      const classes = [...new Set(matriculasData?.map(m => (m.turmas as any)?.classe).filter(Boolean))];
      setAvailableClasses(classes.sort((a, b) => a - b));

      // Set default to active ano lectivo
      const activeAno = anosData?.find(a => a.activo);
      if (activeAno) {
        setSelectedAnoLectivo(activeAno.id);
      }

      // Buscar todas as notas do aluno
      const { data: notasData } = await supabase
        .from("notas")
        .select(`
          *,
          disciplinas!fk_notas_disciplina(nome, codigo),
          anos_lectivos!fk_notas_ano_lectivo(id, ano)
        `)
        .eq("aluno_id", alunoData.id)
        .order("trimestre");

      setNotas(notasData || []);

      // Buscar exames do aluno
      const { data: examesData } = await supabase
        .from("exames")
        .select(`
          *,
          disciplinas!disciplina_id(nome, codigo),
          anos_lectivos!ano_lectivo_id(id, ano)
        `)
        .eq("aluno_id", alunoData.id)
        .order("data_exame", { ascending: true, nullsFirst: false });

      setExames(examesData || []);

      // Compute academic history
      computeHistorico(matriculasData as unknown as Matricula[], notasData || [], anosData || []);

    } catch (error) {
      console.error("Erro ao carregar dados do aluno:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeHistorico = (matriculasData: Matricula[], notasData: any[], anosData: AnoLectivo[]) => {
    const historicoMap: Record<string, HistoricoAno> = {};

    // Group matriculas by ano lectivo
    matriculasData.forEach(matricula => {
      const anoId = matricula.ano_lectivo_id;
      const ano = (matricula.anos_lectivos as any)?.ano || "";
      const turma = (matricula.turmas as any)?.nome || "";
      const classe = (matricula.turmas as any)?.classe || 0;

      if (!historicoMap[anoId]) {
        historicoMap[anoId] = {
          anoLectivo: ano,
          anoLectivoId: anoId,
          classe,
          turma,
          mediaAnual: null,
          status: 'em_curso',
          disciplinas: 0,
          notasLancadas: 0
        };
      }
    });

    // Calculate media anual for each ano lectivo
    Object.keys(historicoMap).forEach(anoId => {
      const notasDoAno = notasData.filter(n => n.ano_lectivo_id === anoId);
      
      if (notasDoAno.length > 0) {
        // Group by disciplina and calculate annual average per disciplina
        const notasPorDisciplina: Record<string, number[]> = {};
        
        notasDoAno.forEach(nota => {
          const discId = nota.disciplina_id;
          if (!notasPorDisciplina[discId]) {
            notasPorDisciplina[discId] = [];
          }
          if (nota.media_trimestral) {
            notasPorDisciplina[discId].push(Number(nota.media_trimestral));
          }
        });

        const disciplinasCount = Object.keys(notasPorDisciplina).length;
        historicoMap[anoId].disciplinas = disciplinasCount;
        historicoMap[anoId].notasLancadas = notasDoAno.length;

        // Calculate overall annual average (MA)
        const mediasAnuaisPorDisciplina = Object.values(notasPorDisciplina).map(notas => {
          return notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
        });

        if (mediasAnuaisPorDisciplina.length > 0) {
          const mediaAnual = mediasAnuaisPorDisciplina.reduce((a, b) => a + b, 0) / mediasAnuaisPorDisciplina.length;
          historicoMap[anoId].mediaAnual = Number(mediaAnual.toFixed(2));

          // Determine status
          const anoInfo = anosData.find(a => a.id === anoId);
          if (anoInfo?.activo) {
            historicoMap[anoId].status = 'em_curso';
          } else if (mediaAnual >= 10) {
            historicoMap[anoId].status = 'aprovado';
          } else if (mediaAnual >= 7) {
            historicoMap[anoId].status = 'em_exame';
          } else {
            historicoMap[anoId].status = 'reprovado';
          }
        }
      }
    });

    // Sort by ano lectivo (ascending)
    const historicoArray = Object.values(historicoMap).sort((a, b) => {
      return a.anoLectivo.localeCompare(b.anoLectivo);
    });

    setHistorico(historicoArray);

    // Create progression data for chart
    const progressao = historicoArray.map(h => ({
      ano: h.anoLectivo,
      classe: h.classe,
      media: h.mediaAnual || 0
    }));
    setProgressaoData(progressao);
  };

  const applyFilters = () => {
    let filtered = [...notas];

    // Filter by ano lectivo
    if (selectedAnoLectivo !== "todos") {
      filtered = filtered.filter(n => n.ano_lectivo_id === selectedAnoLectivo);
    }

    // Filter by classe (through matriculas)
    if (selectedClasse !== "todas") {
      const matriculasNaClasse = matriculas.filter(m => (m.turmas as any)?.classe === parseInt(selectedClasse));
      const anoLectivosIds = matriculasNaClasse.map(m => m.ano_lectivo_id);
      filtered = filtered.filter(n => anoLectivosIds.includes(n.ano_lectivo_id));
    }

    // Filter by trimestre
    if (selectedTrimestre !== "todos") {
      filtered = filtered.filter(n => n.trimestre === parseInt(selectedTrimestre));
    }

    setFilteredNotas(filtered);

    // Update charts data based on filtered notes
    updateChartsData(filtered);
  };

  const updateChartsData = (notasData: any[]) => {
    // Agrupar notas por disciplina para radar chart
    const notasPorDisciplina = notasData.reduce((acc: any, nota) => {
      const disciplina = nota.disciplinas?.nome || "Outra";
      if (!acc[disciplina]) {
        acc[disciplina] = { disciplina, notas: [] };
      }
      if (nota.media_trimestral) {
        acc[disciplina].notas.push(nota.media_trimestral);
      }
      return acc;
    }, {});

    const radarData = Object.values(notasPorDisciplina).map((d: any) => ({
      disciplina: d.disciplina,
      media: d.notas.length > 0 ? (d.notas.reduce((a: number, b: number) => a + b, 0) / d.notas.length).toFixed(1) : 0,
    }));
    setPerformanceData(radarData);

    // Dados por trimestre
    const trimestreStats = notasData.reduce((acc: any, nota) => {
      if (!acc[nota.trimestre]) {
        acc[nota.trimestre] = { trimestre: `${nota.trimestre}º Trim`, total: 0, count: 0 };
      }
      if (nota.media_trimestral) {
        acc[nota.trimestre].total += Number(nota.media_trimestral);
        acc[nota.trimestre].count += 1;
      }
      return acc;
    }, {});

    const trimData = Object.values(trimestreStats).map((t: any) => ({
      trimestre: t.trimestre,
      media: t.count > 0 ? Number((t.total / t.count).toFixed(1)) : 0,
    }));
    setTrimestreData(trimData);

    // Calcular Média Anual (MA)
    if (trimData.length > 0) {
      const maTotal = trimData.reduce((acc: number, t: any) => acc + t.media, 0);
      setMediaAnual(Number((maTotal / trimData.length).toFixed(2)));
    } else {
      setMediaAnual(null);
    }
  };

  const calcularMediaGeral = () => {
    const medias = filteredNotas.map(n => n.media_trimestral).filter(m => m !== null);
    return medias.length > 0 ? (medias.reduce((acc, m) => acc + Number(m), 0) / medias.length).toFixed(1) : 0;
  };

  const getStatusAprovacao = (media: number) => {
    if (media >= 10) return { label: "Aprovado", color: "text-green-600", bg: "bg-green-100" };
    if (media >= 7) return { label: "Em Exame", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Reprovado", color: "text-red-600", bg: "bg-red-100" };
  };

  const getSelectedAnoLectivoNome = () => {
    if (selectedAnoLectivo === "todos") return "Todos";
    return anosLectivos.find(a => a.id === selectedAnoLectivo)?.ano || "";
  };

  const handleDownloadBoletim = () => {
    if (!aluno || filteredNotas.length === 0) {
      toast({
        title: "Sem dados disponíveis",
        description: "Não há notas para os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPDF(true);

    try {
      const anoLectivoNome = getSelectedAnoLectivoNome();
      const boletimData = {
        aluno: {
          nome: aluno.profiles?.nome_completo || "N/A",
          matricula: aluno.numero_matricula,
          turma: aluno.turmas?.nome || "N/A",
          classe: aluno.turmas?.classe || 0,
        },
        notas: filteredNotas.map(nota => ({
          disciplina: nota.disciplinas?.nome || "N/A",
          trimestre: nota.trimestre,
          nota_as1: nota.nota_as1,
          nota_as2: nota.nota_as2,
          nota_as3: nota.nota_as3,
          media_as: nota.media_as,
          nota_at: nota.nota_at,
          media_trimestral: nota.media_trimestral,
        })),
        mediaAnual,
        anoLectivo: anoLectivoNome,
      };

      generateBoletimPDF(boletimData);

      toast({
        title: "Boletim gerado!",
        description: "O seu boletim de notas foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar boletim",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const clearFilters = () => {
    const activeAno = anosLectivos.find(a => a.activo);
    setSelectedAnoLectivo(activeAno?.id || "todos");
    setSelectedClasse("todas");
    setSelectedTrimestre("todos");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">A carregar dados...</p>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Portal do Aluno</CardTitle>
            <CardDescription>
              Nenhum registo de aluno encontrado para esta conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">O que pode estar a acontecer:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>A sua conta ainda não foi associada a um registo de aluno</li>
                <li>O processo de matrícula ainda não foi concluído</li>
                <li>A secretaria ainda não activou o seu acesso</li>
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left">
              <p className="text-sm">
                <strong className="text-primary">Próximos passos:</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Por favor, contacte a secretaria da escola para verificar o estado da sua matrícula e activar o acesso ao portal.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href="tel:+258841234567">
                  <Phone className="h-4 w-4 mr-2" />
                  +258 84 123 4567
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="mailto:secretaria@escola.co.mz">
                  <Mail className="h-4 w-4 mr-2" />
                  secretaria@escola.co.mz
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mediaGeral = Number(calcularMediaGeral());
  const status = getStatusAprovacao(mediaAnual || mediaGeral);

  // Get current matricula status
  const currentMatricula = matriculas.find(m => m.anos_lectivos?.id === selectedAnoLectivo) || matriculas[0];
  const matriculaStatus = currentMatricula?.status || "pendente";
  const statusColors = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    aprovada: "bg-green-100 text-green-800 border-green-200",
    rejeitada: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Matrícula Status Alert */}
      {matriculaStatus === "pendente" && (
        <Card className="border-yellow-500/50 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">Matrícula Pendente</p>
              <p className="text-sm text-yellow-700">
                Sua matrícula está aguardando aprovação da secretaria. Você será notificado quando for aprovada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acompanhamento Matrícula Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Status da Matrícula</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o progresso da sua candidatura
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/acompanhamento-matricula')} className="gap-2">
              Ver Progresso
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meu Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {aluno?.profiles?.nome_completo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/auto-matricula')} variant="outline" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Renovar Matrícula
          </Button>
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            {getSelectedAnoLectivoNome()}
          </Badge>
          {selectedClasse !== "todas" && (
            <Badge variant="outline" className="text-sm">
              {selectedClasse}ª Classe
            </Badge>
          )}
          {selectedTrimestre !== "todos" && (
            <Badge variant="outline" className="text-sm">
              {selectedTrimestre}º Trimestre
            </Badge>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os dados por ano lectivo, classe e trimestre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano Lectivo</label>
              <Select value={selectedAnoLectivo} onValueChange={setSelectedAnoLectivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosLectivos.map((ano) => (
                    <SelectItem key={ano.id} value={ano.id}>
                      {ano.ano} {ano.activo && "(Activo)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Classe</label>
              <Select value={selectedClasse} onValueChange={setSelectedClasse}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as classes</SelectItem>
                  {availableClasses.map((classe) => (
                    <SelectItem key={classe} value={classe.toString()}>
                      {classe}ª Classe
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trimestre</label>
              <Select value={selectedTrimestre} onValueChange={setSelectedTrimestre}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o trimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os trimestres</SelectItem>
                  <SelectItem value="1">1º Trimestre</SelectItem>
                  <SelectItem value="2">2º Trimestre</SelectItem>
                  <SelectItem value="3">3º Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matrícula</p>
              <p className="text-lg font-bold">{aluno?.numero_matricula}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turma Actual</p>
              <p className="text-lg font-bold">{aluno?.turmas?.nome || "N/A"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média {selectedTrimestre !== "todos" ? "Trimestral" : "Anual"}</p>
              <p className="text-lg font-bold">{mediaAnual?.toFixed(2) || mediaGeral || "-"}/20</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className={`${status.bg} p-2 rounded`}>
              <TrendingUp className={`h-6 w-6 ${status.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Situação</p>
              <p className={`text-lg font-bold ${status.color}`}>
                {filteredNotas.length > 0 ? status.label : "-"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Disciplina</CardTitle>
            <CardDescription>
              {filteredNotas.length > 0 ? `Baseado em ${filteredNotas.length} notas` : "Sem dados disponíveis"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={performanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="disciplina" />
                  <PolarRadiusAxis domain={[0, 20]} />
                  <Radar name="Média" dataKey="media" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sem dados para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução por Trimestre</CardTitle>
            <CardDescription>
              Média trimestral geral
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trimestreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trimestreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trimestre" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="media" name="Média Trimestral (MT)">
                    {trimestreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sem dados para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">Histórico de Notas</h3>
          <p className="text-sm text-muted-foreground">
            {filteredNotas.length} nota(s) encontrada(s)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Disciplina</th>
                <th className="text-center py-3 px-4">AS1</th>
                <th className="text-center py-3 px-4">AS2</th>
                <th className="text-center py-3 px-4">AS3</th>
                <th className="text-center py-3 px-4">MAS</th>
                <th className="text-center py-3 px-4">AT</th>
                <th className="text-center py-3 px-4">MT</th>
                <th className="text-center py-3 px-4">Trim.</th>
                <th className="text-center py-3 px-4">Ano</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-muted-foreground">
                    Nenhuma nota encontrada para os filtros selecionados
                  </td>
                </tr>
              ) : (
                filteredNotas.map((nota, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{nota.disciplinas?.nome}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as1?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as2?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as3?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4 font-medium">{nota.media_as?.toFixed(2) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_at?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${Number(nota.media_trimestral) >= 10 ? 'text-green-600' : Number(nota.media_trimestral) >= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {nota.media_trimestral?.toFixed(2) || "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{nota.trimestre}º</td>
                    <td className="text-center py-3 px-4 text-sm text-muted-foreground">
                      {nota.anos_lectivos?.ano || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {mediaAnual && filteredNotas.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Média {selectedTrimestre !== "todos" ? "Trimestral" : "Anual"}:</strong> {mediaAnual.toFixed(2)}/20 - 
              <span className={`ml-2 font-bold ${status.color}`}>{status.label}</span>
            </p>
          </div>
        )}
      </Card>

      {/* Academic History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico Escolar Completo
          </CardTitle>
          <CardDescription>
            Progressão académica ao longo dos anos lectivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progression Chart */}
          {progressaoData.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-4">Evolução da Média Anual</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progressaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis domain={[0, 20]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}`, "Média"]}
                    labelFormatter={(label) => `Ano Lectivo: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="media" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline */}
          <div className="relative">
            <h4 className="text-sm font-medium mb-4">Percurso Escolar</h4>
            {historico.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum histórico escolar encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {historico.map((item, index) => {
                  const getStatusIcon = () => {
                    switch (item.status) {
                      case 'aprovado':
                        return <CheckCircle className="h-5 w-5 text-green-500" />;
                      case 'reprovado':
                        return <XCircle className="h-5 w-5 text-red-500" />;
                      case 'em_exame':
                        return <Clock className="h-5 w-5 text-yellow-500" />;
                      default:
                        return <Clock className="h-5 w-5 text-blue-500" />;
                    }
                  };

                  const getStatusBadge = () => {
                    switch (item.status) {
                      case 'aprovado':
                        return <Badge className="bg-green-500 text-white">Aprovado</Badge>;
                      case 'reprovado':
                        return <Badge className="bg-red-500 text-white">Reprovado</Badge>;
                      case 'em_exame':
                        return <Badge className="bg-yellow-500 text-white">Em Exame</Badge>;
                      default:
                        return <Badge className="bg-blue-500 text-white">Em Curso</Badge>;
                    }
                  };

                  return (
                    <div key={item.anoLectivoId} className="relative">
                      <div className="flex items-start gap-4">
                        {/* Timeline connector */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border-2 border-primary">
                            {getStatusIcon()}
                          </div>
                          {index < historico.length - 1 && (
                            <div className="w-0.5 h-16 bg-border mt-2" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-muted/30 rounded-lg p-4 border">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{item.anoLectivo}</span>
                              {getStatusBadge()}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {item.classe}ª Classe - Turma {item.turma}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Média Anual</p>
                              <p className={`font-bold ${
                                item.mediaAnual !== null 
                                  ? item.mediaAnual >= 10 
                                    ? 'text-green-600' 
                                    : item.mediaAnual >= 7 
                                      ? 'text-yellow-600' 
                                      : 'text-red-600'
                                  : ''
                              }`}>
                                {item.mediaAnual !== null ? `${item.mediaAnual.toFixed(2)}/20` : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Disciplinas</p>
                              <p className="font-medium">{item.disciplinas}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Notas Lançadas</p>
                              <p className="font-medium">{item.notasLancadas}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Situação</p>
                              <p className={`font-medium ${
                                item.status === 'aprovado' ? 'text-green-600' :
                                item.status === 'reprovado' ? 'text-red-600' :
                                item.status === 'em_exame' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>
                                {item.status === 'aprovado' ? 'Aprovado' :
                                 item.status === 'reprovado' ? 'Reprovado' :
                                 item.status === 'em_exame' ? 'Em Exame' :
                                 'Em Curso'}
                              </p>
                            </div>
                          </div>

                          {/* Show progression arrow */}
                          {index < historico.length - 1 && item.status === 'aprovado' && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                              <ArrowRight className="h-4 w-4" />
                              <span>Progrediu para a {historico[index + 1].classe}ª classe</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exames Section */}
      {exames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Exames
            </CardTitle>
            <CardDescription>
              Exames agendados e resultados das classes 9ª, 10ª e 12ª
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Exames Agendados */}
              {exames.filter(e => e.estado === 'agendado').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    Exames Agendados
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {exames
                      .filter(e => e.estado === 'agendado')
                      .map((exame) => (
                        <div
                          key={exame.id}
                          className="p-4 border border-yellow-200 rounded-lg bg-yellow-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm">
                                {exame.disciplinas?.nome}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exame.tipo_exame.charAt(0).toUpperCase() + exame.tipo_exame.slice(1)}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Agendado
                            </Badge>
                          </div>
                          {exame.data_exame && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(exame.data_exame).toLocaleDateString('pt-MZ', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {exame.local_exame && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Award className="h-3 w-3" />
                              <span>{exame.local_exame}</span>
                            </div>
                          )}
                          {exame.numero_pauta && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Nº Pauta:</span> {exame.numero_pauta}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Exames Realizados / Com Resultado */}
              {exames.filter(e => ['realizado', 'aprovado', 'reprovado'].includes(e.estado)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Resultados de Exames
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {exames
                      .filter(e => ['realizado', 'aprovado', 'reprovado'].includes(e.estado))
                      .map((exame) => {
                        const isAprovado = exame.estado === 'aprovado';
                        const isReprovado = exame.estado === 'reprovado';
                        const cardClass = isAprovado
                          ? 'border-green-200 bg-green-50'
                          : isReprovado
                          ? 'border-red-200 bg-red-50'
                          : 'border-blue-200 bg-blue-50';

                        return (
                          <div
                            key={exame.id}
                            className={`p-4 border rounded-lg ${cardClass}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm">
                                  {exame.disciplinas?.nome}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {exame.tipo_exame.charAt(0).toUpperCase() + exame.tipo_exame.slice(1)} - {exame.classe}ª Classe
                                </p>
                              </div>
                              <Badge
                                variant={isAprovado ? 'outline' : isReprovado ? 'destructive' : 'default'}
                                className={
                                  isAprovado
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : isReprovado
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                }
                              >
                                {isAprovado ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Aprovado
                                  </>
                                ) : isReprovado ? (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reprovado
                                  </>
                                ) : (
                                  'Realizado'
                                )}
                              </Badge>
                            </div>

                            {exame.nota_exame !== null && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Nota do Exame:
                                  </span>
                                  <span className={`text-lg font-bold ${
                                    exame.nota_exame >= 10 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {exame.nota_exame.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {exame.nota_final !== null && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Nota Final:
                                  </span>
                                  <span className={`text-lg font-bold ${
                                    exame.nota_final >= 10 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {exame.nota_final.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {exame.data_exame && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(exame.data_exame).toLocaleDateString('pt-MZ', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}

                            {exame.observacoes && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Obs:</span> {exame.observacoes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Mensagem se não houver exames */}
              {exames.filter(e => ['agendado', 'realizado', 'aprovado', 'reprovado'].includes(e.estado)).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum exame registado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Boletim de Notas</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Baixe o boletim de notas com os filtros selecionados em formato PDF
          </p>
          <Button 
            className="w-full" 
            onClick={handleDownloadBoletim}
            disabled={generatingPDF || filteredNotas.length === 0}
          >
            {generatingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A gerar...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Boletim PDF
              </>
            )}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Certificados</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Aceda aos seus certificados académicos
          </p>
          <Button className="w-full" variant="outline">Ver Certificados</Button>
        </Card>
      </div>
    </div>
  );
};
