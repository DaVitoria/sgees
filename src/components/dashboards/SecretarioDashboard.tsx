import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Clock,
  Wallet,
  UserX,
} from "lucide-react";

interface Statistics {
  totalAlunos: number;
  totalProfessores: number;
  matriculasPendentes: number;
  saldoFinanceiro: number;
  totalEntradas: number;
  totalSaidas: number;
}

interface GenderStats {
  alunosHomens: number;
  alunosMulheres: number;
}

export const SecretarioDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Statistics>({
    totalAlunos: 0,
    totalProfessores: 0,
    matriculasPendentes: 0,
    saldoFinanceiro: 0,
    totalEntradas: 0,
    totalSaidas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [usersWithoutRole, setUsersWithoutRole] = useState(0);
  const [genderStats, setGenderStats] = useState<GenderStats>({ alunosHomens: 0, alunosMulheres: 0 });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Fetch total alunos
        const { count: alunosCount } = await supabase
          .from("alunos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activo");

        // Fetch total professores
        const { count: professoresCount } = await supabase
          .from("professores")
          .select("*", { count: "exact", head: true });

        // Fetch matrículas pendentes
        const { count: matriculasPendentesCount } = await supabase
          .from("matriculas")
          .select("*", { count: "exact", head: true })
          .eq("status", "pendente");

        // Fetch financial summary
        const { data: financialData } = await supabase.rpc("get_financial_summary");
        
        const financial = financialData as { saldo_actual?: number; total_entradas?: number; total_saidas?: number } | null;

        // Fetch users without role
        const { data: usersData } = await supabase.rpc("get_users_without_role_count");
        setUsersWithoutRole(usersData || 0);

        // Fetch gender stats
        const { data: genderData } = await supabase.rpc("get_gender_statistics");
        if (genderData) {
          const gd = genderData as any;
          setGenderStats({
            alunosHomens: gd.alunos_homens || 0,
            alunosMulheres: gd.alunos_mulheres || 0,
          });
        }

        setStats({
          totalAlunos: alunosCount || 0,
          totalProfessores: professoresCount || 0,
          matriculasPendentes: matriculasPendentesCount || 0,
          saldoFinanceiro: financial?.saldo_actual || 0,
          totalEntradas: financial?.total_entradas || 0,
          totalSaidas: financial?.total_saidas || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const statisticsCards = [
    {
      title: "Total de Alunos",
      value: stats.totalAlunos.toString(),
      icon: GraduationCap,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: `H: ${genderStats.alunosHomens} | M: ${genderStats.alunosMulheres}`,
    },
    {
      title: "Total de Professores",
      value: stats.totalProfessores.toString(),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Professores registados",
    },
    {
      title: "Matrículas Pendentes",
      value: stats.matriculasPendentes.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Aguardam aprovação",
      highlight: stats.matriculasPendentes > 0,
    },
    {
      title: "Utilizadores Sem Perfil",
      value: usersWithoutRole.toString(),
      icon: UserX,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      description: "Aguardam atribuição de role",
      highlight: usersWithoutRole > 0,
      action: () => navigate("/administrativo/atribuir-roles"),
    },
    {
      title: "Saldo Financeiro",
      value: formatCurrency(stats.saldoFinanceiro),
      icon: Wallet,
      color: stats.saldoFinanceiro >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor: stats.saldoFinanceiro >= 0 ? "bg-emerald-100" : "bg-red-100",
      description: `Entradas: ${formatCurrency(stats.totalEntradas)}`,
    },
  ];

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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statisticsCards.map((stat) => (
          <Card
            key={stat.title}
            className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md ${stat.highlight ? "ring-2 ring-orange-400 animate-pulse" : ""}`}
            onClick={() => stat.action && stat.action()}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {loading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
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
