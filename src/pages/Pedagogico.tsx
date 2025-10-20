import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ClipboardCheck, BarChart3, FileCheck } from "lucide-react";

const Pedagogico = () => {
  const modules = [
    {
      title: "Gestão de Turmas",
      description: "Criar e organizar turmas e horários",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Atribuição de Disciplinas",
      description: "Atribuir professores às disciplinas e turmas",
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Lançamento de Notas",
      description: "Registar avaliações e notas dos alunos",
      icon: ClipboardCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Relatórios Pedagógicos",
      description: "Visualizar estatísticas de aproveitamento",
      icon: BarChart3,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Aprovações",
      description: "Gerir aprovações, reprovações e exames",
      icon: FileCheck,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Área Pedagógica</h2>
          <p className="text-muted-foreground">
            Gerir processos pedagógicos e académicos
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
                  <Button className="w-full">Aceder</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Pedagogico;
