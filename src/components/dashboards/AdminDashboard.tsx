import { Card } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, TrendingUp, GraduationCap, Building2 } from "lucide-react";

export const AdminDashboard = () => {
  const stats = [
    {
      title: "Total de Alunos",
      value: "486",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Professores Ativos",
      value: "42",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Saldo da Escola",
      value: "850.000 Kz",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Aproveitamento Médio",
      value: "78%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Turmas Ativas",
      value: "24",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Funcionários",
      value: "18",
      icon: Building2,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral completa da escola
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Atividades Recentes</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="bg-blue-100 p-2 rounded">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nova matrícula registrada</p>
                <p className="text-xs text-muted-foreground">João Silva - 8ª Classe - Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="bg-green-100 p-2 rounded">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Pagamento recebido</p>
                <p className="text-xs text-muted-foreground">Maria Costa - Mensalidade - Há 5 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Notas lançadas</p>
                <p className="text-xs text-muted-foreground">Prof. António - Matemática 9ª - Ontem</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Próximos Eventos</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="bg-red-100 p-2 rounded text-center min-w-[50px]">
                <p className="text-xs font-medium text-red-600">MAR</p>
                <p className="text-lg font-bold text-red-600">15</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Reunião de Pais e Professores</p>
                <p className="text-xs text-muted-foreground">Todas as turmas - 14:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="bg-blue-100 p-2 rounded text-center min-w-[50px]">
                <p className="text-xs font-medium text-blue-600">MAR</p>
                <p className="text-lg font-bold text-blue-600">20</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Fim do 1º Trimestre</p>
                <p className="text-xs text-muted-foreground">Entrega de avaliações</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded text-center min-w-[50px]">
                <p className="text-xs font-medium text-green-600">ABR</p>
                <p className="text-lg font-bold text-green-600">05</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Formação de Professores</p>
                <p className="text-xs text-muted-foreground">Novas metodologias - 09:00</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
