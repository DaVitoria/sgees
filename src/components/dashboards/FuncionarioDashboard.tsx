import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, FileText, TrendingUp, TrendingDown, UserCheck, Clock, CheckCircle, XCircle, Users, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertasPanel } from "@/components/AlertasPanel";

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

interface PendingMatricula {
  id: string;
  data_matricula: string;
  aluno: {
    id: string;
    numero_matricula: string;
    user_id: string;
    profiles: {
      nome_completo: string;
      email: string;
    };
  };
  ano_lectivo: {
    ano: string;
  };
}

interface Turma {
  id: string;
  nome: string;
  classe: number;
}

interface GenderStats {
  totalHomens: number;
  totalMulheres: number;
  alunosHomens: number;
  alunosMulheres: number;
}

export const FuncionarioDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    receitasMes: 0,
    despesasMes: 0,
    saldo: 0,
    itensInventario: 0,
    documentos: 0,
  });
  const [financeChart, setFinanceChart] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMatriculas, setPendingMatriculas] = useState<PendingMatricula[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmas, setSelectedTurmas] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [usersWithoutRole, setUsersWithoutRole] = useState(0);
  const [genderStats, setGenderStats] = useState<GenderStats>({ totalHomens: 0, totalMulheres: 0, alunosHomens: 0, alunosMulheres: 0 });

  useEffect(() => {
    fetchDashboardData();
    fetchPendingMatriculas();
    fetchTurmas();
    fetchUsersWithoutRole();
    fetchGenderStats();
  }, []);

  const fetchPendingMatriculas = async () => {
    try {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          data_matricula,
          aluno:alunos!fk_matriculas_aluno_id (
            id,
            numero_matricula,
            user_id,
            profiles!fk_alunos_user (
              nome_completo,
              email
            )
          ),
          ano_lectivo:anos_lectivos!fk_matriculas_ano_lectivo_id (
            ano
          )
        `)
        .eq("status", "pendente")
        .order("data_matricula", { ascending: false });

      if (error) throw error;
      setPendingMatriculas(data || []);
    } catch (error) {
      console.error("Erro ao carregar matrículas pendentes:", error);
    }
  };

  const fetchTurmas = async () => {
    try {
      const { data: anoActivo } = await supabase
        .from("anos_lectivos")
        .select("id")
        .eq("activo", true)
        .single();

      if (anoActivo) {
        const { data, error } = await supabase
          .from("turmas")
          .select("id, nome, classe")
          .eq("ano_lectivo_id", anoActivo.id)
          .order("classe", { ascending: true });

        if (error) throw error;
        setTurmas(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  };

  const fetchUsersWithoutRole = async () => {
    try {
      const { data, error } = await supabase.rpc("get_users_without_role_count");
      if (error) throw error;
      setUsersWithoutRole(data || 0);
    } catch (error) {
      console.error("Erro ao carregar utilizadores sem role:", error);
    }
  };

  const fetchGenderStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_gender_statistics");
      if (error) throw error;
      if (data) {
        const genderData = data as any;
        setGenderStats({
          totalHomens: genderData.total_homens || 0,
          totalMulheres: genderData.total_mulheres || 0,
          alunosHomens: genderData.alunos_homens || 0,
          alunosMulheres: genderData.alunos_mulheres || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas de género:", error);
    }
  };

  const handleApproveMatricula = async (matriculaId: string, alunoId: string) => {
    const turmaId = selectedTurmas[matriculaId];
    if (!turmaId) {
      toast({
        title: "Seleccione uma turma",
        description: "É necessário atribuir uma turma antes de aprovar a matrícula.",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(matriculaId);
    try {
      // Update matricula status and turma
      const { error: matriculaError } = await supabase
        .from("matriculas")
        .update({ status: "aprovada", turma_id: turmaId })
        .eq("id", matriculaId);

      if (matriculaError) throw matriculaError;

      // Update aluno turma
      const { error: alunoError } = await supabase
        .from("alunos")
        .update({ turma_id: turmaId, estado: "activo" })
        .eq("id", alunoId);

      if (alunoError) throw alunoError;

      toast({
        title: "Matrícula aprovada",
        description: "O aluno foi matriculado com sucesso.",
      });

      fetchPendingMatriculas();
    } catch (error) {
      console.error("Erro ao aprovar matrícula:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a matrícula.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectMatricula = async (matriculaId: string) => {
    setProcessingId(matriculaId);
    try {
      const { error } = await supabase
        .from("matriculas")
        .update({ status: "rejeitada", observacoes: "Matrícula rejeitada pela secretaria." })
        .eq("id", matriculaId);

      if (error) throw error;

      toast({
        title: "Matrícula rejeitada",
        description: "A matrícula foi rejeitada.",
      });

      fetchPendingMatriculas();
    } catch (error) {
      console.error("Erro ao rejeitar matrícula:", error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a matrícula.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [financasRes, inventarioRes, documentosRes] = await Promise.all([
        supabase.from("financas").select("tipo, valor, categoria, data_transacao"),
        supabase.from("inventario").select("id", { count: "exact" }),
        supabase.from("documentos").select("id", { count: "exact" }),
      ]);

      // Calcular receitas e despesas do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const transacoesMes = financasRes.data?.filter(f => 
        new Date(f.data_transacao) >= new Date(firstDayOfMonth)
      ) || [];

      const receitasMes = transacoesMes
        .filter(f => f.tipo === "entrada")
        .reduce((acc, f) => acc + Number(f.valor), 0);
      
      const despesasMes = transacoesMes
        .filter(f => f.tipo === "saida")
        .reduce((acc, f) => acc + Number(f.valor), 0);

      // Calcular saldo total
      const entradas = financasRes.data?.filter(f => f.tipo === "entrada").reduce((acc, f) => acc + Number(f.valor), 0) || 0;
      const saidas = financasRes.data?.filter(f => f.tipo === "saida").reduce((acc, f) => acc + Number(f.valor), 0) || 0;

      setStats({
        receitasMes,
        despesasMes,
        saldo: entradas - saidas,
        itensInventario: inventarioRes.count || 0,
        documentos: documentosRes.count || 0,
      });

      // Dados por categoria (Pie chart)
      const byCategory = financasRes.data?.reduce((acc: any, f) => {
        const key = `${f.categoria}_${f.tipo}`;
        if (!acc[key]) {
          acc[key] = { categoria: f.categoria, tipo: f.tipo, valor: 0 };
        }
        acc[key].valor += Number(f.valor);
        return acc;
      }, {}) || {};

      const categoryChart = Object.values(byCategory).slice(0, 5).map((c: any) => ({
        name: `${c.categoria} (${c.tipo === 'entrada' ? 'Entrada' : 'Saída'})`,
        value: c.valor,
      }));
      setCategoryData(categoryChart);

      // Tendência mensal (últimos 6 meses)
      const monthlyData: any = {};
      financasRes.data?.forEach(f => {
        const month = new Date(f.data_transacao).toLocaleDateString('pt-MZ', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { mes: month, entrada: 0, saida: 0 };
        }
        if (f.tipo === "entrada") {
          monthlyData[month].entrada += Number(f.valor);
        } else {
          monthlyData[month].saida += Number(f.valor);
        }
      });

      setMonthlyTrend(Object.values(monthlyData).slice(-6));

      // Dados para comparação entrada vs saída
      setFinanceChart([
        { name: "Entradas", valor: entradas },
        { name: "Saídas", valor: saidas },
      ]);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">A carregar dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Operacional</h1>
        <p className="text-muted-foreground">
          Gestão financeira e inventário
        </p>
      </div>

      {/* Alerta de utilizadores sem role */}
      {usersWithoutRole > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <UserX className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{usersWithoutRole} utilizador(es) aguardam atribuição de perfil</p>
                  <p className="text-sm text-amber-700">Existem utilizadores registados sem role atribuído.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={() => navigate("/administrativo/atribuir-roles")}
              >
                Atribuir Perfis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas de Género */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Alunos Homens</p>
              <p className="text-xl font-bold text-blue-900">{genderStats.alunosHomens}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-pink-50 border-pink-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-pink-600" />
            <div>
              <p className="text-sm text-pink-600">Alunas Mulheres</p>
              <p className="text-xl font-bold text-pink-900">{genderStats.alunosMulheres}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-indigo-50 border-indigo-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600">Total Homens (Sistema)</p>
              <p className="text-xl font-bold text-indigo-900">{genderStats.totalHomens}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600">Total Mulheres (Sistema)</p>
              <p className="text-xl font-bold text-purple-900">{genderStats.totalMulheres}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Receitas do Mês</p>
          <p className="text-2xl font-bold mt-1">{(stats.receitasMes / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Despesas do Mês</p>
          <p className="text-2xl font-bold mt-1">{(stats.despesasMes / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Saldo Actual</p>
          <p className="text-2xl font-bold mt-1">{(stats.saldo / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Itens em Inventário</p>
          <p className="text-2xl font-bold mt-1">{stats.itensInventario}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Documentos</p>
          <p className="text-2xl font-bold mt-1">{stats.documentos}</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
                <Bar dataKey="valor" fill="#3b82f6">
                  {financeChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Panel */}
      <AlertasPanel />

      <Card>
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
              <Legend />
              <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pending Enrollments Section */}
      {pendingMatriculas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Matrículas Pendentes ({pendingMatriculas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMatriculas.map((matricula) => (
                <div
                  key={matricula.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {matricula.aluno?.profiles?.nome_completo || "Nome não disponível"}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {matricula.aluno?.numero_matricula}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{matricula.aluno?.profiles?.email}</span>
                      <span className="mx-2">•</span>
                      <span>Ano Lectivo: {matricula.ano_lectivo?.ano}</span>
                      <span className="mx-2">•</span>
                      <span>Submetida: {new Date(matricula.data_matricula).toLocaleDateString('pt-MZ')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select
                      value={selectedTurmas[matricula.id] || ""}
                      onValueChange={(value) =>
                        setSelectedTurmas((prev) => ({ ...prev, [matricula.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Seleccionar turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.classe}ª Classe - {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveMatricula(matricula.id, matricula.aluno?.id)}
                        disabled={processingId === matricula.id}
                        className="flex-1 sm:flex-none"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectMatricula(matricula.id)}
                        disabled={processingId === matricula.id}
                        className="flex-1 sm:flex-none"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gestão Financeira</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerir receitas e despesas da escola
          </p>
          <Button className="w-full" onClick={() => navigate("/administrativo/gestao-financeira")}>
            Abrir Finanças
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Inventário</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Controlar materiais e equipamentos
          </p>
          <Button className="w-full">Abrir Inventário</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Documentos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerar certificados e declarações
          </p>
          <Button className="w-full">Gerar Documento</Button>
        </Card>
      </div>
    </div>
  );
};
