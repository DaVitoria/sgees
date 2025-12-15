import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateTurmaReportPDF } from "@/utils/generateTurmaReportPDF";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  GraduationCap, 
  Download, 
  FileText,
  Award,
  BarChart3,
  User
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

interface TurmaInfo {
  id: string;
  nome: string;
  classe: number;
}

interface AlunoStats {
  id: string;
  numero_matricula: string;
  nome_completo: string;
  sexo: string | null;
  mediaGeral: number;
  status: 'aprovado' | 'reprovado' | 'em_exame' | 'pendente';
}

const DirectorTurma = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const turmaIdParam = searchParams.get("turma");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<TurmaInfo | null>(null);
  const [alunos, setAlunos] = useState<AlunoStats[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [genderStats, setGenderStats] = useState({ homens: 0, mulheres: 0, indefinido: 0 });
  const [approvalStats, setApprovalStats] = useState({ aprovados: 0, reprovados: 0, emExame: 0, pendentes: 0 });
  const [gradesByDiscipline, setGradesByDiscipline] = useState<any[]>([]);
  const [directorNome, setDirectorNome] = useState<string>("");
  const [anoLectivo, setAnoLectivo] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      fetchDirectorTurmaData();
    }
  }, [user, authLoading, turmaIdParam]);

  const fetchDirectorTurmaData = async () => {
    try {
      // Verificar se o professor é director de turma e buscar nome
      const { data: professorData } = await supabase
        .from("professores")
        .select("id, profiles!fk_professores_user_id(nome_completo)")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!professorData) {
        toast({
          title: "Acesso Negado",
          description: "Você não está registado como professor.",
          variant: "destructive",
        });
        navigate("/professor");
        return;
      }

      // Guardar nome do director
      const profProfile = professorData.profiles as any;
      setDirectorNome(profProfile?.nome_completo || "Director");

      // Buscar ano lectivo activo
      const { data: anoData } = await supabase
        .from("anos_lectivos")
        .select("ano")
        .eq("activo", true)
        .maybeSingle();
      
      setAnoLectivo(anoData?.ano || new Date().getFullYear().toString());

      // Buscar turma onde é director (usando o param ou a primeira turma)
      let turmaQuery = supabase
        .from("turmas")
        .select("id, nome, classe")
        .eq("director_turma_id", professorData.id);
      
      if (turmaIdParam) {
        turmaQuery = turmaQuery.eq("id", turmaIdParam);
      }
      
      const { data: turmaData } = await turmaQuery.maybeSingle();

      if (!turmaData) {
        toast({
          title: "Sem Turma Atribuída",
          description: "Você não foi designado como director de nenhuma turma.",
        });
        navigate("/professor");
        return;
      }

      setTurma(turmaData);

      // Buscar alunos da turma com profiles
      const { data: alunosData } = await supabase
        .from("alunos")
        .select(`
          id,
          numero_matricula,
          profiles!fk_alunos_user(nome_completo, sexo)
        `)
        .eq("turma_id", turmaData.id);

      // Buscar notas dos alunos
      const alunoIds = alunosData?.map(a => a.id) || [];
      const { data: notasData } = await supabase
        .from("notas")
        .select("aluno_id, media_trimestral, disciplina_id, disciplinas!fk_notas_disciplina(nome)")
        .in("aluno_id", alunoIds);

      // Buscar disciplinas da turma
      const { data: disciplinasData } = await supabase
        .from("professor_disciplinas")
        .select("disciplinas!fk_professor_disciplinas_disciplina(id, nome)")
        .eq("turma_id", turmaData.id);

      const uniqueDisciplinas = disciplinasData?.reduce((acc: any[], item) => {
        if (!acc.find(d => d.id === item.disciplinas?.id)) {
          acc.push(item.disciplinas);
        }
        return acc;
      }, []) || [];
      setDisciplinas(uniqueDisciplinas);

      // Processar estatísticas
      let homens = 0, mulheres = 0, indefinido = 0;
      let aprovados = 0, reprovados = 0, emExame = 0, pendentes = 0;

      const processedAlunos: AlunoStats[] = (alunosData || []).map(aluno => {
        const profile = aluno.profiles as any;
        if (profile?.sexo === 'H') homens++;
        else if (profile?.sexo === 'M') mulheres++;
        else indefinido++;

        // Calcular média geral do aluno
        const alunoNotas = notasData?.filter(n => n.aluno_id === aluno.id) || [];
        const medias = alunoNotas.map(n => n.media_trimestral).filter(m => m !== null);
        const mediaGeral = medias.length > 0 ? medias.reduce((a, b) => a + Number(b), 0) / medias.length : 0;

        // Determinar status
        let status: 'aprovado' | 'reprovado' | 'em_exame' | 'pendente' = 'pendente';
        if (medias.length >= 3) {
          if (mediaGeral >= 10) {
            status = 'aprovado';
            aprovados++;
          } else if (mediaGeral >= 8) {
            status = 'em_exame';
            emExame++;
          } else {
            status = 'reprovado';
            reprovados++;
          }
        } else {
          pendentes++;
        }

        return {
          id: aluno.id,
          numero_matricula: aluno.numero_matricula,
          nome_completo: profile?.nome_completo || 'N/A',
          sexo: profile?.sexo || null,
          mediaGeral: Math.round(mediaGeral * 10) / 10,
          status,
        };
      });

      setAlunos(processedAlunos);
      setGenderStats({ homens, mulheres, indefinido });
      setApprovalStats({ aprovados, reprovados, emExame, pendentes });

      // Médias por disciplina
      const disciplineGrades = uniqueDisciplinas.map(disc => {
        const discNotas = notasData?.filter(n => n.disciplina_id === disc.id) || [];
        const medias = discNotas.map(n => n.media_trimestral).filter(m => m !== null);
        const avg = medias.length > 0 ? medias.reduce((a, b) => a + Number(b), 0) / medias.length : 0;
        return {
          nome: disc.nome,
          media: Math.round(avg * 10) / 10,
        };
      });
      setGradesByDiscipline(disciplineGrades);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da turma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!turma) return;

    const mediaGeral = alunos.length > 0
      ? alunos.reduce((acc, a) => acc + a.mediaGeral, 0) / alunos.length
      : 0;

    generateTurmaReportPDF({
      turma: {
        nome: turma.nome,
        classe: turma.classe,
      },
      directorNome,
      anoLectivo,
      alunos,
      disciplinas: gradesByDiscipline,
      stats: {
        totalAlunos: alunos.length,
        homens: genderStats.homens,
        mulheres: genderStats.mulheres,
        aprovados: approvalStats.aprovados,
        reprovados: approvalStats.reprovados,
        emExame: approvalStats.emExame,
        pendentes: approvalStats.pendentes,
        mediaGeral,
      },
    });

    toast({
      title: "Relatório Gerado",
      description: "O download do relatório PDF foi iniciado.",
    });
  };

  const genderChartData = [
    { name: 'Homens', value: genderStats.homens, color: '#3b82f6' },
    { name: 'Mulheres', value: genderStats.mulheres, color: '#ec4899' },
    ...(genderStats.indefinido > 0 ? [{ name: 'Não definido', value: genderStats.indefinido, color: '#9ca3af' }] : []),
  ];

  const approvalChartData = [
    { name: 'Aprovados', value: approvalStats.aprovados },
    { name: 'Em Exame', value: approvalStats.emExame },
    { name: 'Reprovados', value: approvalStats.reprovados },
    { name: 'Pendentes', value: approvalStats.pendentes },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
      case 'em_exame':
        return <Badge className="bg-amber-100 text-amber-800">Em Exame</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!turma) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <GraduationCap className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Sem Turma Atribuída</h2>
          <p className="text-muted-foreground">Você não foi designado como director de nenhuma turma.</p>
          <Button onClick={() => navigate("/professor")}>Voltar ao Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Director de Turma</h1>
            <p className="text-muted-foreground">
              {turma.classe}ª Classe - Turma {turma.nome}
            </p>
          </div>
          <Button onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Relatório
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{alunos.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disciplinas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{disciplinas.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {alunos.length > 0 ? Math.round((approvalStats.aprovados / alunos.length) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Média da Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">
                  {alunos.length > 0 ? (alunos.reduce((a, b) => a + b.mediaGeral, 0) / alunos.length).toFixed(1) : 0}/20
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Distribuição por Género
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Média por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gradesByDiscipline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Bar dataKey="media" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="alunos">
          <TabsList>
            <TabsTrigger value="alunos">Lista de Alunos</TabsTrigger>
            <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
          </TabsList>

          <TabsContent value="alunos">
            <Card>
              <CardHeader>
                <CardTitle>Alunos da Turma</CardTitle>
                <CardDescription>
                  Lista completa de alunos matriculados na turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead className="text-right">Média</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum aluno encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      alunos.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-mono">{aluno.numero_matricula}</TableCell>
                          <TableCell>{aluno.nome_completo}</TableCell>
                          <TableCell>
                            {aluno.sexo === 'H' ? 'Masculino' : aluno.sexo === 'M' ? 'Feminino' : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {aluno.mediaGeral}/20
                          </TableCell>
                          <TableCell>{getStatusBadge(aluno.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aprovacoes">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Aprovações</CardTitle>
                <CardDescription>
                  Estatísticas de aprovação da turma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="font-medium">Aprovados</span>
                      <Badge className="bg-green-600">{approvalStats.aprovados}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                      <span className="font-medium">Em Exame</span>
                      <Badge className="bg-amber-600">{approvalStats.emExame}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <span className="font-medium">Reprovados</span>
                      <Badge className="bg-red-600">{approvalStats.reprovados}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Pendentes</span>
                      <Badge className="bg-gray-600">{approvalStats.pendentes}</Badge>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={approvalChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {approvalChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DirectorTurma;
