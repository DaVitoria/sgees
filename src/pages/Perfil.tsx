import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserCircle, Mail, Phone, Calendar, MapPin, CreditCard } from "lucide-react";

const Perfil = () => {
  const { user, userRole, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    endereco: "",
    bi: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Erro ao carregar perfil");
      return;
    }

    if (data) {
      setProfileData({
        nome_completo: data.nome_completo || "",
        email: data.email || "",
        telefone: data.telefone || "",
        data_nascimento: data.data_nascimento || "",
        endereco: data.endereco || "",
        bi: data.bi || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile({
      nome_completo: profileData.nome_completo,
      telefone: profileData.telefone,
      data_nascimento: profileData.data_nascimento,
      endereco: profileData.endereco,
    });

    if (error) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } else {
      toast.success("Perfil atualizado com sucesso!");
    }
    
    setLoading(false);
  };

  const getRoleName = (role: string | null) => {
    const roleMap: Record<string, string> = {
      admin: "Administrador",
      secretario: "Secretário",
      professor: "Professor",
      aluno: "Aluno",
      funcionario: "Funcionário",
      tesoureiro: "Tesoureiro",
    };
    return role ? roleMap[role] || role : "Sem Role";
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerir as suas informações pessoais</p>
          </div>
          <Badge variant="secondary" className="text-lg">
            {getRoleName(userRole)}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize os seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome_completo"
                      className="pl-9"
                      value={profileData.nome_completo}
                      onChange={(e) => setProfileData({ ...profileData, nome_completo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={profileData.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      className="pl-9"
                      value={profileData.telefone}
                      onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="data_nascimento"
                      type="date"
                      className="pl-9"
                      value={profileData.data_nascimento}
                      onChange={(e) => setProfileData({ ...profileData, data_nascimento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bi">Bilhete de Identidade</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bi"
                      className="pl-9"
                      value={profileData.bi}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endereco"
                      className="pl-9"
                      value={profileData.endereco}
                      onChange={(e) => setProfileData({ ...profileData, endereco: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={fetchProfile}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Perfil;
