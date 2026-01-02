import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

interface DirectorTurmaInfo {
  turma_id: string;
  turma_nome: string;
  classe: number;
}

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
  const [directorTurmas, setDirectorTurmas] = useState<DirectorTurmaInfo[]>([]);

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

      // Verificar se é director de turma
      const { data: directorData } = await supabase
        .from("turmas")
        .select("id, nome, classe")
        .eq("director_turma_id", professorData.id);

      if (directorData && directorData.length > 0) {
        setDirectorTurmas(
          directorData.map((t) => ({
            turma_id: t.id,
            turma_nome: t.nome,
            classe: t.classe,
          }))
        );
      }

      // Buscar atribuições do professor
      const { data: atribuicoes } = await supabase
        .from("professor_disciplinas")
        .select(`
          *,
          turmas!fk_professor_disciplinas_turma(id, nome, alunos!fk_alunos_turma(id)),
          disciplinas!fk_professor_disciplinas_disciplina(nome)
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
        .select("media_trimestral, trimestre, disciplinas!fk_notas_disciplina(nome)")
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Dashboard do Professor</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerir as suas turmas e disciplinas
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-100 p-2 rounded flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Turmas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.totalTurmas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-green-100 p-2 rounded flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Alunos</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.totalAlunos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-purple-100 p-2 rounded flex-shrink-0">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Disciplinas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.totalDisciplinas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-orange-100 p-2 rounded flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Média Geral</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.mediaGeral}/20</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Desempenho por Trimestre</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="h-[200px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trimestre" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />
                  <Line type="monotone" dataKey="media" stroke="#3b82f6" strokeWidth={2} name="Média (MT)" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Alunos por Turma</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="h-[200px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turmas} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 9 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={50}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="alunos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {directorTurmas.length > 0 && (
        <Card className="p-3 sm:p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-semibold">Director de Turma</h3>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {directorTurmas.map((dt) => (
              <Card key={dt.turma_id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div>
                    <h4 className="font-medium text-sm sm:text-base">{dt.classe}ª Classe - {dt.turma_nome}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Turma sob sua direcção</p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/director-turma?turma=${dt.turma_id}`)}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Gerir Turma
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Minhas Turmas</h3>
          <Button onClick={() => navigate("/pedagogico/lancamento-notas")} size="sm" className="w-full sm:w-auto">
            Lançar Notas
          </Button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {turmas.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Nenhuma turma atribuída</p>
          ) : (
            turmas.map((turma, index) => (
              <Card key={index} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm sm:text-base">{turma.nome}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{turma.disciplinas?.join(", ")}</p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className="text-xs sm:text-sm font-medium">{turma.alunos} alunos</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs sm:text-sm"
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
