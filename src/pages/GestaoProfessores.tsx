import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const professorSchema = z.object({
  nome_completo: z.string().trim().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
  telefone: z.string().trim().max(20, "Telefone muito longo").optional(),
  bi: z.string().trim().max(20, "BI muito longo").optional(),
  data_nascimento: z.string().optional(),
  numero_funcionario: z.string().trim().min(1, "Número de funcionário é obrigatório").max(50, "Número muito longo"),
  habilitacao: z.string().trim().min(1, "Habilitação é obrigatória").max(100, "Habilitação muito longa"),
  especialidade: z.string().trim().max(100, "Especialidade muito longa").optional(),
  categoria: z.string().trim().max(50, "Categoria muito longa").optional(),
  data_admissao: z.string().optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

interface Professor {
  id: string;
  user_id: string;
  numero_funcionario: string;
  habilitacao: string;
  especialidade: string | null;
  categoria: string | null;
  data_admissao: string | null;
  profiles: {
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    bi: string | null;
    data_nascimento: string | null;
  };
}

const GestaoProfessores = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      bi: "",
      data_nascimento: "",
      numero_funcionario: "",
      habilitacao: "",
      especialidade: "",
      categoria: "",
      data_admissao: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
    if (!loading && user && userRole !== 'admin' && userRole !== 'secretario' && userRole !== 'funcionario') {
      navigate("/dashboard");
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'secretario' || userRole === 'funcionario')) {
      fetchProfessores();
    }
  }, [user, userRole]);

  const fetchProfessores = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("professores")
        .select(`
          *,
          profiles!fk_professores_user_id(
            nome_completo,
            email,
            telefone,
            bi,
            data_nascimento
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfessores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar professores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: ProfessorFormData) => {
    try {
      if (editingProfessor) {
        // Atualizar professor existente
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome_completo: data.nome_completo,
            telefone: data.telefone || null,
            bi: data.bi || null,
            data_nascimento: data.data_nascimento || null,
          })
          .eq("id", editingProfessor.user_id);

        if (profileError) throw profileError;

        const { error: professorError } = await supabase
          .from("professores")
          .update({
            numero_funcionario: data.numero_funcionario,
            habilitacao: data.habilitacao,
            especialidade: data.especialidade || null,
            categoria: data.categoria || null,
            data_admissao: data.data_admissao || null,
          })
          .eq("id", editingProfessor.id);

        if (professorError) throw professorError;

        toast({
          title: "Professor atualizado",
          description: "Os dados do professor foram atualizados com sucesso.",
        });
      } else {
        // Criar novo professor
        if (!data.password) {
          toast({
            title: "Senha obrigatória",
            description: "A senha é obrigatória para criar um novo professor.",
            variant: "destructive",
          });
          return;
        }

        // Criar usuário na autenticação
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nome_completo: data.nome_completo,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar usuário");

        // Atualizar perfil com dados adicionais
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            telefone: data.telefone || null,
            bi: data.bi || null,
            data_nascimento: data.data_nascimento || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Criar registro de professor
        const { error: professorError } = await supabase
          .from("professores")
          .insert({
            user_id: authData.user.id,
            numero_funcionario: data.numero_funcionario,
            habilitacao: data.habilitacao,
            especialidade: data.especialidade || null,
            categoria: data.categoria || null,
            data_admissao: data.data_admissao || null,
          });

        if (professorError) throw professorError;

        // Atribuir role de professor
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "professor",
          });

        if (roleError) throw roleError;

        toast({
          title: "Professor criado",
          description: "O professor foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingProfessor(null);
      form.reset();
      fetchProfessores();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar professor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    form.reset({
      nome_completo: professor.profiles.nome_completo,
      email: professor.profiles.email || "",
      telefone: professor.profiles.telefone || "",
      bi: professor.profiles.bi || "",
      data_nascimento: professor.profiles.data_nascimento || "",
      numero_funcionario: professor.numero_funcionario,
      habilitacao: professor.habilitacao,
      especialidade: professor.especialidade || "",
      categoria: professor.categoria || "",
      data_admissao: professor.data_admissao || "",
      password: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (professor: Professor) => {
    try {
      // Remover role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", professor.user_id)
        .eq("role", "professor");

      if (roleError) throw roleError;

      // Remover professor (o cascade vai remover o perfil)
      const { error: professorError } = await supabase
        .from("professores")
        .delete()
        .eq("id", professor.id);

      if (professorError) throw professorError;

      toast({
        title: "Professor removido",
        description: "O professor foi removido com sucesso.",
      });

      fetchProfessores();
    } catch (error: any) {
      toast({
        title: "Erro ao remover professor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessor(null);
    form.reset();
  };

  if (loading || (userRole !== 'admin' && userRole !== 'secretario' && userRole !== 'funcionario')) {
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/administrativo")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestão de Professores</h1>
              <p className="text-muted-foreground">Gerir professores do sistema</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingProfessor(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProfessor ? "Editar Professor" : "Adicionar Professor"}
                </DialogTitle>
                <DialogDescription>
                  {editingProfessor
                    ? "Atualize os dados do professor abaixo."
                    : "Preencha os dados do novo professor abaixo."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nome_completo"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={!!editingProfessor} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BI</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero_funcionario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Funcionário *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="habilitacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Habilitação *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Licenciatura em Matemática" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="especialidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especialidade</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Matemática" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Professor Efetivo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_admissao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Admissão</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!editingProfessor && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha *</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProfessor ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Professores</CardTitle>
            <CardDescription>
              {loadingData ? "A carregar..." : `Total: ${professores.length} professores`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">A carregar professores...</p>
              </div>
            ) : professores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum professor encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Habilitação</TableHead>
                    <TableHead>Especialidade</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professores.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell className="font-medium">
                        {professor.profiles.nome_completo}
                      </TableCell>
                      <TableCell>{professor.profiles.email}</TableCell>
                      <TableCell>{professor.numero_funcionario}</TableCell>
                      <TableCell>{professor.habilitacao}</TableCell>
                      <TableCell>{professor.especialidade || "-"}</TableCell>
                      <TableCell>{professor.categoria || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(professor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover o professor{" "}
                                  <strong>{professor.profiles.nome_completo}</strong>?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(professor)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GestaoProfessores;
