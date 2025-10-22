import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const notaSchema = z.object({
  aluno_id: z.string().min(1, "Selecione um aluno"),
  disciplina_id: z.string().min(1, "Selecione uma disciplina"),
  ano_lectivo_id: z.string().min(1, "Selecione um ano letivo"),
  trimestre: z.coerce.number().min(1).max(3),
  nota_mac: z.coerce.number().min(0).max(20).optional().nullable(),
  nota_cpp: z.coerce.number().min(0).max(20).optional().nullable(),
  nota_cat: z.coerce.number().min(0).max(20).optional().nullable(),
  observacoes: z.string().max(500).optional().nullable(),
});

type NotaFormData = z.infer<typeof notaSchema>;

const LancamentoNotas = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notas, setNotas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedTrimestre, setSelectedTrimestre] = useState<number>(1);

  const form = useForm<NotaFormData>({
    resolver: zodResolver(notaSchema),
    defaultValues: {
      aluno_id: "",
      disciplina_id: "",
      ano_lectivo_id: "",
      trimestre: 1,
      nota_mac: null,
      nota_cpp: null,
      nota_cat: null,
      observacoes: "",
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
  }, [user, selectedTrimestre]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [notasRes, alunosRes, disciplinasRes, anosRes] = await Promise.all([
        supabase
          .from("notas")
          .select(`
            *,
            alunos(id, numero_matricula, profiles(nome_completo)),
            disciplinas(nome, codigo),
            anos_lectivos(ano)
          `)
          .eq("trimestre", selectedTrimestre)
          .order("created_at", { ascending: false }),
        supabase.from("alunos").select("id, numero_matricula, user_id, profiles(nome_completo)"),
        supabase.from("disciplinas").select("*").order("nome"),
        supabase.from("anos_lectivos").select("*").eq("activo", true),
      ]);

      if (notasRes.error) throw notasRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (disciplinasRes.error) throw disciplinasRes.error;
      if (anosRes.error) throw anosRes.error;

      setNotas(notasRes.data || []);
      setAlunos(alunosRes.data || []);
      setDisciplinas(disciplinasRes.data || []);
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

  const calcularMedia = (mac: number | null, cpp: number | null, cat: number | null) => {
    const values = [mac, cpp, cat].filter((v) => v !== null) as number[];
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const onSubmit = async (data: NotaFormData) => {
    try {
      const media = calcularMedia(data.nota_mac || null, data.nota_cpp || null, data.nota_cat || null);
      const notaData = {
        aluno_id: data.aluno_id,
        disciplina_id: data.disciplina_id,
        ano_lectivo_id: data.ano_lectivo_id,
        trimestre: data.trimestre,
        nota_mac: data.nota_mac || null,
        nota_cpp: data.nota_cpp || null,
        nota_cat: data.nota_cat || null,
        observacoes: data.observacoes || null,
        media,
        lancado_por: user?.id,
      };

      if (editingNota) {
        const { error } = await supabase
          .from("notas")
          .update(notaData)
          .eq("id", editingNota.id);

        if (error) throw error;

        toast({ title: "Nota atualizada com sucesso!" });
      } else {
        const { error } = await supabase.from("notas").insert([notaData]);

        if (error) throw error;

        toast({ title: "Nota lançada com sucesso!" });
      }

      setIsDialogOpen(false);
      setEditingNota(null);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar nota",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (nota: any) => {
    setEditingNota(nota);
    form.reset({
      aluno_id: nota.aluno_id,
      disciplina_id: nota.disciplina_id,
      ano_lectivo_id: nota.ano_lectivo_id,
      trimestre: nota.trimestre,
      nota_mac: nota.nota_mac,
      nota_cpp: nota.nota_cpp,
      nota_cat: nota.nota_cat,
      observacoes: nota.observacoes || "",
    });
    setIsDialogOpen(true);
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
              <h2 className="text-3xl font-bold tracking-tight">Lançamento de Notas</h2>
              <p className="text-muted-foreground">Registar avaliações dos alunos</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingNota(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Lançar Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNota ? "Editar Nota" : "Lançar Nova Nota"}</DialogTitle>
                <DialogDescription>
                  Preencha as notas do aluno
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aluno_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aluno</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o aluno" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {alunos.map((aluno) => (
                                <SelectItem key={aluno.id} value={aluno.id}>
                                  {aluno.profiles?.nome_completo} ({aluno.numero_matricula})
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
                                <SelectItem key={disc.id} value={disc.id}>
                                  {disc.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ano_lectivo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano Letivo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
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
                      name="trimestre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trimestre</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1º Trimestre</SelectItem>
                              <SelectItem value="2">2º Trimestre</SelectItem>
                              <SelectItem value="3">3º Trimestre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nota_mac"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MAC (0-20)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={20}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nota_cpp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPP (0-20)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={20}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nota_cat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAT (0-20)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={20}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações opcionais" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">
                      {editingNota ? "Atualizar" : "Lançar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map((t) => (
            <Button
              key={t}
              variant={selectedTrimestre === t ? "default" : "outline"}
              onClick={() => setSelectedTrimestre(t)}
            >
              {t}º Trimestre
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notas do {selectedTrimestre}º Trimestre</CardTitle>
            <CardDescription>Lista de notas lançadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>CPP</TableHead>
                  <TableHead>CAT</TableHead>
                  <TableHead>Média</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma nota lançada neste trimestre
                    </TableCell>
                  </TableRow>
                ) : (
                  notas.map((nota) => (
                    <TableRow key={nota.id}>
                      <TableCell className="font-medium">
                        {nota.alunos?.profiles?.nome_completo}
                      </TableCell>
                      <TableCell>{nota.disciplinas?.nome}</TableCell>
                      <TableCell>{nota.nota_mac?.toFixed(1) || "-"}</TableCell>
                      <TableCell>{nota.nota_cpp?.toFixed(1) || "-"}</TableCell>
                      <TableCell>{nota.nota_cat?.toFixed(1) || "-"}</TableCell>
                      <TableCell className="font-semibold">
                        {nota.media ? nota.media.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(nota)}
                        >
                          <Pencil className="h-4 w-4" />
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

export default LancamentoNotas;
