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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Eye, Search } from "lucide-react";
import { z } from "zod";

const alunoSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  telefone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos").max(20),
  bi: z.string().min(8, "BI deve ter pelo menos 8 caracteres").max(20),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200),
  numero_matricula: z.string().min(3, "Número de matrícula é obrigatório").max(50),
  turma_id: z.string().optional(),
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
  nota_mac: number | null;
  nota_cpp: number | null;
  nota_cat: number | null;
  media: number | null;
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
    telefone: "",
    bi: "",
    data_nascimento: "",
    endereco: "",
    numero_matricula: "",
    turma_id: "",
    encarregado_nome: "",
    encarregado_telefone: "",
    encarregado_parentesco: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "secretario")) {
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
          profiles(
            id,
            nome_completo,
            email,
            telefone,
            bi,
            data_nascimento,
            endereco
          ),
          turmas(
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
        description: error.message,
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
        description: error.message,
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
          nota_mac,
          nota_cpp,
          nota_cat,
          media,
          disciplinas(
            nome,
            codigo
          ),
          anos_lectivos(
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
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = alunoSchema.parse(formData);

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
        // Generate a new UUID for the profile
        const newUserId = crypto.randomUUID();
        
        // Create new profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: newUserId,
            nome_completo: validatedData.nome_completo,
            email: validatedData.email,
            telefone: validatedData.telefone,
            bi: validatedData.bi,
            data_nascimento: validatedData.data_nascimento,
            endereco: validatedData.endereco,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create user_role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: profileData.id,
            role: "aluno",
          });

        if (roleError) throw roleError;

        // Create aluno
        const { error: alunoError } = await supabase
          .from("alunos")
          .insert({
            user_id: profileData.id,
            numero_matricula: validatedData.numero_matricula,
            turma_id: validatedData.turma_id || null,
            encarregado_nome: validatedData.encarregado_nome,
            encarregado_telefone: validatedData.encarregado_telefone,
            encarregado_parentesco: validatedData.encarregado_parentesco,
          });

        if (alunoError) throw alunoError;

        toast({
          title: "Aluno criado",
          description: "Novo aluno adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingAluno(null);
      setFormData({
        nome_completo: "",
        email: "",
        telefone: "",
        bi: "",
        data_nascimento: "",
        endereco: "",
        numero_matricula: "",
        turma_id: "",
        encarregado_nome: "",
        encarregado_telefone: "",
        encarregado_parentesco: "",
      });
      fetchAlunos();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erro ao salvar aluno",
          description: error.message,
          variant: "destructive",
        });
      }
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
      telefone: aluno.profiles.telefone || "",
      bi: aluno.profiles.bi || "",
      data_nascimento: aluno.profiles.data_nascimento || "",
      endereco: aluno.profiles.endereco || "",
      numero_matricula: aluno.numero_matricula,
      turma_id: aluno.turma_id || "",
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
        description: error.message,
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

  if (!user || (userRole !== "admin" && userRole !== "secretario")) {
    navigate("/dashboard");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestão de Alunos</h1>
          <Button onClick={() => {
            setEditingAluno(null);
            setFormData({
              nome_completo: "",
              email: "",
              telefone: "",
              bi: "",
              data_nascimento: "",
              endereco: "",
              numero_matricula: "",
              turma_id: "",
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

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Matrícula</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Encarregado</TableHead>
                <TableHead>Telefone Encarregado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <TableCell>{aluno.encarregado_telefone}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        aluno.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {aluno.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchHistorico(aluno.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(aluno)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingAlunoId(aluno.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="numero_matricula">Número de Matrícula *</Label>
                    <Input
                      id="numero_matricula"
                      value={formData.numero_matricula}
                      onChange={(e) => setFormData({ ...formData, numero_matricula: e.target.value })}
                    />
                    {errors.numero_matricula && <p className="text-sm text-destructive mt-1">{errors.numero_matricula}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                    {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bi">BI *</Label>
                    <Input
                      id="bi"
                      value={formData.bi}
                      onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                    />
                    {errors.bi && <p className="text-sm text-destructive mt-1">{errors.bi}</p>}
                  </div>
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

                <h3 className="font-semibold mt-4">Dados do Encarregado de Educação</h3>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="encarregado_telefone">Telefone do Encarregado *</Label>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAluno ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Remoção</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover este aluno? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Histórico Dialog */}
        <Dialog open={isHistoricoOpen} onOpenChange={setIsHistoricoOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ano Lectivo</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Trimestre</TableHead>
                      <TableHead>MAC</TableHead>
                      <TableHead>CPP</TableHead>
                      <TableHead>CAT</TableHead>
                      <TableHead>Média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicoNotas.map((nota) => (
                      <TableRow key={nota.id}>
                        <TableCell>{nota.anos_lectivos.ano}</TableCell>
                        <TableCell>{nota.disciplinas.nome}</TableCell>
                        <TableCell>{nota.trimestre}º</TableCell>
                        <TableCell>{nota.nota_mac ?? "-"}</TableCell>
                        <TableCell>{nota.nota_cpp ?? "-"}</TableCell>
                        <TableCell>{nota.nota_cat ?? "-"}</TableCell>
                        <TableCell className="font-semibold">{nota.media ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GestaoAlunos;
