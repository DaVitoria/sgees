import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Search, Plus, Trash2, UserCog, Crown, GraduationCap, User, Briefcase, Calculator, FileText } from "lucide-react";

interface UserWithRoles {
  id: string;
  email: string;
  nome_completo: string;
  roles: string[];
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const ROLES = [
  { value: "admin", label: "Administrador", icon: Crown, color: "bg-red-500", description: "Acesso total ao sistema" },
  { value: "secretario", label: "Secretário", icon: FileText, color: "bg-purple-500", description: "Gestão administrativa e matrículas" },
  { value: "professor", label: "Professor", icon: GraduationCap, color: "bg-blue-500", description: "Lançamento de notas e gestão de turmas" },
  { value: "aluno", label: "Aluno", icon: User, color: "bg-green-500", description: "Acesso ao portal do aluno" },
  { value: "funcionario", label: "Funcionário", icon: Briefcase, color: "bg-orange-500", description: "Gestão de inventário e operações" },
  { value: "tesoureiro", label: "Tesoureiro", icon: Calculator, color: "bg-yellow-500", description: "Gestão financeira" }
];

const GestaoUtilizadores = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && userRole !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem aceder a esta página",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchUsers();
    }
  }, [user, userRole]);

  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || "",
        nome_completo: profile.nome_completo,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
        created_at: profile.created_at
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar utilizadores",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Selecione um role",
        description: "É necessário selecionar um role para atribuir",
        variant: "destructive"
      });
      return;
    }

    // Check if user already has this role
    if (selectedUser.roles.includes(selectedRole)) {
      toast({
        title: "Role já atribuído",
        description: "Este utilizador já possui este role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: selectedRole as "admin" | "aluno" | "funcionario" | "professor" | "secretario" | "tesoureiro"
        });

      if (error) throw error;

      toast({
        title: "Role atribuído",
        description: `Role "${ROLES.find(r => r.value === selectedRole)?.label}" atribuído com sucesso`
      });

      setIsDialogOpen(false);
      setSelectedRole("");
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    // Prevent removing admin role from self
    if (userId === user?.id && role === 'admin') {
      toast({
        title: "Operação não permitida",
        description: "Não pode remover o seu próprio role de administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as "admin" | "aluno" | "funcionario" | "professor" | "secretario" | "tesoureiro");

      if (error) throw error;

      toast({
        title: "Role removido",
        description: `Role "${ROLES.find(r => r.value === role)?.label}" removido com sucesso`
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao remover role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "todos" || u.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find(r => r.value === role);
    if (!roleInfo) return <Badge>{role}</Badge>;
    return (
      <Badge className={`${roleInfo.color} text-white`}>
        {roleInfo.label}
      </Badge>
    );
  };

  const totalAdmins = users.filter(u => u.roles.includes('admin')).length;
  const totalProfessores = users.filter(u => u.roles.includes('professor')).length;
  const totalAlunos = users.filter(u => u.roles.includes('aluno')).length;
  const totalSemRole = users.filter(u => u.roles.length === 0).length;

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user || userRole !== 'admin') return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Utilizadores</h2>
            <p className="text-muted-foreground">
              Gerir roles e níveis de acesso dos utilizadores do sistema
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Utilizadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Registados no sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Crown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdmins}</div>
              <p className="text-xs text-muted-foreground">Com acesso total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProfessores}</div>
              <p className="text-xs text-muted-foreground">Docentes activos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Role</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSemRole}</div>
              <p className="text-xs text-muted-foreground">Aguardam atribuição</p>
            </CardContent>
          </Card>
        </div>

        {/* Roles Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Níveis de Acesso</CardTitle>
            <CardDescription>Descrição dos roles disponíveis no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <div key={role.value} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded ${role.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os roles</SelectItem>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Utilizadores</CardTitle>
            <CardDescription>
              {filteredUsers.length} utilizador(es) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        Nenhum utilizador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.roles.includes('admin') && (
                              <Crown className="h-4 w-4 text-red-500" />
                            )}
                            {u.nome_completo}
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                Sem role
                              </Badge>
                            ) : (
                              u.roles.map((role) => (
                                <div key={role} className="flex items-center gap-1">
                                  {getRoleBadge(role)}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        disabled={u.id === user?.id && role === 'admin'}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover Role</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja remover o role "{ROLES.find(r => r.value === role)?.label}" de {u.nome_completo}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRemoveRole(u.id, role)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) {
                              setSelectedUser(null);
                              setSelectedRole("");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(u)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Atribuir Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Atribuir Role</DialogTitle>
                                <DialogDescription>
                                  Selecione o role a atribuir a {u.nome_completo}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ROLES.filter(r => !u.roles.includes(r.value)).map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                          <div className="flex items-center gap-2">
                                            <role.icon className="h-4 w-4" />
                                            {role.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {selectedRole && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                      {ROLES.find(r => r.value === selectedRole)?.description}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleAddRole} disabled={!selectedRole}>
                                  Atribuir
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

export default GestaoUtilizadores;
