import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserPlus, Shield, GraduationCap, User, Briefcase, AlertCircle, CheckCircle } from "lucide-react";

interface UserWithoutRole {
  id: string;
  email: string;
  nome_completo: string;
  created_at: string;
}

const ASSIGNABLE_ROLES = [
  { value: "aluno", label: "Aluno", icon: User, color: "bg-green-500", description: "Acesso ao portal do aluno" },
  { value: "professor", label: "Professor", icon: GraduationCap, color: "bg-blue-500", description: "Lançamento de notas e gestão de turmas" },
  { value: "funcionario", label: "Funcionário", icon: Briefcase, color: "bg-orange-500", description: "Gestão de inventário e operações" },
];

const AtribuirRoles = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [usersWithoutRole, setUsersWithoutRole] = useState<UserWithoutRole[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [assigningRole, setAssigningRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user && userRole !== 'secretario' && userRole !== 'admin') {
      toast({
        title: "Acesso negado",
        description: "Apenas secretários podem aceder a esta página",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === 'secretario' || userRole === 'admin')) {
      fetchUsersWithoutRole();
    }
  }, [user, userRole]);

  const fetchUsersWithoutRole = async () => {
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
        .select("user_id");

      if (rolesError) throw rolesError;

      // Filter users without any role
      const userIdsWithRoles = new Set((roles || []).map(r => r.user_id));
      const usersNoRole = (profiles || []).filter(p => !userIdsWithRoles.has(p.id));

      setUsersWithoutRole(usersNoRole.map(p => ({
        id: p.id,
        email: p.email || "",
        nome_completo: p.nome_completo,
        created_at: p.created_at || ""
      })));
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

  const handleAssignRole = async (userId: string) => {
    const role = selectedRoles[userId];
    if (!role) {
      toast({
        title: "Selecione um perfil",
        description: "É necessário selecionar um perfil para atribuir",
        variant: "destructive"
      });
      return;
    }

    setAssigningRole(userId);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: role as "aluno" | "professor" | "funcionario"
        });

      if (error) throw error;

      toast({
        title: "Perfil atribuído",
        description: `Perfil "${ASSIGNABLE_ROLES.find(r => r.value === role)?.label}" atribuído com sucesso`
      });

      // Remove from list
      setUsersWithoutRole(prev => prev.filter(u => u.id !== userId));
      setSelectedRoles(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir perfil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAssigningRole(null);
    }
  };

  const filteredUsers = usersWithoutRole.filter(u => 
    u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== 'secretario' && userRole !== 'admin')) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Atribuir Perfis</h2>
            <p className="text-muted-foreground">
              Atribuir perfis a utilizadores recém-registados
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg text-blue-700 dark:text-blue-400">Informação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Utilizadores que se registam no sistema ficam sem perfil definido até serem aprovados. 
              Atribua o perfil adequado para permitir o acesso às funcionalidades do sistema.
            </p>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardam Atribuição</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithoutRole.length}</div>
              <p className="text-xs text-muted-foreground">Utilizadores sem perfil</p>
            </CardContent>
          </Card>
          {ASSIGNABLE_ROLES.map(role => {
            const Icon = role.icon;
            return (
              <Card key={role.value}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{role.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${role.color.replace('bg-', 'text-')}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Utilizadores sem Perfil</CardTitle>
            <CardDescription>
              {filteredUsers.length} utilizador(es) aguardam atribuição de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">Tudo em ordem!</h3>
                <p className="text-muted-foreground">
                  Não existem utilizadores aguardando atribuição de perfil.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data de Registo</TableHead>
                      <TableHead>Perfil a Atribuir</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {u.nome_completo}
                          </div>
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{formatDate(u.created_at)}</TableCell>
                        <TableCell>
                          <Select
                            value={selectedRoles[u.id] || ""}
                            onValueChange={(value) => setSelectedRoles(prev => ({
                              ...prev,
                              [u.id]: value
                            }))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${role.color} text-white text-xs`}>
                                      {role.label}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAssignRole(u.id)}
                            disabled={!selectedRoles[u.id] || assigningRole === u.id}
                          >
                            {assigningRole === u.id ? (
                              "A atribuir..."
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Atribuir
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AtribuirRoles;
