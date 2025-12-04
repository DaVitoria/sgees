import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const atribuicaoSchema = z.object({
  professor_id: z.string().min(1, "Selecione um professor"),
  disciplina_id: z.string().min(1, "Selecione uma disciplina"),
  turma_id: z.string().min(1, "Selecione uma turma"),
  ano_lectivo_id: z.string().min(1, "Selecione um ano letivo"),
});

type AtribuicaoFormData = z.infer<typeof atribuicaoSchema>;

const AtribuicaoDisciplinas = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [atribuicoes, setAtribuicoes] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<AtribuicaoFormData>({
    resolver: zodResolver(atribuicaoSchema),
    defaultValues: {
      professor_id: "",
      disciplina_id: "",
      turma_id: "",
      ano_lectivo_id: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Buscar apenas utilizadores com role 'professor'
      const { data: professoresComRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");

      const professorUserIds = professoresComRole?.map(r => r.user_id) || [];

      const [atribuicoesRes, professoresRes, disciplinasRes, turmasRes, anosRes] = await Promise.all([
        supabase
          .from("professor_disciplinas")
          .select(`
            *,
            professores!fk_professor_disciplinas_professor(id, user_id, profiles!fk_professores_user_id(nome_completo)),
            disciplinas!fk_professor_disciplinas_disciplina(nome, codigo),
            turmas!fk_professor_disciplinas_turma(nome, classe),
            anos_lectivos!fk_professor_disciplinas_ano_lectivo(ano)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("professores")
          .select("id, user_id, profiles!fk_professores_user_id(nome_completo)")
          .in("user_id", professorUserIds.length > 0 ? professorUserIds : []),
        supabase.from("disciplinas").select("*").order("nome"),
        supabase.from("turmas").select("*").order("classe"),
        supabase.from("anos_lectivos").select("*").eq("activo", true),
      ]);

      if (atribuicoesRes.error) throw atribuicoesRes.error;
      if (professoresRes.error) throw professoresRes.error;
      if (disciplinasRes.error) throw disciplinasRes.error;
      if (turmasRes.error) throw turmasRes.error;
      if (anosRes.error) throw anosRes.error;

      setAtribuicoes(atribuicoesRes.data || []);
      setProfessores(professoresRes.data || []);
      setDisciplinas(disciplinasRes.data || []);
      setTurmas(turmasRes.data || []);
      setAnosLectivos(anosRes.data || []);
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

  const onSubmit = async (data: AtribuicaoFormData) => {
    try {
      const atribuicaoData = {
        professor_id: data.professor_id,
        disciplina_id: data.disciplina_id,
        turma_id: data.turma_id,
        ano_lectivo_id: data.ano_lectivo_id,
      };

      const { error } = await supabase.from("professor_disciplinas").insert([atribuicaoData]);

      if (error) throw error;

      toast({ title: "Disciplina atribuída com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir disciplina",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta atribuição?")) return;

    try {
      const { error } = await supabase.from("professor_disciplinas").delete().eq("id", id);

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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/pedagogico")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Atribuição de Disciplinas</h2>
              <p className="text-muted-foreground">Atribuir professores às disciplinas e turmas</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => form.reset()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Atribuição</DialogTitle>
                <DialogDescription>
                  Atribuir professor a uma disciplina e turma
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="professor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o professor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professores.map((prof) => (
                              <SelectItem key={`prof-${prof.id}`} value={prof.id}>
                                {prof.profiles?.nome_completo || "Sem nome"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="disciplina_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplina</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a disciplina" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {disciplinas.map((disc) => (
                              <SelectItem key={`disc-${disc.id}`} value={disc.id}>
                                {disc.nome} ({disc.codigo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="turma_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {turmas.map((turma) => (
                              <SelectItem key={`turma-${turma.id}`} value={turma.id}>
                                {turma.nome} ({turma.classe}ª)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ano_lectivo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano Letivo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano letivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {anosLectivos.map((ano) => (
                              <SelectItem key={`ano-${ano.id}`} value={ano.id}>
                                {ano.ano}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Atribuir</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atribuições Registadas</CardTitle>
            <CardDescription>Lista de todas as atribuições</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atribuicoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma atribuição registada
                    </TableCell>
                  </TableRow>
                ) : (
                  atribuicoes.map((atrib) => (
                    <TableRow key={atrib.id}>
                      <TableCell className="font-medium">
                        {atrib.professores?.profiles?.nome_completo || "N/A"}
                      </TableCell>
                      <TableCell>
                        {atrib.disciplinas?.nome} ({atrib.disciplinas?.codigo})
                      </TableCell>
                      <TableCell>{atrib.turmas?.nome}</TableCell>
                      <TableCell>{atrib.anos_lectivos?.ano}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(atrib.id)}
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
      </div>
    </Layout>
  );
};

export default AtribuicaoDisciplinas;
