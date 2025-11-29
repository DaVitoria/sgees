import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, FileText, Package, DollarSign, BarChart, UserPlus } from "lucide-react";

const Administrativo = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  const modules = [
    {
      title: "Gestão de Professores",
      description: "Cadastrar e gerir professores do sistema",
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/administrativo/gestao-professores",
    },
    {
      title: "Gestão de Alunos",
      description: "Cadastrar e gerir alunos do sistema",
      icon: UserPlus,
      color: "text-accent",
      bgColor: "bg-accent/10",
      path: "/administrativo/gestao-alunos",
    },
    {
      title: "Matrículas",
      description: "Registar novas matrículas e transferências",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      path: "/administrativo/matriculas",
    },
    {
      title: "Gestão Financeira",
      description: "Controlar receitas, despesas e saldo da escola",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      path: "/administrativo/gestao-financeira",
    },
    {
      title: "Inventário",
      description: "Gerir bens, materiais e equipamentos escolares",
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Documentos",
      description: "Emitir certificados, declarações e boletins",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Relatórios",
      description: "Gerar relatórios administrativos e financeiros",
      icon: BarChart,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

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
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow">
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
