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
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Eye, Search } from "lucide-react";
import { z } from "zod";
import { mapDatabaseError, mapAuthError } from "@/utils/errorHandler";

// Valores permitidos pelo check constraint alunos_estado_check
const ESTADO_ALUNO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'transferido', label: 'Transferido' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'desistente', label: 'Desistente' },
] as const;

const alunoSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100).optional(),
  telefone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos").max(20),
  bi: z.string().min(8, "BI deve ter pelo menos 8 caracteres").max(20),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200),
  numero_matricula: z.string().min(3, "Número de matrícula é obrigatório").max(50),
  turma_id: z.string().optional(),
  estado: z.string().refine(
    (val) => ['activo', 'transferido', 'concluido', 'desistente'].includes(val),
    { message: "Estado deve ser: activo, transferido, concluido ou desistente" }
  ),
  encarregado_nome: z.string().min(3, "Nome do encarregado é obrigatório").max(100),
  encarregado_telefone: z.string().min(9, "Telefone do encarregado é obrigatório").max(20),
  encarregado_parentesco: z.string().min(2, "Parentesco é obrigatório").max(50),
});

type AlunoFormData = z.infer<typeof alunoSchema>;

interface Aluno {
  id: string;
  user_id: string;
  numero_matricula: string;
  data_matricula: string;
  turma_id: string | null;
  estado: string;
  encarregado_nome: string;
  encarregado_telefone: string;
  encarregado_parentesco: string | null;
  profiles: {
    id: string;
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    bi: string | null;
    data_nascimento: string | null;
    endereco: string | null;
  } | null;
  turmas: {
    nome: string;
    classe: number;
  } | null;
}

interface Turma {
  id: string;
  nome: string;
  classe: number;
}

interface HistoricoNota {
  id: string;
  trimestre: number;
  nota_as1: number | null;
  nota_as2: number | null;
  nota_as3: number | null;
  media_as: number | null;
  nota_at: number | null;
  media_trimestral: number | null;
  disciplinas: {
    nome: string;
    codigo: string;
  };
  anos_lectivos: {
    ano: string;
  };
}

const GestaoAlunos = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [deletingAlunoId, setDeletingAlunoId] = useState<string | null>(null);
  const [historicoNotas, setHistoricoNotas] = useState<HistoricoNota[]>([]);
  const [formData, setFormData] = useState<AlunoFormData>({
    nome_completo: "",
    email: "",
    password: "",
    telefone: "",
    bi: "",
    data_nascimento: "",
    endereco: "",
    numero_matricula: "",
    turma_id: "",
    estado: "activo",
    encarregado_nome: "",
    encarregado_telefone: "",
    encarregado_parentesco: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "secretario" || userRole === "funcionario")) {
      fetchAlunos();
      fetchTurmas();
    }
  }, [user, userRole]);

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          profiles!fk_alunos_user(
            id,
            nome_completo,
            email,
            telefone,
            bi,
            data_nascimento,
            endereco
          ),
          turmas!fk_alunos_turma(
            nome,
            classe
          )
        `)
        .order("numero_matricula");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alunos",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome, classe")
        .order("classe")
        .order("nome");

      if (error) throw error;
      setTurmas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar turmas",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const fetchHistorico = async (alunoId: string) => {
    try {
      const { data, error } = await supabase
        .from("notas")
        .select(`
          id,
          trimestre,
          nota_as1,
          nota_as2,
          nota_as3,
          media_as,
          nota_at,
          media_trimestral,
          disciplinas(
            nome,
            codigo
          ),
          anos_lectivos!fk_notas_ano_lectivo(
            ano
          )
        `)
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistoricoNotas(data || []);
      setIsHistoricoOpen(true);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // For new students, password is required
      const schemaToUse = editingAluno 
        ? alunoSchema 
        : alunoSchema.extend({ password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100) });
      
      const validatedData = schemaToUse.parse(formData);

      if (editingAluno) {
        // Update existing aluno
        if (!editingAluno.profiles) throw new Error("Perfil não encontrado");
        
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome_completo: validatedData.nome_completo,
            email: validatedData.email,
            telefone: validatedData.telefone,
            bi: validatedData.bi,
            data_nascimento: validatedData.data_nascimento,
            endereco: validatedData.endereco,
          })
          .eq("id", editingAluno.user_id);

        if (profileError) throw profileError;

        const { error: alunoError } = await supabase
          .from("alunos")
          .update({
            numero_matricula: validatedData.numero_matricula,
            turma_id: validatedData.turma_id || null,
            estado: validatedData.estado,
            encarregado_nome: validatedData.encarregado_nome,
            encarregado_telefone: validatedData.encarregado_telefone,
            encarregado_parentesco: validatedData.encarregado_parentesco,
          })
          .eq("id", editingAluno.id);

        if (alunoError) throw alunoError;

        toast({
          title: "Aluno atualizado",
          description: "Os dados do aluno foram atualizados com sucesso.",
        });
      } else {
        // SECURITY FIX: Create authenticated user via supabase.auth.signUp()
        // This ensures the student can log in and the profile.id references a valid auth.users(id)
        const redirectUrl = `${window.location.origin}/`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password!,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome_completo: validatedData.nome_completo,
            },
          },
        });

        if (authError) {
          if (authError.message.includes("already registered")) {
            throw new Error("Este email já está registado no sistema.");
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error("Erro ao criar conta de utilizador.");
        }

        // Update the profile with additional data (profile is auto-created by trigger)
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            telefone: validatedData.telefone,
            bi: validatedData.bi,
            data_nascimento: validatedData.data_nascimento,
            endereco: validatedData.endereco,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Create user_role as 'aluno'
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "aluno",
          });

        if (roleError) throw roleError;

        // Create aluno record
        const { error: alunoError } = await supabase
          .from("alunos")
          .insert({
            user_id: authData.user.id,
            numero_matricula: validatedData.numero_matricula,
            turma_id: validatedData.turma_id || null,
            estado: validatedData.estado,
            encarregado_nome: validatedData.encarregado_nome,
            encarregado_telefone: validatedData.encarregado_telefone,
            encarregado_parentesco: validatedData.encarregado_parentesco,
          });

        if (alunoError) throw alunoError;

        toast({
          title: "Aluno criado",
          description: "Novo aluno adicionado com sucesso. O aluno pode agora fazer login com o email e senha definidos.",
        });
      }

      setIsDialogOpen(false);
      setEditingAluno(null);
      setFormData({
        nome_completo: "",
        email: "",
        password: "",
        telefone: "",
        bi: "",
        data_nascimento: "",
        endereco: "",
        numero_matricula: "",
        turma_id: "",
        estado: "activo",
        encarregado_nome: "",
        encarregado_telefone: "",
        encarregado_parentesco: "",
      });
      fetchAlunos();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erro ao salvar aluno",
          description: mapAuthError(error),
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (aluno: Aluno) => {
    if (!aluno.profiles) {
      toast({
        title: "Erro",
        description: "Perfil do aluno não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    setEditingAluno(aluno);
    setFormData({
      nome_completo: aluno.profiles.nome_completo,
      email: aluno.profiles.email || "",
      password: "", // Password is not required when editing
      telefone: aluno.profiles.telefone || "",
      bi: aluno.profiles.bi || "",
      data_nascimento: aluno.profiles.data_nascimento || "",
      endereco: aluno.profiles.endereco || "",
      numero_matricula: aluno.numero_matricula,
      turma_id: aluno.turma_id || "",
      estado: (aluno.estado as 'activo' | 'transferido' | 'concluido' | 'desistente') || "activo",
      encarregado_nome: aluno.encarregado_nome,
      encarregado_telefone: aluno.encarregado_telefone,
      encarregado_parentesco: aluno.encarregado_parentesco || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingAlunoId) return;

    try {
      const { error } = await supabase
        .from("alunos")
        .delete()
        .eq("id", deletingAlunoId);

      if (error) throw error;

      toast({
        title: "Aluno removido",
        description: "O aluno foi removido com sucesso.",
      });

      setIsDeleteDialogOpen(false);
      setDeletingAlunoId(null);
      fetchAlunos();
    } catch (error: any) {
      toast({
        title: "Erro ao remover aluno",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.profiles?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.numero_matricula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    if (!loading && (!user || (userRole !== "admin" && userRole !== "secretario" && userRole !== "funcionario"))) {
      setShouldRedirect(true);
    }
  }, [loading, user, userRole]);

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard");
    }
  }, [shouldRedirect, navigate]);

  if (!user || (userRole !== "admin" && userRole !== "secretario" && userRole !== "funcionario")) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A redirecionar...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Alunos</h1>
          <Button className="w-full sm:w-auto" onClick={() => {
            setEditingAluno(null);
            setFormData({
              nome_completo: "",
              email: "",
              password: "",
              telefone: "",
              bi: "",
              data_nascimento: "",
              endereco: "",
              numero_matricula: "",
              turma_id: "",
              estado: "activo",
              encarregado_nome: "",
              encarregado_telefone: "",
              encarregado_parentesco: "",
            });
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Aluno
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou número de matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Matrícula</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Encarregado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum aluno encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.numero_matricula}</TableCell>
                    <TableCell>{aluno.profiles?.nome_completo || "N/A"}</TableCell>
                    <TableCell>
                      {aluno.turmas ? `${aluno.turmas.classe}ª ${aluno.turmas.nome}` : "Sem turma"}
                    </TableCell>
                    <TableCell>{aluno.encarregado_nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        aluno.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {aluno.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => fetchHistorico(aluno.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(aluno)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDeletingAlunoId(aluno.id); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredAlunos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            filteredAlunos.map((aluno) => (
              <div key={aluno.id} className="bg-card rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{aluno.profiles?.nome_completo || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{aluno.numero_matricula}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    aluno.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {aluno.estado}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Turma:</span>
                    <p>{aluno.turmas ? `${aluno.turmas.classe}ª ${aluno.turmas.nome}` : "Sem turma"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Encarregado:</span>
                    <p>{aluno.encarregado_nome}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => fetchHistorico(aluno.id)}>
                    <Eye className="h-4 w-4 mr-1" /> Ver
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(aluno)}>
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setDeletingAlunoId(aluno.id); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? "Editar Aluno" : "Adicionar Novo Aluno"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do aluno e do encarregado de educação
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <h3 className="font-semibold">Dados do Aluno</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    />
                    {errors.nome_completo && <p className="text-sm text-destructive mt-1">{errors.nome_completo}</p>}
                  </div>
                  <div>
                    <Label htmlFor="numero_matricula">Nº de Matrícula *</Label>
                    <Input
                      id="numero_matricula"
                      value={formData.numero_matricula}
                      onChange={(e) => setFormData({ ...formData, numero_matricula: e.target.value })}
                    />
                    {errors.numero_matricula && <p className="text-sm text-destructive mt-1">{errors.numero_matricula}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingAluno}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    {!!editingAluno && <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>}
                  </div>
                  {!editingAluno && (
                    <div>
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                      />
                      {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                    {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bi">BI *</Label>
                    <Input
                      id="bi"
                      value={formData.bi}
                      onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                    />
                    {errors.bi && <p className="text-sm text-destructive mt-1">{errors.bi}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    />
                    {errors.data_nascimento && <p className="text-sm text-destructive mt-1">{errors.data_nascimento}</p>}
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado do Aluno *</Label>
                    <Select 
                      value={formData.estado} 
                      onValueChange={(value: 'activo' | 'transferido' | 'concluido' | 'desistente') => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADO_ALUNO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.estado && <p className="text-sm text-destructive mt-1">{errors.estado}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                  {errors.endereco && <p className="text-sm text-destructive mt-1">{errors.endereco}</p>}
                </div>
                <div>
                  <Label htmlFor="turma_id">Turma</Label>
                  <Select value={formData.turma_id} onValueChange={(value) => setFormData({ ...formData, turma_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar turma (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.classe}ª {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <h3 className="font-semibold mt-4">Dados do Encarregado</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="encarregado_nome">Nome do Encarregado *</Label>
                    <Input
                      id="encarregado_nome"
                      value={formData.encarregado_nome}
                      onChange={(e) => setFormData({ ...formData, encarregado_nome: e.target.value })}
                    />
                    {errors.encarregado_nome && <p className="text-sm text-destructive mt-1">{errors.encarregado_nome}</p>}
                  </div>
                  <div>
                    <Label htmlFor="encarregado_telefone">Telefone *</Label>
                    <Input
                      id="encarregado_telefone"
                      value={formData.encarregado_telefone}
                      onChange={(e) => setFormData({ ...formData, encarregado_telefone: e.target.value })}
                    />
                    {errors.encarregado_telefone && <p className="text-sm text-destructive mt-1">{errors.encarregado_telefone}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="encarregado_parentesco">Parentesco *</Label>
                  <Input
                    id="encarregado_parentesco"
                    placeholder="Ex: Pai, Mãe, Tio, Avó..."
                    value={formData.encarregado_parentesco}
                    onChange={(e) => setFormData({ ...formData, encarregado_parentesco: e.target.value })}
                  />
                  {errors.encarregado_parentesco && <p className="text-sm text-destructive mt-1">{errors.encarregado_parentesco}</p>}
                </div>
              </div>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "A processar..." : (editingAluno ? "Atualizar" : "Adicionar")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este aluno? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Histórico Dialog */}
        <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico Escolar</DialogTitle>
              <DialogDescription>
                Visualização completa das notas do aluno
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {historicoNotas.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhuma nota registrada ainda</p>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ano</TableHead>
                          <TableHead>Disciplina</TableHead>
                          <TableHead>T</TableHead>
                          <TableHead>AS1</TableHead>
                          <TableHead>AS2</TableHead>
                          <TableHead>AS3</TableHead>
                          <TableHead>MAS</TableHead>
                          <TableHead>AT</TableHead>
                          <TableHead>MT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicoNotas.map((nota) => (
                          <TableRow key={nota.id}>
                            <TableCell className="text-xs">{nota.anos_lectivos.ano}</TableCell>
                            <TableCell className="text-xs">{nota.disciplinas.nome}</TableCell>
                            <TableCell>{nota.trimestre}º</TableCell>
                            <TableCell>{nota.nota_as1 ?? "-"}</TableCell>
                            <TableCell>{nota.nota_as2 ?? "-"}</TableCell>
                            <TableCell>{nota.nota_as3 ?? "-"}</TableCell>
                            <TableCell>{nota.media_as ?? "-"}</TableCell>
                            <TableCell>{nota.nota_at ?? "-"}</TableCell>
                            <TableCell className="font-semibold">{nota.media_trimestral ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {historicoNotas.map((nota) => (
                      <div key={nota.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{nota.disciplinas.nome}</p>
                            <p className="text-xs text-muted-foreground">{nota.anos_lectivos.ano} - {nota.trimestre}º Trim</p>
                          </div>
                          <span className="font-bold text-lg">{nota.media_trimestral ?? "-"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div className="bg-muted rounded p-1">
                            <span className="text-muted-foreground">AS1</span>
                            <p className="font-medium">{nota.nota_as1 ?? "-"}</p>
                          </div>
                          <div className="bg-muted rounded p-1">
                            <span className="text-muted-foreground">AS2</span>
                            <p className="font-medium">{nota.nota_as2 ?? "-"}</p>
                          </div>
                          <div className="bg-muted rounded p-1">
                            <span className="text-muted-foreground">AS3</span>
                            <p className="font-medium">{nota.nota_as3 ?? "-"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GestaoAlunos;
