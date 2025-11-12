import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export const FuncionarioDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    receitasMes: 0,
    despesasMes: 0,
    saldo: 0,
    itensInventario: 0,
    documentos: 0,
  });
  const [financeChart, setFinanceChart] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [financasRes, inventarioRes, documentosRes] = await Promise.all([
        supabase.from("financas").select("tipo, valor, categoria, data_transacao"),
        supabase.from("inventario").select("id", { count: "exact" }),
        supabase.from("documentos").select("id", { count: "exact" }),
      ]);

      // Calcular receitas e despesas do mês atual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const transacoesMes = financasRes.data?.filter(f => 
        new Date(f.data_transacao) >= new Date(firstDayOfMonth)
      ) || [];

      const receitasMes = transacoesMes
        .filter(f => f.tipo === "entrada")
        .reduce((acc, f) => acc + Number(f.valor), 0);
      
      const despesasMes = transacoesMes
        .filter(f => f.tipo === "saida")
        .reduce((acc, f) => acc + Number(f.valor), 0);

      // Calcular saldo total
      const entradas = financasRes.data?.filter(f => f.tipo === "entrada").reduce((acc, f) => acc + Number(f.valor), 0) || 0;
      const saidas = financasRes.data?.filter(f => f.tipo === "saida").reduce((acc, f) => acc + Number(f.valor), 0) || 0;

      setStats({
        receitasMes,
        despesasMes,
        saldo: entradas - saidas,
        itensInventario: inventarioRes.count || 0,
        documentos: documentosRes.count || 0,
      });

      // Dados por categoria (Pie chart)
      const byCategory = financasRes.data?.reduce((acc: any, f) => {
        const key = `${f.categoria}_${f.tipo}`;
        if (!acc[key]) {
          acc[key] = { categoria: f.categoria, tipo: f.tipo, valor: 0 };
        }
        acc[key].valor += Number(f.valor);
        return acc;
      }, {}) || {};

      const categoryChart = Object.values(byCategory).slice(0, 5).map((c: any) => ({
        name: `${c.categoria} (${c.tipo === 'entrada' ? 'Entrada' : 'Saída'})`,
        value: c.valor,
      }));
      setCategoryData(categoryChart);

      // Tendência mensal (últimos 6 meses)
      const monthlyData: any = {};
      financasRes.data?.forEach(f => {
        const month = new Date(f.data_transacao).toLocaleDateString('pt-MZ', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { mes: month, entrada: 0, saida: 0 };
        }
        if (f.tipo === "entrada") {
          monthlyData[month].entrada += Number(f.valor);
        } else {
          monthlyData[month].saida += Number(f.valor);
        }
      });

      setMonthlyTrend(Object.values(monthlyData).slice(-6));

      // Dados para comparação entrada vs saída
      setFinanceChart([
        { name: "Entradas", valor: entradas },
        { name: "Saídas", valor: saidas },
      ]);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">A carregar dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Operacional</h1>
        <p className="text-muted-foreground">
          Gestão financeira e inventário
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Receitas do Mês</p>
          <p className="text-2xl font-bold mt-1">{(stats.receitasMes / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Despesas do Mês</p>
          <p className="text-2xl font-bold mt-1">{(stats.despesasMes / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Saldo Actual</p>
          <p className="text-2xl font-bold mt-1">{(stats.saldo / 1000).toFixed(1)}K MZN</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Itens em Inventário</p>
          <p className="text-2xl font-bold mt-1">{stats.itensInventario}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Documentos</p>
          <p className="text-2xl font-bold mt-1">{stats.documentos}</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
                <Bar dataKey="valor" fill="#3b82f6">
                  {financeChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} MZN`} />
              <Legend />
              <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gestão Financeira</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gerir receitas e despesas da escola
          </p>
          <Button className="w-full" onClick={() => navigate("/administrativo/gestao-financeira")}>
            Abrir Finanças
          </Button>
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
