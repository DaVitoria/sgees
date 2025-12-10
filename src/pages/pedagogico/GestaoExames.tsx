import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Loader2, Plus, Search, FileText, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Exame {
  id: string;
  aluno_id: string;
  disciplina_id: string;
  ano_lectivo_id: string;
  classe: number;
  tipo_exame: string;
  nota_exame: number | null;
  nota_final: number | null;
  data_exame: string | null;
  local_exame: string | null;
  numero_pauta: string | null;
  estado: string;
  observacoes: string | null;
  lancado_em: string;
  alunos: {
    id: string;
    numero_matricula: string;
    user_id: string;
    profiles: {
      nome_completo: string;
    };
  };
  disciplinas: {
    nome: string;
    codigo: string;
  };
}

const GestaoExames = () => {
  const { user, loading: authLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exames, setExames] = useState<Exame[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedDisciplina, setSelectedDisciplina] = useState("");
  const [selectedAnoLectivo, setSelectedAnoLectivo] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExame, setEditingExame] = useState<Exame | null>(null);

  const [formData, setFormData] = useState({
    aluno_id: "",
    disciplina_id: "",
    ano_lectivo_id: "",
    classe: "",
    tipo_exame: "",
    nota_exame: "",
    data_exame: "",
    local_exame: "",
    numero_pauta: "",
    estado: "agendado",
    observacoes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && user && userRole && !["admin", "professor"].includes(userRole)) {
      navigate("/dashboard");
    }
  }, [user, authLoading, userRole, navigate]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnosLectivos(),
      fetchTurmas(),
      fetchDisciplinas(),
    ]);
    setLoading(false);
  };

  const fetchAnosLectivos = async () => {
    const { data } = await supabase
      .from("anos_lectivos")
      .select("*")
      .eq("activo", true)
      .order("ano", { ascending: false });

    setAnosLectivos(data || []);
    if (data && data.length > 0) {
      setSelectedAnoLectivo(data[0].id);
      setFormData(prev => ({ ...prev, ano_lectivo_id: data[0].id }));
    }
  };

  const fetchTurmas = async () => {
    const { data } = await supabase
      .from("turmas")
      .select("*, anos_lectivos!fk_turmas_ano_lectivo_id(ano)")
      .in("classe", [9, 10, 12])
      .order("classe", { ascending: true })
      .order("nome", { ascending: true });

    setTurmas(data || []);
  };

  const fetchDisciplinas = async () => {
    const { data } = await supabase
      .from("disciplinas")
      .select("*")
      .in("classe", [9, 10, 12])
      .order("nome", { ascending: true });

    setDisciplinas(data || []);
  };

  const fetchExames = async () => {
    if (!selectedAnoLectivo) return;

    setLoading(true);
    let query = supabase
      .from("exames")
      .select(`
        *,
        alunos!aluno_id(
          id,
          numero_matricula,
          user_id,
          profiles!fk_alunos_user(nome_completo)
        ),
        disciplinas!disciplina_id(nome, codigo)
      `)
      .eq("ano_lectivo_id", selectedAnoLectivo)
      .order("created_at", { ascending: false });

    if (selectedTurma) {
      // Filter by turma through alunos relationship
      const { data: alunosInTurma } = await supabase
        .from("alunos")
        .select("id")
        .eq("turma_id", selectedTurma);
      
      if (alunosInTurma && alunosInTurma.length > 0) {
        const alunoIds = alunosInTurma.map(a => a.id);
        query = query.in("aluno_id", alunoIds);
      }
    }

    if (selectedDisciplina) {
      query = query.eq("disciplina_id", selectedDisciplina);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro ao carregar exames",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExames(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedAnoLectivo) {
      fetchExames();
    }
  }, [selectedAnoLectivo, selectedTurma, selectedDisciplina]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exameData = {
        ...formData,
        nota_exame: formData.nota_exame ? parseFloat(formData.nota_exame) : null,
        classe: parseInt(formData.classe),
        lancado_por: user?.id,
      };

      let result;
      if (editingExame) {
        result = await supabase
          .from("exames")
          .update(exameData)
          .eq("id", editingExame.id);
      } else {
        result = await supabase
          .from("exames")
          .insert([exameData]);
      }

      if (result.error) throw result.error;

      toast({
        title: editingExame ? "Exame atualizado" : "Exame registado",
        description: "Operação realizada com sucesso",
      });

      setIsDialogOpen(false);
      setEditingExame(null);
      resetForm();
      fetchExames();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      aluno_id: "",
      disciplina_id: "",
      ano_lectivo_id: selectedAnoLectivo,
      classe: "",
      tipo_exame: "",
      nota_exame: "",
      data_exame: "",
      local_exame: "",
      numero_pauta: "",
      estado: "agendado",
      observacoes: "",
    });
  };

  const handleEdit = (exame: Exame) => {
    setEditingExame(exame);
    setFormData({
      aluno_id: exame.aluno_id,
      disciplina_id: exame.disciplina_id,
      ano_lectivo_id: exame.ano_lectivo_id,
      classe: exame.classe.toString(),
      tipo_exame: exame.tipo_exame,
      nota_exame: exame.nota_exame?.toString() || "",
      data_exame: exame.data_exame || "",
      local_exame: exame.local_exame || "",
      numero_pauta: exame.numero_pauta || "",
      estado: exame.estado,
      observacoes: exame.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      agendado: "secondary",
      realizado: "default",
      aprovado: "outline",
      reprovado: "destructive",
    };
    const colors: Record<string, string> = {
      agendado: "text-yellow-600",
      realizado: "text-blue-600",
      aprovado: "text-green-600 border-green-600",
      reprovado: "text-red-600",
    };
    return (
      <Badge variant={variants[estado] || "default"} className={colors[estado]}>
        {estado.toUpperCase()}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Exames</h2>
            <p className="text-muted-foreground">
              Gerir exames das classes 9ª, 10ª e 12ª
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingExame(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Registar Exame
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExame ? "Editar Exame" : "Registar Novo Exame"}</DialogTitle>
                <DialogDescription>
                  Preencha os dados do exame
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Classe *</Label>
                    <Select
                      value={formData.classe}
                      onValueChange={(value) => setFormData({ ...formData, classe: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9">9ª Classe</SelectItem>
                        <SelectItem value="10">10ª Classe</SelectItem>
                        <SelectItem value="12">12ª Classe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Exame *</Label>
                    <Select
                      value={formData.tipo_exame}
                      onValueChange={(value) => setFormData({ ...formData, tipo_exame: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nacional">Nacional</SelectItem>
                        <SelectItem value="provincial">Provincial</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Disciplina *</Label>
                    <Select
                      value={formData.disciplina_id}
                      onValueChange={(value) => setFormData({ ...formData, disciplina_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {disciplinas.map((disciplina) => (
                          <SelectItem key={disciplina.id} value={disciplina.id}>
                            {disciplina.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aluno *</Label>
                    <Input
                      placeholder="ID do aluno"
                      value={formData.aluno_id}
                      onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data do Exame</Label>
                    <Input
                      type="date"
                      value={formData.data_exame}
                      onChange={(e) => setFormData({ ...formData, data_exame: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nota do Exame (0-20)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.nota_exame}
                      onChange={(e) => setFormData({ ...formData, nota_exame: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Local do Exame</Label>
                    <Input
                      value={formData.local_exame}
                      onChange={(e) => setFormData({ ...formData, local_exame: e.target.value })}
                      placeholder="Ex: Escola Secundária..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Pauta</Label>
                    <Input
                      value={formData.numero_pauta}
                      onChange={(e) => setFormData({ ...formData, numero_pauta: e.target.value })}
                      placeholder="Ex: 2024001"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="realizado">Realizado</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="reprovado">Reprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {editingExame ? "Atualizar" : "Registar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Filtre os exames por ano lectivo, turma ou disciplina</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ano Lectivo</Label>
                <Select value={selectedAnoLectivo} onValueChange={setSelectedAnoLectivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {anosLectivos.map((ano) => (
                      <SelectItem key={ano.id} value={ano.id}>
                        {ano.ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Turma</Label>
                <Select value={selectedTurma || "all"} onValueChange={(val) => setSelectedTurma(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.classe}ª Classe
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select value={selectedDisciplina || "all"} onValueChange={(val) => setSelectedDisciplina(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {disciplinas.map((disciplina) => (
                      <SelectItem key={disciplina.id} value={disciplina.id}>
                        {disciplina.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Lista de Exames
            </CardTitle>
            <CardDescription>
              {exames.length} exame(s) registado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exames.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Nenhum exame registado
                      </TableCell>
                    </TableRow>
                  ) : (
                    exames.map((exame) => (
                      <TableRow key={exame.id}>
                        <TableCell className="font-medium">
                          {exame.alunos?.profiles?.nome_completo || "N/A"}
                        </TableCell>
                        <TableCell>{exame.alunos?.numero_matricula || "N/A"}</TableCell>
                        <TableCell>{exame.classe}ª</TableCell>
                        <TableCell>{exame.disciplinas?.nome || "N/A"}</TableCell>
                        <TableCell className="capitalize">{exame.tipo_exame}</TableCell>
                        <TableCell>
                          {exame.data_exame ? format(new Date(exame.data_exame), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {exame.nota_exame !== null ? exame.nota_exame.toFixed(1) : "-"}
                        </TableCell>
                        <TableCell>{getEstadoBadge(exame.estado)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(exame)}>
                            Editar
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

export default GestaoExames;