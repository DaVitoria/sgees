import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, UserPlus, Trash2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const TurmaDetalhes = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [turma, setTurma] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<any[]>([]);
  const [professorDisciplinas, setProfessorDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [isAddAlunoOpen, setIsAddAlunoOpen] = useState(false);
  const [isAddProfessorOpen, setIsAddProfessorOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchData();
    }
  }, [user, id]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [turmaRes, alunosRes, alunosDispRes, profDiscRes, profsRes, discsRes] = await Promise.all([
        supabase.from("turmas").select("*, anos_lectivos!ano_lectivo_id(ano)").eq("id", id).single(),
        supabase.from("alunos").select("*, profiles(nome_completo)").eq("turma_id", id),
        supabase.from("alunos").select("*, profiles(nome_completo)").is("turma_id", null).eq("estado", "activo"),
        supabase.from("professor_disciplinas").select("*, professores(*, profiles(nome_completo)), disciplinas(nome)").eq("turma_id", id),
        supabase.from("professores").select("*, profiles(nome_completo)"),
        supabase.from("disciplinas").select("*"),
      ]);

      if (turmaRes.error) throw turmaRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (alunosDispRes.error) throw alunosDispRes.error;
      if (profDiscRes.error) throw profDiscRes.error;
      if (profsRes.error) throw profsRes.error;
      if (discsRes.error) throw discsRes.error;

      setTurma(turmaRes.data);
      setAlunos(alunosRes.data || []);
      setAlunosDisponiveis(alunosDispRes.data || []);
      setProfessorDisciplinas(profDiscRes.data || []);
      setProfessores(profsRes.data || []);
      setDisciplinas(discsRes.data || []);
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

  const handleAddAluno = async () => {
    if (!selectedAluno) {
      toast({ title: "Selecione um aluno", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("alunos")
        .update({ turma_id: id })
        .eq("id", selectedAluno);

      if (error) throw error;

      toast({ title: "Aluno adicionado à turma com sucesso!" });
      setIsAddAlunoOpen(false);
      setSelectedAluno("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAluno = async (alunoId: string) => {
    if (!confirm("Tem certeza que deseja remover este aluno da turma?")) return;

    try {
      const { error } = await supabase
        .from("alunos")
        .update({ turma_id: null })
        .eq("id", alunoId);

      if (error) throw error;

      toast({ title: "Aluno removido da turma com sucesso!" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao remover aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddProfessorDisciplina = async () => {
    if (!selectedProfessor || !selectedDisciplina) {
      toast({ title: "Selecione um professor e uma disciplina", variant: "destructive" });
      return;
    }

    if (!turma?.ano_lectivo_id) {
      toast({ title: "Ano letivo não definido para esta turma", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("professor_disciplinas").insert([{
        professor_id: selectedProfessor,
        disciplina_id: selectedDisciplina,
        turma_id: id,
        ano_lectivo_id: turma.ano_lectivo_id,
      }]);

      if (error) throw error;

      toast({ title: "Professor atribuído à disciplina com sucesso!" });
      setIsAddProfessorOpen(false);
      setSelectedProfessor("");
      setSelectedDisciplina("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir professor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveProfessorDisciplina = async (profDiscId: string) => {
    if (!confirm("Tem certeza que deseja remover esta atribuição?")) return;

    try {
      const { error } = await supabase
        .from("professor_disciplinas")
        .delete()
        .eq("id", profDiscId);

      if (error) throw error;

      toast({ title: "Atribuição removida com sucesso!" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao remover atribuição",
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

  if (!turma) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Turma não encontrada</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pedagogico/gestao-turmas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{turma.nome}</h2>
            <p className="text-muted-foreground">
              {turma.classe}ª Classe • {turma.anos_lectivos?.ano} • Capacidade: {alunos.length}/{turma.capacidade}
            </p>
          </div>
        </div>

        <Tabs defaultValue="alunos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alunos">
              Alunos ({alunos.length})
            </TabsTrigger>
            <TabsTrigger value="professores">
              Professores/Disciplinas ({professorDisciplinas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alunos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Alunos Matriculados</CardTitle>
                    <CardDescription>Lista de alunos nesta turma</CardDescription>
                  </div>
                  <Dialog open={isAddAlunoOpen} onOpenChange={setIsAddAlunoOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Adicionar Aluno
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Aluno à Turma</DialogTitle>
                        <DialogDescription>
                          Selecione um aluno disponível para adicionar à turma
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select value={selectedAluno} onValueChange={setSelectedAluno}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um aluno" />
                          </SelectTrigger>
                          <SelectContent>
                            {alunosDisponiveis.map((aluno) => (
                              <SelectItem key={aluno.id} value={aluno.id}>
                                {aluno.profiles?.nome_completo} - {aluno.numero_matricula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddAluno}>Adicionar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número de Matrícula</TableHead>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Nenhum aluno matriculado nesta turma
                        </TableCell>
                      </TableRow>
                    ) : (
                      alunos.map((aluno) => (
                        <TableRow key={aluno.id}>
                          <TableCell className="font-medium">{aluno.numero_matricula}</TableCell>
                          <TableCell>{aluno.profiles?.nome_completo}</TableCell>
                          <TableCell>
                            <Badge variant={aluno.estado === 'activo' ? 'default' : 'secondary'}>
                              {aluno.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAluno(aluno.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professores" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Professores e Disciplinas</CardTitle>
                    <CardDescription>Atribuições de professores a disciplinas nesta turma</CardDescription>
                  </div>
                  <Dialog open={isAddProfessorOpen} onOpenChange={setIsAddProfessorOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserCog className="h-4 w-4 mr-2" />
                        Atribuir Professor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Atribuir Professor a Disciplina</DialogTitle>
                        <DialogDescription>
                          Selecione um professor e uma disciplina
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Professor</label>
                          <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um professor" />
                            </SelectTrigger>
                            <SelectContent>
                              {professores.map((prof) => (
                                <SelectItem key={prof.id} value={prof.id}>
                                  {prof.profiles?.nome_completo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Disciplina</label>
                          <Select value={selectedDisciplina} onValueChange={setSelectedDisciplina}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma disciplina" />
                            </SelectTrigger>
                            <SelectContent>
                              {disciplinas
                                .filter((disc) => disc.classe === turma.classe)
                                .map((disc) => (
                                  <SelectItem key={disc.id} value={disc.id}>
                                    {disc.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddProfessorDisciplina}>Atribuir</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Professor</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professorDisciplinas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum professor atribuído a esta turma
                        </TableCell>
                      </TableRow>
                    ) : (
                      professorDisciplinas.map((pd) => (
                        <TableRow key={pd.id}>
                          <TableCell className="font-medium">
                            {pd.professores?.profiles?.nome_completo}
                          </TableCell>
                          <TableCell>{pd.disciplinas?.nome}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProfessorDisciplina(pd.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TurmaDetalhes;
