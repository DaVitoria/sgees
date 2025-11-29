import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

export const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTurmas: 0,
    totalAlunos: 0,
    totalDisciplinas: 0,
    mediaGeral: 0,
  });
  const [turmas, setTurmas] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfessorData();
    }
  }, [user]);

  const fetchProfessorData = async () => {
    try {
      // Buscar professor pelo user_id
      const { data: professorData } = await supabase
        .from("professores")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!professorData) {
        setLoading(false);
        return;
      }

      // Buscar atribuições do professor
      const { data: atribuicoes } = await supabase
        .from("professor_disciplinas")
        .select(`
          *,
          turmas!turma_id(id, nome, alunos!turma_id(id)),
          disciplinas!disciplina_id(nome)
        `)
        .eq("professor_id", professorData.id);

      // Processar turmas únicas
      const turmasUnicas = atribuicoes?.reduce((acc: any[], attr: any) => {
        if (!acc.find(t => t.id === attr.turmas?.id)) {
          acc.push({
            id: attr.turmas?.id,
            nome: attr.turmas?.nome,
            alunos: attr.turmas?.alunos?.length || 0,
            disciplinas: [attr.disciplinas?.nome],
          });
        } else {
          const turma = acc.find(t => t.id === attr.turmas?.id);
          if (turma && !turma.disciplinas.includes(attr.disciplinas?.nome)) {
            turma.disciplinas.push(attr.disciplinas?.nome);
          }
        }
        return acc;
      }, []) || [];

      setTurmas(turmasUnicas);

      // Buscar notas das turmas do professor
      const turmaIds = turmasUnicas.map((t: any) => t.id);
      const { data: alunosData } = await supabase
        .from("alunos")
        .select("id")
        .in("turma_id", turmaIds);

      const alunoIds = alunosData?.map(a => a.id) || [];
      
      const { data: notasData } = await supabase
        .from("notas")
        .select("media_trimestral, trimestre, disciplinas!disciplina_id(nome)")
        .in("aluno_id", alunoIds);

      // Calcular média geral usando media_trimestral
      const medias = notasData?.map(n => n.media_trimestral).filter(m => m !== null) || [];
      const mediaGeral = medias.length > 0 ? medias.reduce((acc, m) => acc + Number(m), 0) / medias.length : 0;

      // Dados de desempenho por trimestre
      const performanceByTrimestre = notasData?.reduce((acc: any, nota) => {
        if (!acc[nota.trimestre]) {
          acc[nota.trimestre] = { trimestre: `${nota.trimestre}º Trim`, total: 0, count: 0 };
        }
        if (nota.media_trimestral) {
          acc[nota.trimestre].total += Number(nota.media_trimestral);
          acc[nota.trimestre].count += 1;
        }
        return acc;
      }, {}) || {};

      const perfChart = Object.values(performanceByTrimestre).map((p: any) => ({
        trimestre: p.trimestre,
        media: p.count > 0 ? (p.total / p.count).toFixed(1) : 0,
      }));
      setPerformanceData(perfChart);

      setStats({
        totalTurmas: turmasUnicas.length,
        totalAlunos: turmasUnicas.reduce((acc: number, t: any) => acc + t.alunos, 0),
        totalDisciplinas: atribuicoes?.length || 0,
        mediaGeral: Math.round(mediaGeral * 10) / 10,
      });

    } catch (error) {
      console.error("Erro ao carregar dados do professor:", error);
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
        <h1 className="text-3xl font-bold mb-2">Dashboard do Professor</h1>
        <p className="text-muted-foreground">
          Gerir as suas turmas e disciplinas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turmas</p>
              <p className="text-2xl font-bold">{stats.totalTurmas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <p className="text-2xl font-bold">{stats.totalAlunos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <ClipboardList className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disciplinas</p>
              <p className="text-2xl font-bold">{stats.totalDisciplinas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Geral</p>
              <p className="text-2xl font-bold">{stats.mediaGeral}/20</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trimestre" />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="media" stroke="#3b82f6" strokeWidth={2} name="Média Trimestral (MT)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alunos por Turma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turmas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alunos" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Minhas Turmas</h3>
          <Button onClick={() => navigate("/pedagogico/lancamento-notas")} size="sm">
            Lançar Notas
          </Button>
        </div>
        <div className="space-y-3">
          {turmas.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma turma atribuída</p>
          ) : (
            turmas.map((turma, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{turma.nome}</h4>
                    <p className="text-sm text-muted-foreground">{turma.disciplinas?.join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{turma.alunos} alunos</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => navigate(`/pedagogico/gestao-turmas/${turma.id}`)}
                    >
                      Ver Turma
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
