import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Search, ArrowLeft, UserCheck, UserX, RefreshCw, Eye, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Matricula {
  id: string;
  aluno_id: string;
  ano_lectivo_id: string;
  turma_id: string | null;
  data_matricula: string;
  estado: string;
  observacoes: string | null;
  created_at: string;
  alunos: {
    id: string;
    numero_matricula: string;
    encarregado_nome: string;
    encarregado_telefone: string;
    profiles: {
      nome_completo: string;
      email: string | null;
      telefone: string | null;
    } | null;
  } | null;
  turmas: {
    id: string;
    nome: string;
    classe: number;
  } | null;
  anos_lectivos: {
    id: string;
    ano: string;
    activo: boolean;
  } | null;
}

interface Aluno {
  id: string;
  numero_matricula: string;
  user_id: string;
  profiles: {
    nome_completo: string;
    email: string | null;
  } | null;
}

interface Turma {
  id: string;
  nome: string;
  classe: number;
  ano_lectivo_id: string;
}

interface AnoLectivo {
  id: string;
  ano: string;
  activo: boolean;
}

const estadoColors: Record<string, string> = {
  activo: "bg-green-100 text-green-800 border-green-200",
  transferido: "bg-blue-100 text-blue-800 border-blue-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
  concluido: "bg-purple-100 text-purple-800 border-purple-200",
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const estadoLabels: Record<string, string> = {
  activo: "Activo",
  transferido: "Transferido",
  cancelado: "Cancelado",
  concluido: "Concluído",
  pendente: "Pendente",
};

const Matriculas = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnoLectivo, setFilterAnoLectivo] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [filterClasse, setFilterClasse] = useState<string>("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(null);
  const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);
  const [deletingMatriculaId, setDeletingMatriculaId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    aluno_id: "",
    ano_lectivo_id: "",
    turma_id: "",
    data_matricula: format(new Date(), "yyyy-MM-dd"),
    estado: "activo",
    observacoes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    transferidos: 0,
    cancelados: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "secretario")) {
      fetchData();
    }
  }, [user, userRole]);

  useEffect(() => {
    // Calculate stats
    const total = matriculas.length;
    const activos = matriculas.filter(m => m.estado === "activo").length;
    const transferidos = matriculas.filter(m => m.estado === "transferido").length;
    const cancelados = matriculas.filter(m => m.estado === "cancelado").length;
    setStats({ total, activos, transferidos, cancelados });
  }, [matriculas]);

  const fetchData = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchMatriculas(),
      fetchAlunos(),
      fetchTurmas(),
      fetchAnosLectivos(),
    ]);
    setLoadingData(false);
  };

  const fetchMatriculas = async () => {
    try {
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          *,
          alunos!fk_matriculas_aluno_id(
            id,
            numero_matricula,
            encarregado_nome,
            encarregado_telefone,
            profiles:user_id(
              nome_completo,
              email,
              telefone
            )
          ),
          turmas!fk_matriculas_turma_id(
            id,
            nome,
            classe
          ),
          anos_lectivos!fk_matriculas_ano_lectivo_id(
            id,
            ano,
            activo
          )
        `)
        .order("status", { ascending: false }) // Pendentes first
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMatriculas((data as unknown as Matricula[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar matrículas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          numero_matricula,
          user_id,
          profiles(
            nome_completo,
            email
          )
        `)
        .eq("estado", "activo")
        .order("numero_matricula");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error: any) {
      console.error("Error fetching alunos:", error);
    }
  };

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome, classe, ano_lectivo_id")
        .order("classe")
        .order("nome");

      if (error) throw error;
      setTurmas(data || []);
    } catch (error: any) {
      console.error("Error fetching turmas:", error);
    }
  };

  const fetchAnosLectivos = async () => {
    try {
      const { data, error } = await supabase
        .from("anos_lectivos")
        .select("id, ano, activo")
        .order("ano", { ascending: false });

      if (error) throw error;
      setAnosLectivos(data || []);
      
      // Set default filter to active year
      const activeYear = data?.find(a => a.activo);
      if (activeYear) {
        setFilterAnoLectivo(activeYear.id);
        setFormData(prev => ({ ...prev, ano_lectivo_id: activeYear.id }));
      }
    } catch (error: any) {
      console.error("Error fetching anos lectivos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.aluno_id || !formData.ano_lectivo_id) {
        throw new Error("Selecione o aluno e o ano lectivo");
      }

      // Check if student already has enrollment for this year
      if (!editingMatricula) {
        const { data: existing } = await supabase
          .from("matriculas")
          .select("id")
          .eq("aluno_id", formData.aluno_id)
          .eq("ano_lectivo_id", formData.ano_lectivo_id)
          .single();

        if (existing) {
          throw new Error("Este aluno já possui matrícula para o ano lectivo seleccionado");
        }
      }

      const matriculaData = {
        aluno_id: formData.aluno_id,
        ano_lectivo_id: formData.ano_lectivo_id,
        turma_id: formData.turma_id || null,
        data_matricula: formData.data_matricula,
        estado: formData.estado,
        status: formData.turma_id ? "aprovada" : "pendente", // Approve if turma assigned
        observacoes: formData.observacoes || null,
      };

      if (editingMatricula) {
        const { error } = await supabase
          .from("matriculas")
          .update(matriculaData)
          .eq("id", editingMatricula.id);

        if (error) throw error;

        // Update aluno turma_id if turma changed
        if (formData.turma_id) {
          await supabase
            .from("alunos")
            .update({ turma_id: formData.turma_id })
            .eq("id", formData.aluno_id);
        }

        toast({
          title: "Matrícula actualizada",
          description: "Os dados da matrícula foram actualizados com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("matriculas")
          .insert(matriculaData);

        if (error) throw error;

        // Update aluno turma_id
        if (formData.turma_id) {
          await supabase
            .from("alunos")
            .update({ turma_id: formData.turma_id })
            .eq("id", formData.aluno_id);
        }

        toast({
          title: "Matrícula registada",
          description: "Nova matrícula adicionada com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMatriculas();
    } catch (error: any) {
      toast({
        title: "Erro ao guardar matrícula",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (matricula: Matricula) => {
    setEditingMatricula(matricula);
    setFormData({
      aluno_id: matricula.aluno_id,
      ano_lectivo_id: matricula.ano_lectivo_id,
      turma_id: matricula.turma_id || "",
      data_matricula: matricula.data_matricula,
      estado: matricula.estado || "activo",
      observacoes: matricula.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingMatriculaId) return;

    try {
      const { error } = await supabase
        .from("matriculas")
        .delete()
        .eq("id", deletingMatriculaId);

      if (error) throw error;

      toast({
        title: "Matrícula removida",
        description: "A matrícula foi removida com sucesso.",
      });

      setIsDeleteDialogOpen(false);
      setDeletingMatriculaId(null);
      fetchMatriculas();
    } catch (error: any) {
      toast({
        title: "Erro ao remover matrícula",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (matriculaId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("matriculas")
        .update({ estado: newStatus })
        .eq("id", matriculaId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Matrícula marcada como ${estadoLabels[newStatus]}.`,
      });

      fetchMatriculas();
    } catch (error: any) {
      toast({
        title: "Erro ao actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingMatricula(null);
    const activeYear = anosLectivos.find(a => a.activo);
    setFormData({
      aluno_id: "",
      ano_lectivo_id: activeYear?.id || "",
      turma_id: "",
      data_matricula: format(new Date(), "yyyy-MM-dd"),
      estado: "activo",
      observacoes: "",
    });
  };

  const viewDetails = (matricula: Matricula) => {
    setSelectedMatricula(matricula);
    setIsDetailsOpen(true);
  };

  // Filter turmas by selected ano_lectivo
  const filteredTurmas = turmas.filter(t => 
    !formData.ano_lectivo_id || t.ano_lectivo_id === formData.ano_lectivo_id
  );

  // Get unique classes for filter
  const uniqueClasses = [...new Set(turmas.map(t => t.classe))].sort((a, b) => a - b);

  // Filter matriculas
  const filteredMatriculas = matriculas.filter(m => {
    const matchesSearch = 
      m.alunos?.profiles?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alunos?.numero_matricula.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAno = filterAnoLectivo === "all" || m.ano_lectivo_id === filterAnoLectivo;
    const matchesEstado = filterEstado === "all" || m.estado === filterEstado;
    const matchesClasse = filterClasse === "all" || m.turmas?.classe.toString() === filterClasse;
    
    return matchesSearch && matchesAno && matchesEstado && matchesClasse;
  });

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "secretario")) {
    navigate("/dashboard");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/administrativo")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestão de Matrículas</h1>
              <p className="text-muted-foreground">Registar e gerir matrículas dos alunos</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Matrícula
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.transferidos}</p>
                  <p className="text-sm text-muted-foreground">Transferidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.cancelados}</p>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterAnoLectivo} onValueChange={setFilterAnoLectivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano Lectivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {anosLectivos.map((ano) => (
                    <SelectItem key={ano.id} value={ano.id}>
                      {ano.ano} {ano.activo && "(Actual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterClasse} onValueChange={setFilterClasse}>
                <SelectTrigger>
                  <SelectValue placeholder="Classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Classes</SelectItem>
                  {uniqueClasses.map((classe) => (
                    <SelectItem key={classe} value={classe.toString()}>
                      {classe}ª Classe
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="transferido">Transferido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nº Matrícula</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Ano Lectivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatriculas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma matrícula encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatriculas.map((matricula) => (
                    <TableRow key={matricula.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{matricula.alunos?.profiles?.nome_completo || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{matricula.alunos?.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{matricula.alunos?.numero_matricula}</TableCell>
                      <TableCell>
                        {matricula.turmas ? (
                          <span>{matricula.turmas.classe}ª - {matricula.turmas.nome}</span>
                        ) : (
                          <span className="text-muted-foreground">Não atribuída</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={matricula.anos_lectivos?.activo ? "default" : "secondary"}>
                          {matricula.anos_lectivos?.ano}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(matricula.data_matricula), "dd/MM/yyyy", { locale: pt })}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          (matricula as any).status === "pendente" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                          (matricula as any).status === "aprovada" ? "bg-green-100 text-green-800 border-green-200" :
                          "bg-red-100 text-red-800 border-red-200"
                        }>
                          {(matricula as any).status === "pendente" ? "Pendente" :
                           (matricula as any).status === "aprovada" ? "Aprovada" : "Rejeitada"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={estadoColors[matricula.estado || "activo"]}>
                          {estadoLabels[matricula.estado || "activo"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(matricula as any).status === "pendente" && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleEdit(matricula)}
                            >
                              Aprovar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => viewDetails(matricula)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(matricula)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingMatriculaId(matricula.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingMatricula ? "Editar Matrícula" : "Nova Matrícula"}</DialogTitle>
              <DialogDescription>
                {editingMatricula ? "Actualize os dados da matrícula" : "Registar uma nova matrícula para o aluno"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno_id">Aluno *</Label>
                  <Select
                    value={formData.aluno_id}
                    onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}
                    disabled={!!editingMatricula}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.profiles?.nome_completo} ({aluno.numero_matricula})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano_lectivo_id">Ano Lectivo *</Label>
                  <Select
                    value={formData.ano_lectivo_id}
                    onValueChange={(value) => setFormData({ ...formData, ano_lectivo_id: value, turma_id: "" })}
                    disabled={!!editingMatricula}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o ano lectivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {anosLectivos.map((ano) => (
                        <SelectItem key={ano.id} value={ano.id}>
                          {ano.ano} {ano.activo && "(Actual)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turma_id">Turma</Label>
                  <Select
                    value={formData.turma_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, turma_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuída</SelectItem>
                      {filteredTurmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.classe}ª Classe - {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_matricula">Data da Matrícula *</Label>
                  <Input
                    id="data_matricula"
                    type="date"
                    value={formData.data_matricula}
                    onChange={(e) => setFormData({ ...formData, data_matricula: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="transferido">Transferido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre a matrícula..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "A guardar..." : editingMatricula ? "Actualizar" : "Registar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Matrícula</DialogTitle>
            </DialogHeader>
            {selectedMatricula && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Aluno</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-semibold">{selectedMatricula.alunos?.profiles?.nome_completo}</p>
                      <p className="text-sm text-muted-foreground">{selectedMatricula.alunos?.numero_matricula}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={estadoColors[selectedMatricula.estado || "activo"]}>
                        {estadoLabels[selectedMatricula.estado || "activo"]}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ano Lectivo</p>
                    <p>{selectedMatricula.anos_lectivos?.ano}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Turma</p>
                    <p>
                      {selectedMatricula.turmas 
                        ? `${selectedMatricula.turmas.classe}ª Classe - ${selectedMatricula.turmas.nome}`
                        : "Não atribuída"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data da Matrícula</p>
                    <p>{format(new Date(selectedMatricula.data_matricula), "dd/MM/yyyy", { locale: pt })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{selectedMatricula.alunos?.profiles?.email || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Encarregado de Educação</p>
                  <Card>
                    <CardContent className="p-4">
                      <p className="font-medium">{selectedMatricula.alunos?.encarregado_nome}</p>
                      <p className="text-sm text-muted-foreground">{selectedMatricula.alunos?.encarregado_telefone}</p>
                    </CardContent>
                  </Card>
                </div>

                {selectedMatricula.observacoes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedMatricula.observacoes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mr-2">Alterar Estado:</p>
                  {selectedMatricula.estado !== "activo" && (
                    <Button size="sm" variant="outline" onClick={() => {
                      handleStatusChange(selectedMatricula.id, "activo");
                      setIsDetailsOpen(false);
                    }}>
                      <UserCheck className="h-4 w-4 mr-1" /> Activar
                    </Button>
                  )}
                  {selectedMatricula.estado !== "transferido" && (
                    <Button size="sm" variant="outline" onClick={() => {
                      handleStatusChange(selectedMatricula.id, "transferido");
                      setIsDetailsOpen(false);
                    }}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Transferir
                    </Button>
                  )}
                  {selectedMatricula.estado !== "cancelado" && (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => {
                      handleStatusChange(selectedMatricula.id, "cancelado");
                      setIsDetailsOpen(false);
                    }}>
                      <UserX className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta matrícula? Esta acção não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Matriculas;
