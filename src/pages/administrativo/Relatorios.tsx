import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, GraduationCap, UserCheck, Building2, BookOpen, 
  DollarSign, TrendingUp, TrendingDown, FileDown, Calendar,
  PieChart as PieChartIcon, BarChart3, FileSpreadsheet
} from "lucide-react";
import { exportMultiSheetExcel } from "@/utils/exportToExcel";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface SchoolStats {
  total_alunos: number;
  total_professores: number;
  total_funcionarios: number;
  total_turmas: number;
  total_disciplinas: number;
}

interface FinancialSummary {
  total_entradas: number;
  total_saidas: number;
  saldo_actual: number;
  entradas_mes_actual: number;
  saidas_mes_actual: number;
}

interface AlunosPorClasse {
  classe: number;
  total: number;
}

interface AlunosPorEstado {
  estado: string;
  total: number;
}

interface MatriculasPorMes {
  mes: string;
  total: number;
}

interface AnoLectivo {
  id: string;
  ano: string;
  activo: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Relatorios = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schoolStats, setSchoolStats] = useState<SchoolStats | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [alunosPorClasse, setAlunosPorClasse] = useState<AlunosPorClasse[]>([]);
  const [alunosPorEstado, setAlunosPorEstado] = useState<AlunosPorEstado[]>([]);
  const [matriculasPorMes, setMatriculasPorMes] = useState<MatriculasPorMes[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [selectedAno, setSelectedAno] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);

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
    if (selectedAno) {
      fetchDataByAno();
    }
  }, [selectedAno]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      // Fetch anos lectivos
      const { data: anos, error: anosError } = await supabase
        .from("anos_lectivos")
        .select("*")
        .order("ano", { ascending: false });

      if (anosError) throw anosError;

      setAnosLectivos(anos || []);
      const activeAno = anos?.find(a => a.activo);
      if (activeAno) {
        setSelectedAno(activeAno.id);
      }

      // Fetch school statistics
      const { data: stats, error: statsError } = await supabase
        .rpc("get_school_statistics");

      if (statsError) throw statsError;
      setSchoolStats(stats as unknown as SchoolStats);

      // Fetch financial summary
      const { data: financial, error: financialError } = await supabase
        .rpc("get_financial_summary");

      if (financialError) throw financialError;
      setFinancialSummary(financial as unknown as FinancialSummary);

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchDataByAno = async () => {
    try {
      // Fetch alunos por classe
      const { data: alunosClasse, error: alunosClasseError } = await supabase
        .from("alunos")
        .select(`
          turmas!inner (
            classe,
            ano_lectivo_id
          )
        `)
        .eq("estado", "activo")
        .eq("turmas.ano_lectivo_id", selectedAno);

      if (alunosClasseError) throw alunosClasseError;

      // Group by classe
      const classeCount: Record<number, number> = {};
      alunosClasse?.forEach(aluno => {
        const classe = (aluno.turmas as any)?.classe;
        if (classe) {
          classeCount[classe] = (classeCount[classe] || 0) + 1;
        }
      });

      setAlunosPorClasse(
        Object.entries(classeCount)
          .map(([classe, total]) => ({ classe: parseInt(classe), total }))
          .sort((a, b) => a.classe - b.classe)
      );

      // Fetch alunos por estado
      const { data: alunosEstado, error: alunosEstadoError } = await supabase
        .from("alunos")
        .select("estado");

      if (alunosEstadoError) throw alunosEstadoError;

      const estadoCount: Record<string, number> = {};
      alunosEstado?.forEach(aluno => {
        const estado = aluno.estado || "activo";
        estadoCount[estado] = (estadoCount[estado] || 0) + 1;
      });

      setAlunosPorEstado(
        Object.entries(estadoCount).map(([estado, total]) => ({
          estado: estado.charAt(0).toUpperCase() + estado.slice(1),
          total
        }))
      );

      // Fetch matriculas por mes
      const { data: matriculas, error: matriculasError } = await supabase
        .from("matriculas")
        .select("data_matricula")
        .eq("ano_lectivo_id", selectedAno);

      if (matriculasError) throw matriculasError;

      const mesCount: Record<string, number> = {};
      matriculas?.forEach(m => {
        if (m.data_matricula) {
          const mes = format(new Date(m.data_matricula), "MMM", { locale: pt });
          mesCount[mes] = (mesCount[mes] || 0) + 1;
        }
      });

      setMatriculasPorMes(
        Object.entries(mesCount).map(([mes, total]) => ({ mes, total }))
      );

    } catch (error: any) {
      console.error("Error fetching data by ano:", error);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const hoje = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: pt });
      const anoLectivo = anosLectivos.find(a => a.id === selectedAno)?.ano || "";

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO ADMINISTRATIVO", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Ano Lectivo: ${anoLectivo}`, pageWidth / 2, 28, { align: "center" });
      doc.text(`Data de Emissão: ${hoje}`, pageWidth / 2, 35, { align: "center" });

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(14, 40, pageWidth - 14, 40);

      // School Statistics
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. ESTATÍSTICAS GERAIS", 14, 50);

      if (schoolStats) {
        autoTable(doc, {
          startY: 55,
          head: [["Indicador", "Quantidade"]],
          body: [
            ["Total de Alunos Activos", schoolStats.total_alunos.toString()],
            ["Total de Professores", schoolStats.total_professores.toString()],
            ["Total de Funcionários", schoolStats.total_funcionarios.toString()],
            ["Total de Turmas", schoolStats.total_turmas.toString()],
            ["Total de Disciplinas", schoolStats.total_disciplinas.toString()]
          ],
          theme: "grid",
          headStyles: { fillColor: [0, 51, 102], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }

      // Alunos por Classe
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. ALUNOS POR CLASSE", 14, currentY);

      if (alunosPorClasse.length > 0) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Classe", "Quantidade de Alunos"]],
          body: alunosPorClasse.map(item => [`${item.classe}ª Classe`, item.total.toString()]),
          foot: [["TOTAL", alunosPorClasse.reduce((sum, item) => sum + item.total, 0).toString()]],
          theme: "grid",
          headStyles: { fillColor: [0, 51, 102], textColor: 255 },
          footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
          styles: { fontSize: 10 }
        });
      }

      // Financial Summary
      currentY = (doc as any).lastAutoTable.finalY + 15;

      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. RESUMO FINANCEIRO", 14, currentY);

      if (financialSummary) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Indicador", "Valor (MZN)"]],
          body: [
            ["Total de Entradas", financialSummary.total_entradas.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })],
            ["Total de Saídas", financialSummary.total_saidas.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })],
            ["Saldo Actual", financialSummary.saldo_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })],
            ["Entradas do Mês", financialSummary.entradas_mes_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })],
            ["Saídas do Mês", financialSummary.saidas_mes_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 })]
          ],
          theme: "grid",
          headStyles: { fillColor: [0, 51, 102], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }

      // Alunos por Estado
      currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("4. ALUNOS POR ESTADO", 14, currentY);

      if (alunosPorEstado.length > 0) {
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Estado", "Quantidade"]],
          body: alunosPorEstado.map(item => [item.estado, item.total.toString()]),
          theme: "grid",
          headStyles: { fillColor: [0, 51, 102], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${i} de ${totalPages} | Sistema de Gestão Escolar`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`Relatorio_Administrativo_${anoLectivo.replace("/", "-")}.pdf`);

      toast({
        title: "Relatório gerado",
        description: "O relatório foi gerado e baixado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateExcel = () => {
    const anoLectivo = anosLectivos.find(a => a.id === selectedAno)?.ano || "";
    
    const sheets = [];

    // Estatísticas Gerais
    if (schoolStats) {
      sheets.push({
        name: "Estatísticas Gerais",
        data: [
          { indicador: "Total de Alunos Activos", valor: schoolStats.total_alunos },
          { indicador: "Total de Professores", valor: schoolStats.total_professores },
          { indicador: "Total de Funcionários", valor: schoolStats.total_funcionarios },
          { indicador: "Total de Turmas", valor: schoolStats.total_turmas },
          { indicador: "Total de Disciplinas", valor: schoolStats.total_disciplinas },
        ],
        columns: [
          { header: "Indicador", key: "indicador", width: 30 },
          { header: "Quantidade", key: "valor", width: 15 },
        ],
      });
    }

    // Alunos por Classe
    if (alunosPorClasse.length > 0) {
      sheets.push({
        name: "Alunos por Classe",
        data: alunosPorClasse.map(item => ({
          classe: `${item.classe}ª Classe`,
          quantidade: item.total,
        })),
        columns: [
          { header: "Classe", key: "classe", width: 20 },
          { header: "Quantidade de Alunos", key: "quantidade", width: 20 },
        ],
      });
    }

    // Resumo Financeiro
    if (financialSummary) {
      sheets.push({
        name: "Resumo Financeiro",
        data: [
          { indicador: "Total de Entradas", valor: financialSummary.total_entradas.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) },
          { indicador: "Total de Saídas", valor: financialSummary.total_saidas.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) },
          { indicador: "Saldo Actual", valor: financialSummary.saldo_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) },
          { indicador: "Entradas do Mês", valor: financialSummary.entradas_mes_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) },
          { indicador: "Saídas do Mês", valor: financialSummary.saidas_mes_actual.toLocaleString("pt-MZ", { minimumFractionDigits: 2 }) },
        ],
        columns: [
          { header: "Indicador", key: "indicador", width: 25 },
          { header: "Valor (MZN)", key: "valor", width: 20 },
        ],
      });
    }

    // Alunos por Estado
    if (alunosPorEstado.length > 0) {
      sheets.push({
        name: "Alunos por Estado",
        data: alunosPorEstado.map(item => ({
          estado: item.estado,
          quantidade: item.total,
        })),
        columns: [
          { header: "Estado", key: "estado", width: 20 },
          { header: "Quantidade", key: "quantidade", width: 15 },
        ],
      });
    }

    // Matrículas por Mês
    if (matriculasPorMes.length > 0) {
      sheets.push({
        name: "Matrículas por Mês",
        data: matriculasPorMes.map(item => ({
          mes: item.mes,
          quantidade: item.total,
        })),
        columns: [
          { header: "Mês", key: "mes", width: 15 },
          { header: "Quantidade", key: "quantidade", width: 15 },
        ],
      });
    }

    if (sheets.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    exportMultiSheetExcel(sheets, `Relatorio_Administrativo_${anoLectivo.replace("/", "-")}`);

    toast({
      title: "Exportado",
      description: "Ficheiro Excel gerado com sucesso.",
    });
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios Administrativos</h2>
            <p className="text-muted-foreground">
              Estatísticas gerais e indicadores da escola
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={selectedAno} onValueChange={setSelectedAno}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ano Lectivo" />
              </SelectTrigger>
              <SelectContent>
                {anosLectivos.map((ano) => (
                  <SelectItem key={ano.id} value={ano.id}>
                    {ano.ano} {ano.activo && "(Activo)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateReport} disabled={generating}>
              <FileDown className="mr-2 h-4 w-4" />
              {generating ? "A gerar..." : "PDF"}
            </Button>
            <Button onClick={generateExcel} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats?.total_alunos || 0}</div>
              <p className="text-xs text-muted-foreground">Alunos activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats?.total_professores || 0}</div>
              <p className="text-xs text-muted-foreground">Docentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats?.total_funcionarios || 0}</div>
              <p className="text-xs text-muted-foreground">Não docentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turmas</CardTitle>
              <Building2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats?.total_turmas || 0}</div>
              <p className="text-xs text-muted-foreground">Turmas activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats?.total_disciplinas || 0}</div>
              <p className="text-xs text-muted-foreground">Oferecidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(financialSummary?.total_entradas || 0).toLocaleString("pt-MZ", { 
                  style: "currency", 
                  currency: "MZN" 
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mês: {(financialSummary?.entradas_mes_actual || 0).toLocaleString("pt-MZ", { 
                  style: "currency", 
                  currency: "MZN" 
                })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(financialSummary?.total_saidas || 0).toLocaleString("pt-MZ", { 
                  style: "currency", 
                  currency: "MZN" 
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Este mês: {(financialSummary?.saidas_mes_actual || 0).toLocaleString("pt-MZ", { 
                  style: "currency", 
                  currency: "MZN" 
                })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(financialSummary?.saldo_actual || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {(financialSummary?.saldo_actual || 0).toLocaleString("pt-MZ", { 
                  style: "currency", 
                  currency: "MZN" 
                })}
              </div>
              <p className="text-xs text-muted-foreground">Balanço geral</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Alunos por Classe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Alunos por Classe
              </CardTitle>
              <CardDescription>Distribuição de alunos activos por classe</CardDescription>
            </CardHeader>
            <CardContent>
              {alunosPorClasse.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={alunosPorClasse}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classe" tickFormatter={(value) => `${value}ª`} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, "Alunos"]}
                      labelFormatter={(value) => `${value}ª Classe`}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alunos por Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Alunos por Estado
              </CardTitle>
              <CardDescription>Distribuição por situação de matrícula</CardDescription>
            </CardHeader>
            <CardContent>
              {alunosPorEstado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={alunosPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ estado, percent }) => `${estado} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {alunosPorEstado.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Alunos"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Matriculas por Mes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Matrículas por Mês
            </CardTitle>
            <CardDescription>Evolução das matrículas ao longo do ano lectivo</CardDescription>
          </CardHeader>
          <CardContent>
            {matriculasPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={matriculasPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Matrículas"]} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sem dados de matrículas disponíveis
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Relatorios;
