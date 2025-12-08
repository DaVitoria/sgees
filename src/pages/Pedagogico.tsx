import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ClipboardCheck, BarChart3, FileCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Pedagogico = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const allModules = [
    {
      title: "Gestão de Turmas",
      description: "Criar e organizar turmas e horários",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      route: "/pedagogico/gestao-turmas",
      allowedRoles: ["admin", "funcionario", "secretario"],
    },
    {
      title: "Atribuição de Disciplinas",
      description: "Atribuir professores às disciplinas e turmas",
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
      route: "/pedagogico/atribuicao-disciplinas",
      allowedRoles: ["admin", "secretario"],
    },
    {
      title: "Lançamento de Notas",
      description: "Registar avaliações e notas dos alunos",
      icon: ClipboardCheck,
      color: "text-success",
      bgColor: "bg-success/10",
      route: "/pedagogico/lancamento-notas",
      allowedRoles: ["professor"],
    },
    {
      title: "Relatórios Pedagógicos",
      description: "Visualizar estatísticas de aproveitamento",
      icon: BarChart3,
      color: "text-warning",
      bgColor: "bg-warning/10",
      route: "/pedagogico/relatorios",
      allowedRoles: ["admin", "professor"],
    },
    {
      title: "Aprovações",
      description: "Gerir aprovações, reprovações e exames",
      icon: FileCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
      route: "/pedagogico/aprovacoes",
      allowedRoles: ["admin", "professor", "funcionario"],
    },
    {
      title: "Gestão de Exames",
      description: "Gerir exames das classes 9ª, 10ª e 12ª",
      icon: GraduationCap,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      route: "/pedagogico/gestao-exames",
      allowedRoles: ["admin", "professor"],
    },
  ];

  const visibleModules = allModules.filter(
    (module) => userRole && module.allowedRoles.includes(userRole)
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
          <h2 className="text-3xl font-bold tracking-tight">Área Pedagógica</h2>
          <p className="text-muted-foreground">
            Gerir processos pedagógicos e académicos
          </p>
        </div>

        {visibleModules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Não tem permissões para aceder aos módulos pedagógicos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleModules.map((module) => {
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
                    <Button className="w-full" onClick={() => navigate(module.route)}>Aceder</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Pedagogico;
