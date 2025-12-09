import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, FileText, Package, DollarSign, BarChart, UserPlus, Shield, Network } from "lucide-react";

const Administrativo = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const modules = [
    {
      title: "Gestão de Utilizadores",
      description: "Gerir roles e níveis de acesso dos utilizadores",
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      path: "/administrativo/gestao-utilizadores",
      allowedRoles: ["admin"],
    },
    {
      title: "Atribuir Perfis",
      description: "Atribuir perfis a utilizadores sem role definido",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      path: "/administrativo/atribuir-roles",
      allowedRoles: ["admin", "secretario"],
    },
    {
      title: "Gestão de Professores",
      description: "Cadastrar e gerir professores do sistema",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/administrativo/gestao-professores",
      allowedRoles: ["admin", "funcionario", "secretario"],
    },
    {
      title: "Gestão de Alunos",
      description: "Cadastrar e gerir alunos do sistema",
      icon: UserPlus,
      color: "text-accent",
      bgColor: "bg-accent/10",
      path: "/administrativo/gestao-alunos",
      allowedRoles: ["admin", "funcionario", "secretario"],
    },
    {
      title: "Matrículas",
      description: "Registar novas matrículas e transferências",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      path: "/administrativo/matriculas",
      allowedRoles: ["admin", "funcionario", "secretario"],
    },
    {
      title: "Gestão Financeira",
      description: "Controlar receitas, despesas e saldo da escola",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      path: "/administrativo/gestao-financeira",
      allowedRoles: ["admin", "tesoureiro"],
    },
    {
      title: "Inventário",
      description: "Gerir bens, materiais e equipamentos escolares",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
      path: "/administrativo/inventario",
      allowedRoles: ["admin", "funcionario"],
    },
    {
      title: "Documentos",
      description: "Emitir certificados, declarações e boletins",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/administrativo/documentos",
      allowedRoles: ["admin", "secretario", "funcionario"],
    },
    {
      title: "Relatórios",
      description: "Gerar relatórios administrativos e financeiros",
      icon: BarChart,
      color: "text-accent",
      bgColor: "bg-accent/10",
      path: "/administrativo/relatorios",
      allowedRoles: ["admin", "funcionario", "tesoureiro"],
    },
    {
      title: "Organograma",
      description: "Configurar a estrutura organizacional da escola",
      icon: Network,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      path: "/administrativo/organograma",
      allowedRoles: ["admin", "funcionario"],
    },
  ];

  // Filter modules based on user role
  const visibleModules = modules.filter(m => 
    !m.allowedRoles || m.allowedRoles.includes(userRole || "")
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

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Área Administrativa</h2>
          <p className="text-muted-foreground">
            Gerir todos os aspectos administrativos da escola
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            const isRestricted = module.allowedRoles?.includes("admin") && module.allowedRoles.length === 1;
            return (
              <Card key={module.title} className={`hover:shadow-lg transition-shadow ${isRestricted ? 'border-red-500/30' : ''}`}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => module.path ? navigate(module.path) : null}
                    disabled={!module.path}
                    variant={isRestricted ? "destructive" : "default"}
                  >
                    Aceder
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Administrativo;
