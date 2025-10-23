import { Card } from "@/components/ui/card";
import { DollarSign, Package, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FuncionarioDashboard = () => {
  const stats = [
    {
      title: "Receitas do Mês",
      value: "450.000 Kz",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "+12%",
    },
    {
      title: "Despesas do Mês",
      value: "280.000 Kz",
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trend: "+5%",
    },
    {
      title: "Itens em Inventário",
      value: "234",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Documentos Gerados",
      value: "48",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const recentTransactions = [
    { tipo: "Receita", descricao: "Mensalidade - João Silva", valor: "12.000 Kz", data: "Hoje" },
    { tipo: "Despesa", descricao: "Material de limpeza", valor: "3.500 Kz", data: "Hoje" },
    { tipo: "Receita", descricao: "Mensalidade - Maria Costa", valor: "12.000 Kz", data: "Ontem" },
    { tipo: "Despesa", descricao: "Manutenção elétrica", valor: "15.000 Kz", data: "Ontem" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Operacional</h1>
        <p className="text-muted-foreground">
          Gestão financeira e inventário
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.bgColor} p-2 rounded`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              {stat.trend && (
                <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transações Recentes</h3>
            <Button variant="outline" size="sm">Ver Todas</Button>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm">{transaction.descricao}</p>
                  <p className="text-xs text-muted-foreground">{transaction.data}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${transaction.tipo === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.tipo === 'Despesa' ? '-' : '+'}{transaction.valor}
                  </p>
                  <span className="text-xs text-muted-foreground">{transaction.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Alertas de Inventário</h3>
            <Button variant="outline" size="sm">Ver Inventário</Button>
          </div>
          <div className="space-y-3">
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
              <p className="font-medium text-sm text-yellow-800">Papel A4 - Estoque Baixo</p>
              <p className="text-xs text-yellow-700">Apenas 50 resmas disponíveis</p>
            </div>
            <div className="p-3 border border-red-200 bg-red-50 rounded">
              <p className="font-medium text-sm text-red-800">Canetas - Crítico</p>
              <p className="text-xs text-red-700">Apenas 20 unidades disponíveis</p>
            </div>
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded">
              <p className="font-medium text-sm text-yellow-800">Material de Limpeza</p>
              <p className="text-xs text-yellow-700">Reposição necessária em breve</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gestão Financeira</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerir receitas e despesas da escola
          </p>
          <Button className="w-full">Abrir Finanças</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Inventário</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Controlar materiais e equipamentos
          </p>
          <Button className="w-full">Abrir Inventário</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Documentos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerar certificados e declarações
          </p>
          <Button className="w-full">Gerar Documento</Button>
        </Card>
      </div>
    </div>
  );
};
