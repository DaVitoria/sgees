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
import { Plus, Pencil, Trash2, ArrowLeft, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mapDatabaseError } from "@/utils/errorHandler";

const professorSchema = z.object({
  numero_funcionario: z.string().trim().min(1, "Número de funcionário é obrigatório").max(50, "Número muito longo"),
  habilitacao: z.string().trim().min(1, "Habilitação é obrigatória").max(100, "Habilitação muito longa"),
  especialidade: z.string().trim().max(100, "Especialidade muito longa").optional(),
  categoria: z.string().trim().max(50, "Categoria muito longa").optional(),
  data_admissao: z.string().optional(),
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

interface AvailableProfessorUser {
  user_id: string;
  nome_completo: string;
  email: string | null;
}

const GestaoProfessores = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableProfessorUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      numero_funcionario: "",
      habilitacao: "",
      especialidade: "",
      categoria: "",
      data_admissao: "",
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
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Buscar utilizadores com role professor que ainda não estão na tabela professores
  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Buscar todos os user_ids que têm role professor
      const { data: professorRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");
      
      if (rolesError) throw rolesError;
      
      if (!professorRoles || professorRoles.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Buscar todos os user_ids que já estão na tabela professores
      const { data: existingProfessores, error: profError } = await supabase
        .from("professores")
        .select("user_id");
      
      if (profError) throw profError;

      const existingUserIds = new Set((existingProfessores || []).map(p => p.user_id));
      
      // Filtrar os que têm role professor mas não estão na tabela
      const availableUserIds = professorRoles
        .filter(r => !existingUserIds.has(r.user_id))
        .map(r => r.user_id);

      if (availableUserIds.length === 0) {
        setAvailableUsers([]);
        return;
      }

      // Buscar profiles desses utilizadores
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .in("id", availableUserIds);
      
      if (profilesError) throw profilesError;

      setAvailableUsers(
        (profiles || []).map(p => ({
          user_id: p.id,
          nome_completo: p.nome_completo,
          email: p.email
        }))
      );
    } catch (error: any) {
      toast({
        title: "Erro ao carregar utilizadores disponíveis",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmit = async (data: ProfessorFormData) => {
    try {
      if (editingProfessor) {
        // Atualizar professor existente
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
        // Criar novo registro de professor para utilizador existente
        if (!selectedUserId) {
          toast({
            title: "Selecione um utilizador",
            description: "Selecione um utilizador com perfil de professor para alocar.",
            variant: "destructive",
          });
          return;
        }

        // Verificar se já existe um professor com esse user_id
        const { data: existing, error: checkError } = await supabase
          .from("professores")
          .select("id")
          .eq("user_id", selectedUserId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          toast({
            title: "Utilizador já alocado",
            description: "Este utilizador já possui um registro de professor.",
            variant: "destructive",
          });
          return;
        }

        // Criar registro de professor
        const { error: professorError } = await supabase
          .from("professores")
          .insert({
            user_id: selectedUserId,
            numero_funcionario: data.numero_funcionario,
            habilitacao: data.habilitacao,
            especialidade: data.especialidade || null,
            categoria: data.categoria || null,
            data_admissao: data.data_admissao || null,
          });

        if (professorError) throw professorError;

        toast({
          title: "Professor alocado",
          description: "O professor foi alocado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingProfessor(null);
      setSelectedUserId("");
      form.reset();
      fetchProfessores();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar professor",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    form.reset({
      numero_funcionario: professor.numero_funcionario,
      habilitacao: professor.habilitacao,
      especialidade: professor.especialidade || "",
      categoria: professor.categoria || "",
      data_admissao: professor.data_admissao || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (professor: Professor) => {
    try {
      // Apenas remover da tabela professores (não remove role nem auth)
      const { error: professorError } = await supabase
        .from("professores")
        .delete()
        .eq("id", professor.id);

      if (professorError) throw professorError;

      toast({
        title: "Professor removido",
        description: "O registro do professor foi removido com sucesso.",
      });

      fetchProfessores();
    } catch (error: any) {
      toast({
        title: "Erro ao remover professor",
        description: mapDatabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleOpenDialog = () => {
    setEditingProfessor(null);
    setSelectedUserId("");
    form.reset();
    fetchAvailableUsers();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessor(null);
    setSelectedUserId("");
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
      <div className="space-y-6 px-2 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/administrativo")} className="w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestão de Professores</h1>
              <p className="text-muted-foreground text-sm">Gerir professores do sistema</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (open) handleOpenDialog();
            else handleCloseDialog();
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Alocar Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="text-left">
                <DialogTitle>
                  {editingProfessor ? "Editar Professor" : "Alocar Professor"}
                </DialogTitle>
                <DialogDescription>
                  {editingProfessor
                    ? "Atualize os dados do professor abaixo."
                    : "Selecione um utilizador com perfil de professor e preencha os dados profissionais."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {!editingProfessor && (
                    <div className="space-y-2">
                      <Label>Utilizador com Perfil Professor *</Label>
                      {loadingUsers ? (
                        <p className="text-sm text-muted-foreground">A carregar utilizadores...</p>
                      ) : availableUsers.length === 0 ? (
                        <div className="p-4 border rounded-md bg-muted/50">
                          <p className="text-sm text-muted-foreground">
                            Nenhum utilizador com perfil professor disponível para alocar.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Certifique-se de que o utilizador já possui a role "professor" atribuída em Atribuir Roles.
                          </p>
                        </div>
                      ) : (
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um utilizador" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((u) => (
                              <SelectItem key={u.user_id} value={u.user_id}>
                                {u.nome_completo} ({u.email || "Sem email"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {editingProfessor && (
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm font-medium">{editingProfessor.profiles.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">{editingProfessor.profiles.email}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numero_funcionario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Funcionário *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: PROF001" />
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
                  </div>
                  <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={!editingProfessor && (!selectedUserId || availableUsers.length === 0)}
                      className="w-full sm:w-auto"
                    >
                      {editingProfessor ? "Atualizar" : "Alocar"}
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
                <p className="text-muted-foreground">Nenhum professor alocado.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Para alocar um professor, primeiro atribua a role "professor".
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Habilitação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professores.map((professor) => (
                        <TableRow key={professor.id}>
                          <TableCell className="font-medium">
                            {professor.profiles.nome_completo}
                          </TableCell>
                          <TableCell className="text-sm">{professor.profiles.email}</TableCell>
                          <TableCell>{professor.numero_funcionario}</TableCell>
                          <TableCell>{professor.habilitacao}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(professor)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remover <strong>{professor.profiles.nome_completo}</strong>?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(professor)}
                                      className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
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
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {professores.map((professor) => (
                    <div key={professor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{professor.profiles.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">{professor.profiles.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Número:</span>
                          <p>{professor.numero_funcionario}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Habilitação:</span>
                          <p>{professor.habilitacao}</p>
                        </div>
                        {professor.especialidade && (
                          <div>
                            <span className="text-muted-foreground">Especialidade:</span>
                            <p>{professor.especialidade}</p>
                          </div>
                        )}
                        {professor.categoria && (
                          <div>
                            <span className="text-muted-foreground">Categoria:</span>
                            <p>{professor.categoria}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-1 pt-2 border-t">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(professor)}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[95vw] max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remover <strong>{professor.profiles.nome_completo}</strong>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(professor)}
                                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GestaoProfessores;
