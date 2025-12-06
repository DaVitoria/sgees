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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pencil, Trash2, Plus, Search, ArrowLeft, UserCheck, UserX, RefreshCw, Eye, FileText, Users, CheckCircle, XCircle, Clock, AlertCircle, Info, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { z } from "zod";

// Schema de validação
const matriculaFormSchema = z.object({
  aluno_id: z.string().min(1, "Seleccione um aluno"),
  ano_lectivo_id: z.string().min(1, "Seleccione o ano lectivo"),
  turma_id: z.string().optional(),
  data_matricula: z.string().min(1, "Data de matrícula é obrigatória"),
  estado: z.string().min(1, "Seleccione um estado"),
  observacoes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
});

interface Matricula {
  id: string;
  aluno_id: string;
  ano_lectivo_id: string;
  turma_id: string | null;
  data_matricula: string;
  estado: string;
  status: string;
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
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<Matricula | null>(null);
  const [selectedMatricula, setSelectedMatricula] = useState<Matricula | null>(null);
  const [deletingMatriculaId, setDeletingMatriculaId] = useState<string | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"aprovar" | "rejeitar" | "turma">("aprovar");
  const [bulkTurmaId, setBulkTurmaId] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    aluno_id: "",
    ano_lectivo_id: "",
    turma_id: "",
    data_matricula: format(new Date(), "yyyy-MM-dd"),
    estado: "activo",
    observacoes: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    transferidos: 0,
    cancelados: 0,
    pendentes: 0,
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
    const pendentes = matriculas.filter(m => m.status === "pendente").length;
    setStats({ total, activos, transferidos, cancelados, pendentes });
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
            profiles!fk_alunos_user(
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
    setValidationErrors({});

    try {
      // Validar com zod
      const validationResult = matriculaFormSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0] as string] = issue.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os campos destacados.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if student already has enrollment for this year
      if (!editingMatricula) {
        const { data: existing } = await supabase
          .from("matriculas")
          .select("id")
          .eq("aluno_id", formData.aluno_id)
          .eq("ano_lectivo_id", formData.ano_lectivo_id)
          .maybeSingle();

        if (existing) {
          setValidationErrors({ aluno_id: "Este aluno já possui matrícula para o ano lectivo seleccionado" });
          toast({
            title: "Matrícula duplicada",
            description: "Este aluno já possui matrícula para o ano lectivo seleccionado.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const matriculaData = {
        aluno_id: formData.aluno_id,
        ano_lectivo_id: formData.ano_lectivo_id,
        turma_id: formData.turma_id || null,
        data_matricula: formData.data_matricula,
        estado: formData.estado,
        status: formData.turma_id ? "aprovada" : "pendente",
        observacoes: formData.observacoes || null,
      };

      if (editingMatricula) {
        const { error } = await supabase
          .from("matriculas")
          .update(matriculaData)
          .eq("id", editingMatricula.id);

        if (error) throw error;

        // Update aluno turma_id and estado if turma changed
        if (formData.turma_id) {
          await supabase
            .from("alunos")
            .update({ turma_id: formData.turma_id, estado: "activo" })
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

        if (error) {
          if (error.code === '23505' || error.message.includes('duplicate')) {
            setValidationErrors({ aluno_id: "Matrícula já existe para este aluno/ano" });
            toast({
              title: "Matrícula duplicada",
              description: "Já existe uma matrícula para este aluno e ano lectivo.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          throw error;
        }

        // Update aluno turma_id
        if (formData.turma_id) {
          await supabase
            .from("alunos")
            .update({ turma_id: formData.turma_id, estado: "activo" })
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
    setValidationErrors({});
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

  // Bulk selection handlers
  const pendingMatriculas = matriculas.filter(m => m.status === "pendente");
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pendingMatriculas.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);

    try {
      const updates = Array.from(selectedIds).map(async (id) => {
        const matricula = matriculas.find(m => m.id === id);
        const updateData: any = { status: "aprovada", estado: "activo" };
        
        if (bulkAction === "turma" && bulkTurmaId) {
          updateData.turma_id = bulkTurmaId;
          // Update aluno turma_id as well
          if (matricula?.aluno_id) {
            await supabase
              .from("alunos")
              .update({ turma_id: bulkTurmaId })
              .eq("id", matricula.aluno_id);
          }
        }
        
        return supabase
          .from("matriculas")
          .update(updateData)
          .eq("id", id);
      });

      await Promise.all(updates);

      toast({
        title: "Matrículas aprovadas",
        description: `${selectedIds.size} matrícula(s) aprovada(s) com sucesso.`,
      });

      setSelectedIds(new Set());
      setIsBulkDialogOpen(false);
      setBulkTurmaId("");
      fetchMatriculas();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar matrículas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);

    try {
      const { error } = await supabase
        .from("matriculas")
        .update({ status: "rejeitada", estado: "cancelado" })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Matrículas rejeitadas",
        description: `${selectedIds.size} matrícula(s) rejeitada(s).`,
      });

      setSelectedIds(new Set());
      setIsBulkDialogOpen(false);
      fetchMatriculas();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar matrículas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const executeBulkAction = async () => {
    if (bulkAction === "aprovar" || bulkAction === "turma") {
      await handleBulkApprove();
    } else if (bulkAction === "rejeitar") {
      await handleBulkReject();
    }
  };

  // Filter turmas by selected ano_lectivo
  const filteredTurmas = turmas.filter(t => 
    !formData.ano_lectivo_id || t.ano_lectivo_id === formData.ano_lectivo_id
  );

  // Get turmas for bulk assignment (use active year)
  const activeYear = anosLectivos.find(a => a.activo);
  const bulkTurmas = turmas.filter(t => activeYear && t.ano_lectivo_id === activeYear.id);

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

  if (!user || (userRole !== "admin" && userRole !== "secretario" && userRole !== "funcionario")) {
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendentes}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
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

        {/* Pending Enrollments Section */}
        {pendingMatriculas.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-lg">Matrículas Pendentes ({pendingMatriculas.length})</CardTitle>
                </div>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size} selecionada(s)
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setBulkAction("aprovar");
                        setIsBulkDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkAction("turma");
                        setIsBulkDialogOpen(true);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Atribuir Turma
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setBulkAction("rejeitar");
                        setIsBulkDialogOpen(true);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>Revise e aprove as matrículas pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={pendingMatriculas.length > 0 && selectedIds.size === pendingMatriculas.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Nº Matrícula</TableHead>
                    <TableHead>Encarregado</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMatriculas.map((matricula) => (
                    <TableRow key={matricula.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(matricula.id)}
                          onCheckedChange={(checked) => handleSelectOne(matricula.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{matricula.alunos?.profiles?.nome_completo || "N/A"}</p>
                      </TableCell>
                      <TableCell className="font-mono">{matricula.alunos?.numero_matricula}</TableCell>
                      <TableCell>{matricula.alunos?.encarregado_nome}</TableCell>
                      <TableCell>{matricula.alunos?.encarregado_telefone}</TableCell>
                      <TableCell>
                        {format(new Date(matricula.data_matricula), "dd/MM/yyyy", { locale: pt })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleEdit(matricula)}
                          >
                            Aprovar e Atribuir
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => viewDetails(matricula)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingMatricula ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    {editingMatricula.status === "pendente" ? "Aprovar e Editar Matrícula" : "Editar Matrícula"}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    Nova Matrícula
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingMatricula 
                  ? editingMatricula.status === "pendente"
                    ? "Revise os dados do aluno, atribua uma turma para aprovar a matrícula."
                    : "Actualize os dados da matrícula"
                  : "Registar uma nova matrícula para o aluno"}
              </DialogDescription>
            </DialogHeader>
            
            {/* Aviso de aprovação pendente */}
            {editingMatricula && editingMatricula.status === "pendente" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">Matrícula Pendente de Aprovação</p>
                  <p className="text-sm text-yellow-700">
                    Atribua uma turma para aprovar automaticamente esta matrícula. O aluno será notificado.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aluno_id" className="flex items-center gap-1">
                    Aluno <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.aluno_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, aluno_id: value });
                      setValidationErrors({ ...validationErrors, aluno_id: "" });
                    }}
                    disabled={!!editingMatricula}
                  >
                    <SelectTrigger className={validationErrors.aluno_id ? "border-destructive ring-destructive" : ""}>
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
                  {validationErrors.aluno_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.aluno_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano_lectivo_id" className="flex items-center gap-1">
                    Ano Lectivo <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.ano_lectivo_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, ano_lectivo_id: value, turma_id: "" });
                      setValidationErrors({ ...validationErrors, ano_lectivo_id: "" });
                    }}
                    disabled={!!editingMatricula}
                  >
                    <SelectTrigger className={validationErrors.ano_lectivo_id ? "border-destructive ring-destructive" : ""}>
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
                  {validationErrors.ano_lectivo_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.ano_lectivo_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turma_id" className="flex items-center gap-1">
                    Turma
                    {editingMatricula?.status === "pendente" && (
                      <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Obrigatório para aprovar
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={formData.turma_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, turma_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className={editingMatricula?.status === "pendente" && !formData.turma_id ? "border-yellow-400" : ""}>
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
                  {filteredTurmas.length === 0 && formData.ano_lectivo_id && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Nenhuma turma disponível para este ano lectivo.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_matricula" className="flex items-center gap-1">
                    Data da Matrícula <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="data_matricula"
                    type="date"
                    value={formData.data_matricula}
                    onChange={(e) => {
                      setFormData({ ...formData, data_matricula: e.target.value });
                      setValidationErrors({ ...validationErrors, data_matricula: "" });
                    }}
                    className={validationErrors.data_matricula ? "border-destructive ring-destructive" : ""}
                    required
                  />
                  {validationErrors.data_matricula && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.data_matricula}
                    </p>
                  )}
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
                      <SelectItem value="activo">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          Activo
                        </span>
                      </SelectItem>
                      <SelectItem value="pendente">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          Pendente
                        </span>
                      </SelectItem>
                      <SelectItem value="transferido">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          Transferido
                        </span>
                      </SelectItem>
                      <SelectItem value="cancelado">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          Cancelado
                        </span>
                      </SelectItem>
                      <SelectItem value="concluido">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-purple-500" />
                          Concluído
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="flex items-center justify-between">
                  Observações
                  <span className="text-xs text-muted-foreground">
                    {formData.observacoes?.length || 0}/500
                  </span>
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, observacoes: e.target.value });
                      setValidationErrors({ ...validationErrors, observacoes: "" });
                    }
                  }}
                  placeholder="Observações adicionais sobre a matrícula..."
                  rows={3}
                  className={validationErrors.observacoes ? "border-destructive ring-destructive" : ""}
                />
                {validationErrors.observacoes && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.observacoes}
                  </p>
                )}
              </div>

              {/* Info sobre aprovação automática */}
              {formData.turma_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    A matrícula será marcada como <strong>aprovada</strong> e o aluno será atribuído à turma seleccionada.
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A guardar...
                    </>
                  ) : editingMatricula ? (
                    editingMatricula.status === "pendente" && formData.turma_id ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar e Guardar
                      </>
                    ) : (
                      "Actualizar"
                    )
                  ) : (
                    "Registar"
                  )}
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

        {/* Bulk Action Dialog */}
        <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkAction === "aprovar" && "Aprovar Matrículas em Massa"}
                {bulkAction === "rejeitar" && "Rejeitar Matrículas em Massa"}
                {bulkAction === "turma" && "Atribuir Turma em Massa"}
              </DialogTitle>
              <DialogDescription>
                {bulkAction === "aprovar" && `Aprovar ${selectedIds.size} matrícula(s) seleccionada(s)`}
                {bulkAction === "rejeitar" && `Rejeitar ${selectedIds.size} matrícula(s) seleccionada(s)`}
                {bulkAction === "turma" && `Atribuir turma a ${selectedIds.size} matrícula(s) seleccionada(s)`}
              </DialogDescription>
            </DialogHeader>
            
            {bulkAction === "turma" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Seleccione a Turma</Label>
                  <Select value={bulkTurmaId} onValueChange={setBulkTurmaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkTurmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.classe}ª Classe - {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {bulkAction === "rejeitar" && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  As matrículas rejeitadas serão marcadas como canceladas. Os alunos serão notificados.
                </p>
              </div>
            )}

            {bulkAction === "aprovar" && (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  As matrículas serão aprovadas e marcadas como activas. Pode atribuir turmas individualmente depois.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsBulkDialogOpen(false);
                  setBulkTurmaId("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={isBulkProcessing || (bulkAction === "turma" && !bulkTurmaId)}
                variant={bulkAction === "rejeitar" ? "destructive" : "default"}
              >
                {isBulkProcessing ? "A processar..." : 
                  bulkAction === "aprovar" ? "Aprovar Todas" :
                  bulkAction === "rejeitar" ? "Rejeitar Todas" :
                  "Atribuir Turma"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Matriculas;
