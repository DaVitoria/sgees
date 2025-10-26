import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, TrendingDown, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RelatoriosPedagogicos = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [stats, setStats] = useState({
    totalAlunos: 0,
    mediaGeral: 0,
    aprovados: 0,
    reprovados: 0,
    disciplinas: [] as any[],
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTurmas();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTurma) {
      fetchStats();
    }
  }, [selectedTurma]);

  const fetchTurmas = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
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
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select("id")
        .eq("turma_id", selectedTurma);

      if (alunosError) throw alunosError;

      const alunoIds = alunos?.map((a) => a.id) || [];

      if (alunoIds.length === 0) {
        setStats({
          totalAlunos: 0,
          mediaGeral: 0,
          aprovados: 0,
          reprovados: 0,
          disciplinas: [],
        });
        return;
      }

      const { data: notas, error: notasError } = await supabase
        .from("notas")
        .select(`
          *,
          disciplina:disciplinas!notas_disciplina_id_fkey(nome)
        `)
        .in("aluno_id", alunoIds);

      if (notasError) throw notasError;

      const totalAlunos = alunoIds.length;
      const medias = notas?.map((n) => n.media).filter((m) => m !== null) as number[];
      const mediaGeral = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;
      const aprovados = medias.filter((m) => m >= 10).length;
      const reprovados = medias.filter((m) => m < 10).length;

      const disciplinasMap = new Map();
      notas?.forEach((nota) => {
        const disc = (nota.disciplina as any)?.nome;
        if (!disc || !nota.media) return;
        
        if (!disciplinasMap.has(disc)) {
          disciplinasMap.set(disc, { nome: disc, medias: [] });
        }
        disciplinasMap.get(disc).medias.push(nota.media);
      });

      const disciplinas = Array.from(disciplinasMap.values()).map((d) => ({
        nome: d.nome,
        media: d.medias.reduce((a: number, b: number) => a + b, 0) / d.medias.length,
      }));

      setStats({
        totalAlunos,
        mediaGeral,
        aprovados,
        reprovados,
        disciplinas,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar estatísticas",
        description: error.message,
        variant: "destructive",
      });
    }
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pedagogico")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Relatórios Pedagógicos</h2>
            <p className="text-muted-foreground">Visualizar estatísticas de aproveitamento</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Turma</CardTitle>
            <CardDescription>Escolha uma turma para ver os relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="w-full md:w-[300px]">
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
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlunos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mediaGeral.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.aprovados}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAlunos > 0 ? ((stats.aprovados / stats.totalAlunos) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.reprovados}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAlunos > 0 ? ((stats.reprovados / stats.totalAlunos) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Médias por Disciplina</CardTitle>
            <CardDescription>Desempenho dos alunos por disciplina</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.disciplinas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </p>
              ) : (
                stats.disciplinas.map((disc, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{disc.nome}</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(disc.media / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-lg font-bold">{disc.media.toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RelatoriosPedagogicos;
