import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  ClipboardList,
  DollarSign,
  Package,
  FileText,
  BarChart3,
  Building2,
  School,
  TrendingUp,
} from "lucide-react";

export const SecretarioDashboard = () => {
  const navigate = useNavigate();

  const administrativeModules = [
    {
      title: "Atribuir Perfis",
      description: "Atribuir perfis a utilizadores sem role definido",
      icon: UserCheck,
      path: "/administrativo/atribuir-roles",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Gestão de Professores",
      description: "Cadastrar e gerir professores do sistema",
      icon: Users,
      path: "/gestao-professores",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Gestão de Alunos",
      description: "Cadastrar e gerir alunos do sistema",
      icon: GraduationCap,
      path: "/gestao-alunos",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Matrículas",
      description: "Registar novas matrículas e transferências",
      icon: ClipboardList,
      path: "/administrativo/matriculas",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Gestão Financeira",
      description: "Controlar receitas, despesas e saldo da escola",
      icon: DollarSign,
      path: "/gestao-financeira",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Inventário",
      description: "Gerir bens, materiais e equipamentos escolares",
      icon: Package,
      path: "/administrativo/inventario",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Documentos",
      description: "Emitir certificados, declarações e boletins",
      icon: FileText,
      path: "/administrativo/documentos",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Relatórios",
      description: "Gerar relatórios administrativos e financeiros",
      icon: BarChart3,
      path: "/administrativo/relatorios",
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      title: "Organograma",
      description: "Configurar a estrutura organizacional da escola",
      icon: Building2,
      path: "/administrativo/organograma",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];

  const pedagogicalModules = [
    {
      title: "Gestão de Turmas",
      description: "Criar e organizar turmas e horários",
      icon: School,
      path: "/pedagogico/gestao-turmas",
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      title: "Relatórios Pedagógicos",
      description: "Visualizar estatísticas de aproveitamento",
      icon: TrendingUp,
      path: "/pedagogico/relatorios",
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard do Secretário</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo ao painel de gestão. Aceda às funcionalidades administrativas e pedagógicas abaixo.
        </p>
      </div>

      {/* Área Administrativa */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Área Administrativa</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {administrativeModules.map((module) => (
            <Card
              key={module.title}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.bgColor} group-hover:scale-110 transition-transform`}>
                    <module.icon className={`h-5 w-5 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{module.description}</CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Aceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Área Pedagógica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Área Pedagógica</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedagogicalModules.map((module) => (
            <Card
              key={module.title}
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${module.bgColor} group-hover:scale-110 transition-transform`}>
                    <module.icon className={`h-5 w-5 ${module.color}`} />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{module.description}</CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Aceder
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
