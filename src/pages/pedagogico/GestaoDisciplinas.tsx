import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";

interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  classe: number;
  carga_horaria: number | null;
  descricao: string | null;
}

const GestaoDisciplinas = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<Disciplina | null>(null);
  const [disciplinaToDelete, setDisciplinaToDelete] = useState<string | null>(null);
  const [filtroClasse, setFiltroClasse] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    classe: 7,
    carga_horaria: 0,
    descricao: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "secretario")) {
      fetchDisciplinas();
    }
  }, [user, userRole]);

  const fetchDisciplinas = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("disciplinas")
        .select("*")
        .order("classe", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      setDisciplinas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar disciplinas: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.codigo) {
      toast({
        title: "Erro",
        description: "Nome e código são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDisciplina) {
        const { error } = await supabase
          .from("disciplinas")
          .update({
            nome: formData.nome,
            codigo: formData.codigo,
            classe: formData.classe,
            carga_horaria: formData.carga_horaria || null,
            descricao: formData.descricao || null,
          })
          .eq("id", editingDisciplina.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Disciplina atualizada com sucesso",
        });
      } else {
        const { error } = await supabase.from("disciplinas").insert({
          nome: formData.nome,
          codigo: formData.codigo,
          classe: formData.classe,
          carga_horaria: formData.carga_horaria || null,
          descricao: formData.descricao || null,
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Disciplina criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDisciplinas();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar disciplina: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (disciplina: Disciplina) => {
    setEditingDisciplina(disciplina);
    setFormData({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      classe: disciplina.classe,
      carga_horaria: disciplina.carga_horaria || 0,
      descricao: disciplina.descricao || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDisciplinaToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!disciplinaToDelete) return;

    try {
      const { error } = await supabase
        .from("disciplinas")
        .delete()
        .eq("id", disciplinaToDelete);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Disciplina removida com sucesso",
      });
      fetchDisciplinas();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover disciplina: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDisciplinaToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      classe: 7,
      carga_horaria: 0,
      descricao: "",
    });
    setEditingDisciplina(null);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredDisciplinas = disciplinas.filter((d) => {
    const matchesClasse = filtroClasse === "todos" || d.classe === parseInt(filtroClasse);
    const matchesSearch =
      d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClasse && matchesSearch;
  });

  const disciplinasPorClasse = disciplinas.reduce((acc, d) => {
    acc[d.classe] = (acc[d.classe] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "secretario")) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Acesso não autorizado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Disciplinas</h2>
            <p className="text-muted-foreground">
              Gerir disciplinas do currículo escolar
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disciplinas.length}</div>
            </CardContent>
          </Card>
          {[7, 8, 9, 10, 11, 12].slice(0, 3).map((classe) => (
            <Card key={classe}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{classe}ª Classe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{disciplinasPorClasse[classe] || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar disciplina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filtroClasse} onValueChange={setFiltroClasse}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Classes</SelectItem>
                  {[7, 8, 9, 10, 11, 12].map((classe) => (
                    <SelectItem key={classe} value={classe.toString()}>
                      {classe}ª Classe
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Disciplinas</CardTitle>
            <CardDescription>
              {filteredDisciplinas.length} disciplina(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4 text-muted-foreground">A carregar...</p>
            ) : filteredDisciplinas.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Nenhuma disciplina encontrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisciplinas.map((disciplina) => (
                    <TableRow key={disciplina.id}>
                      <TableCell className="font-medium">{disciplina.codigo}</TableCell>
                      <TableCell>{disciplina.nome}</TableCell>
                      <TableCell>{disciplina.classe}ª</TableCell>
                      <TableCell>
                        {disciplina.carga_horaria ? `${disciplina.carga_horaria}h` : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {disciplina.descricao || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(disciplina)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(disciplina.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDisciplina ? "Editar Disciplina" : "Nova Disciplina"}
              </DialogTitle>
              <DialogDescription>
                {editingDisciplina
                  ? "Altere os dados da disciplina"
                  : "Preencha os dados da nova disciplina"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: MAT, POR"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classe">Classe *</Label>
                  <Select
                    value={formData.classe.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, classe: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((classe) => (
                        <SelectItem key={classe} value={classe.toString()}>
                          {classe}ª Classe
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Disciplina *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Matemática"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carga_horaria">Carga Horária (horas/semana)</Label>
                <Input
                  id="carga_horaria"
                  type="number"
                  min={0}
                  max={20}
                  value={formData.carga_horaria}
                  onChange={(e) =>
                    setFormData({ ...formData, carga_horaria: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Ex: 4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional da disciplina..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDisciplina ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de Confirmação de Remoção */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta disciplina? Esta ação não pode ser desfeita
                e pode afetar atribuições de professores e notas existentes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default GestaoDisciplinas;
