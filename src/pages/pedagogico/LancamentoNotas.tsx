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
import { Plus, Pencil, ArrowLeft, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const notaSchema = z.object({
  aluno_id: z.string().min(1, "Selecione um aluno"),
  disciplina_id: z.string().min(1, "Selecione uma disciplina"),
  ano_lectivo_id: z.string().min(1, "Selecione um ano letivo"),
  trimestre: z.coerce.number().min(1).max(3),
  nota_as1: z.coerce.number().min(0).max(20).optional().nullable(),
  nota_as2: z.coerce.number().min(0).max(20).optional().nullable(),
  nota_as3: z.coerce.number().min(0).max(20).optional().nullable(),
  nota_at: z.coerce.number().min(0).max(20).optional().nullable(),
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
      nota_as1: null,
      nota_as2: null,
      nota_as3: null,
      nota_at: null,
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
            anos_lectivos!ano_lectivo_id(ano)
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

  // Calcular MAS (Média das Avaliações Sistemáticas)
  const calcularMAS = (as1: number | null, as2: number | null, as3: number | null) => {
    const values = [as1, as2, as3].filter((v) => v !== null) as number[];
    if (values.length === 0) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  };

  // Calcular MT (Média Trimestral) = MAS * 0.4 + AT * 0.6
  const calcularMT = (mas: number | null, at: number | null) => {
    if (mas === null && at === null) return null;
    const masValue = mas || 0;
    const atValue = at || 0;
    // Se apenas MAS, MT = MAS
    // Se apenas AT, MT = AT
    // Se ambos, MT = MAS * 0.4 + AT * 0.6
    if (mas !== null && at !== null) {
      return Math.round((masValue * 0.4 + atValue * 0.6) * 100) / 100;
    }
    return mas !== null ? mas : at;
  };

  const onSubmit = async (data: NotaFormData) => {
    try {
      const media_as = calcularMAS(data.nota_as1 || null, data.nota_as2 || null, data.nota_as3 || null);
      const media_trimestral = calcularMT(media_as, data.nota_at || null);
      
      const notaData = {
        aluno_id: data.aluno_id,
        disciplina_id: data.disciplina_id,
        ano_lectivo_id: data.ano_lectivo_id,
        trimestre: data.trimestre,
        nota_as1: data.nota_as1 || null,
        nota_as2: data.nota_as2 || null,
        nota_as3: data.nota_as3 || null,
        media_as,
        nota_at: data.nota_at || null,
        media_trimestral,
        observacoes: data.observacoes || null,
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
      nota_as1: nota.nota_as1,
      nota_as2: nota.nota_as2,
      nota_as3: nota.nota_as3,
      nota_at: nota.nota_at,
      observacoes: nota.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  // Watch form values for live calculation
  const watchedValues = form.watch(["nota_as1", "nota_as2", "nota_as3", "nota_at"]);
  const previewMAS = calcularMAS(watchedValues[0] || null, watchedValues[1] || null, watchedValues[2] || null);
  const previewMT = calcularMT(previewMAS, watchedValues[3] || null);

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
              <p className="text-muted-foreground">Registar avaliações dos alunos (AS1, AS2, AS3, AT)</p>
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
                  Preencha as avaliações sistemáticas (AS) e avaliação trimestral (AT)
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

                  {/* Avaliações Sistemáticas */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Avaliações Sistemáticas (AS)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="nota_as1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AS1 (0-20)</FormLabel>
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
                        name="nota_as2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AS2 (0-20)</FormLabel>
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
                        name="nota_as3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AS3 (0-20)</FormLabel>
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
                  </div>

                  {/* Avaliação Trimestral */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Avaliação Trimestral (AT)</h4>
                    <FormField
                      control={form.control}
                      name="nota_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AT (0-20)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min={0}
                              max={20}
                              className="max-w-[200px]"
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

                  {/* Preview das Médias */}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Cálculo Automático</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">MAS (Média AS):</span>
                          <span className="ml-2 font-bold">{previewMAS?.toFixed(2) || "-"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">MT (Média Trimestral):</span>
                          <span className="ml-2 font-bold text-primary">{previewMT?.toFixed(2) || "-"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Fórmula: MT = MAS × 0.4 + AT × 0.6
                      </p>
                    </CardContent>
                  </Card>

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
            <CardDescription>Lista de notas lançadas (AS1, AS2, AS3 → MAS, AT → MT)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">AS1</TableHead>
                    <TableHead className="text-center">AS2</TableHead>
                    <TableHead className="text-center">AS3</TableHead>
                    <TableHead className="text-center">MAS</TableHead>
                    <TableHead className="text-center">AT</TableHead>
                    <TableHead className="text-center">MT</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                        <TableCell className="text-center">{nota.nota_as1?.toFixed(1) || "-"}</TableCell>
                        <TableCell className="text-center">{nota.nota_as2?.toFixed(1) || "-"}</TableCell>
                        <TableCell className="text-center">{nota.nota_as3?.toFixed(1) || "-"}</TableCell>
                        <TableCell className="text-center font-medium">{nota.media_as?.toFixed(2) || "-"}</TableCell>
                        <TableCell className="text-center">{nota.nota_at?.toFixed(1) || "-"}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${Number(nota.media_trimestral) >= 14 ? 'text-green-600' : Number(nota.media_trimestral) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {nota.media_trimestral?.toFixed(2) || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(nota)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LancamentoNotas;
