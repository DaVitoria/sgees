import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ArrowLeft, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const turmaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100),
  classe: z.coerce.number().min(1).max(13),
  ano_lectivo_id: z.string().min(1, "Selecione um ano letivo"),
  capacidade: z.coerce.number().min(1).max(100).default(40),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

const GestaoDeTurmas = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const form = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      nome: "",
      classe: 1,
      capacidade: 40,
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
      const [turmasRes, anosRes] = await Promise.all([
        supabase.from("turmas").select("*, anos_lectivos!ano_lectivo_id(ano), alunos!turma_id(id)").order("classe", { ascending: true }),
        supabase.from("anos_lectivos").select("*").eq("activo", true),
      ]);

      if (turmasRes.error) throw turmasRes.error;
      if (anosRes.error) throw anosRes.error;

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

  const onSubmit = async (data: TurmaFormData) => {
    try {
      const turmaData = {
        nome: data.nome,
        classe: data.classe,
        ano_lectivo_id: data.ano_lectivo_id,
        capacidade: data.capacidade,
      };

      if (editingTurma) {
        const { error } = await supabase
          .from("turmas")
          .update(turmaData)
          .eq("id", editingTurma.id);

        if (error) throw error;

        toast({ title: "Turma atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("turmas").insert([turmaData]);

        if (error) throw error;

        toast({ title: "Turma criada com sucesso!" });
      }

      setIsDialogOpen(false);
      setEditingTurma(null);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (turma: any) => {
    setEditingTurma(turma);
    form.reset({
      nome: turma.nome,
      classe: turma.classe,
      ano_lectivo_id: turma.ano_lectivo_id,
      capacidade: turma.capacidade,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta turma?")) return;

    try {
      const { error } = await supabase.from("turmas").delete().eq("id", id);

      if (error) throw error;

      toast({ title: "Turma eliminada com sucesso!" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao eliminar turma",
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
              <h2 className="text-3xl font-bold tracking-tight">Gestão de Turmas</h2>
              <p className="text-muted-foreground">Criar e organizar turmas</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTurma(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTurma ? "Editar Turma" : "Nova Turma"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados da turma
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Turma</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 10ª A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="classe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classe</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={13}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
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
                              <SelectItem key={ano.id} value={ano.id}>
                                {ano.ano}
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
                    name="capacidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingTurma ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Turmas Registadas</CardTitle>
            <CardDescription>Lista de todas as turmas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turmas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma turma registada
                    </TableCell>
                  </TableRow>
                ) : (
                  turmas.map((turma) => (
                    <TableRow key={turma.id}>
                      <TableCell className="font-medium">{turma.nome}</TableCell>
                      <TableCell>{turma.classe}ª</TableCell>
                      <TableCell>{turma.anos_lectivos?.ano}</TableCell>
                      <TableCell>{turma.capacidade}</TableCell>
                      <TableCell>{turma.alunos?.length || 0}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/pedagogico/gestao-turmas/${turma.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(turma)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(turma.id)}
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

export default GestaoDeTurmas;
