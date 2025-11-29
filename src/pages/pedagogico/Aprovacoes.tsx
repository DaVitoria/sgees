import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Aprovacoes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [aprovacoes, setAprovacoes] = useState<any[]>([]);

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
      fetchAprovacoes();
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

  const fetchAprovacoes = async () => {
    setLoadingData(true);
    try {
      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select("id, numero_matricula, user_id, profiles!user_id(nome_completo)")
        .eq("turma_id", selectedTurma);

      if (alunosError) throw alunosError;

      const alunosComNotas = await Promise.all(
        (alunos || []).map(async (aluno) => {
          const { data: notas, error: notasError } = await supabase
            .from("notas")
            .select("media_trimestral, trimestre")
            .eq("aluno_id", aluno.id);

          if (notasError) throw notasError;

          const medias = notas?.map((n) => n.media_trimestral).filter((m) => m !== null) as number[];
          const mediaFinal = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;

          let status = "exame";
          if (mediaFinal >= 10) status = "aprovado";
          else if (mediaFinal < 7) status = "reprovado";

          return {
            ...aluno,
            mediaFinal,
            status,
            totalNotas: notas?.length || 0,
          };
        })
      );

      setAprovacoes(alunosComNotas);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar aprovações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "reprovado":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "exame":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      aprovado: "default",
      reprovado: "destructive",
      exame: "secondary",
    };

    const labels: any = {
      aprovado: "Aprovado",
      reprovado: "Reprovado",
      exame: "Exame",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

  const stats = {
    aprovados: aprovacoes.filter((a) => a.status === "aprovado").length,
    reprovados: aprovacoes.filter((a) => a.status === "reprovado").length,
    exames: aprovacoes.filter((a) => a.status === "exame").length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pedagogico")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Aprovações</h2>
            <p className="text-muted-foreground">Gerir aprovações, reprovações e exames</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Turma</CardTitle>
            <CardDescription>Escolha uma turma para ver as aprovações</CardDescription>
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.aprovados}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Para Exame</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.exames}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.reprovados}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Situação dos Alunos</CardTitle>
            <CardDescription>
              Aprovado: Média ≥ 10 | Exame: 7 ≤ Média &lt; 10 | Reprovado: Média &lt; 7
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Média Final</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aprovacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum aluno nesta turma
                    </TableCell>
                  </TableRow>
                ) : (
                  aprovacoes.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.numero_matricula}</TableCell>
                      <TableCell>{aluno.profiles?.nome_completo}</TableCell>
                      <TableCell>
                        <span className="text-lg font-semibold">
                          {aluno.totalNotas > 0 ? aluno.mediaFinal.toFixed(1) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(aluno.status)}
                          {getStatusBadge(aluno.status)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Aprovacoes;
