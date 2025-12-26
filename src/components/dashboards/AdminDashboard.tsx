import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, TrendingUp, GraduationCap, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { AlertasPanel } from "@/components/AlertasPanel";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalFuncionarios: 0,
    saldo: 0,
    mediaAproveitamento: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [turmaData, setTurmaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [alunosRes, professoresRes, turmasRes, funcionariosRes, financasRes, notasRes] = await Promise.all([
        supabase.from("alunos").select("id", { count: "exact" }),
        supabase.from("professores").select("id", { count: "exact" }),
        supabase.from("turmas").select("id, nome, alunos!fk_alunos_turma(id)", { count: "exact" }),
        supabase.from("funcionarios").select("id", { count: "exact" }),
        supabase.from("financas").select("tipo, valor, categoria"),
        supabase.from("notas").select("media_trimestral"),
      ]);

      // Calcular saldo
      const entradas = financasRes.data?.filter(f => f.tipo === "entrada").reduce((acc, f) => acc + Number(f.valor), 0) || 0;
      const saidas = financasRes.data?.filter(f => f.tipo === "saida").reduce((acc, f) => acc + Number(f.valor), 0) || 0;
      const saldo = entradas - saidas;

      // Calcular média de aproveitamento
      const medias = notasRes.data?.map(n => n.media_trimestral).filter(m => m !== null) || [];
      const mediaGeral = medias.length > 0 ? medias.reduce((acc, m) => acc + Number(m), 0) / medias.length : 0;

      setStats({
        totalAlunos: alunosRes.count || 0,
        totalProfessores: professoresRes.count || 0,
        totalTurmas: turmasRes.count || 0,
        totalFuncionarios: funcionariosRes.count || 0,
        saldo: saldo,
        mediaAproveitamento: Math.round(mediaGeral * 100) / 100,
      });

      // Dados para gráfico de turmas
      const turmaChartData = turmasRes.data?.slice(0, 6).map(t => ({
        nome: t.nome,
        alunos: t.alunos?.length || 0,
      })) || [];
      setTurmaData(turmaChartData);

      // Dados para gráfico financeiro (agrupado por categoria)
      const financeByCategory = financasRes.data?.reduce((acc: any, f) => {
        if (!acc[f.categoria]) {
          acc[f.categoria] = { entrada: 0, saida: 0 };
        }
        if (f.tipo === "entrada") {
          acc[f.categoria].entrada += Number(f.valor);
        } else {
          acc[f.categoria].saida += Number(f.valor);
        }
        return acc;
      }, {}) || {};

      const financeChart = Object.entries(financeByCategory).slice(0, 5).map(([categoria, valores]: any) => ({
        categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1),
        entrada: valores.entrada,
        saida: valores.saida,
      }));
      setFinanceData(financeChart);

      // Dados para gráfico de classes (distribuição de alunos por classe)
      const classeDistribution: any = {};
      turmasRes.data?.forEach(t => {
        const classe = t.nome.match(/\d+/)?.[0] || "Outra";
        if (!classeDistribution[classe]) {
          classeDistribution[classe] = 0;
        }
        classeDistribution[classe] += t.alunos?.length || 0;
      });

      const classeChart = Object.entries(classeDistribution).map(([classe, total]) => ({
        classe: `${classe}ª Classe`,
        total: total,
      }));
      setChartData(classeChart);

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Alunos",
      value: stats.totalAlunos,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Professores Ativos",
      value: stats.totalProfessores,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Saldo Actual",
      value: `${(stats.saldo / 1000).toFixed(1)}K MZN`,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Aproveitamento Médio",
      value: `${stats.mediaAproveitamento.toFixed(1)}/20`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Turmas Ativas",
      value: stats.totalTurmas,
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Funcionários",
      value: stats.totalFuncionarios,
      icon: Building2,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">A carregar dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Dashboard Administrativo</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visão geral completa da escola
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 truncate">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alertas Panel */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <AlertasPanel />
        
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Distribuição de Alunos por Classe</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ classe, total }) => `${classe}: ${total}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Alunos por Turma</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
              <BarChart data={turmaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="alunos" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Visão Financeira por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
              <BarChart data={financeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="entrada" fill="#10b981" name="Entradas" />
                <Bar dataKey="saida" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
