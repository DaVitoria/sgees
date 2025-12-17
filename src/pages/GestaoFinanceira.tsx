import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter } from "lucide-react";
import { z } from "zod";

const transacaoSchema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  descricao: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").max(200),
  data_transacao: z.string().min(1, "Data é obrigatória"),
  aluno_id: z.string().optional(),
  comprovante: z.string().optional(),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

interface Transacao {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  descricao: string;
  data_transacao: string;
  comprovante: string | null;
  registado_por: string;
  aluno_id: string | null;
  alunos: {
    numero_matricula: string;
    profiles: {
      nome_completo: string;
    } | null;
  } | null;
  profiles: {
    nome_completo: string;
  } | null;
}

interface Aluno {
  id: string;
  numero_matricula: string;
  profiles: {
    nome_completo: string;
  } | null;
}

const categoriasEntrada = [
  "matricula",
  "mensalidade",
  "contribuicao",
  "servicos",
  "producao_escolar",
  "outros",
];

const categoriasSaida = [
  "manutencao",
  "materiais",
  "eventos",
  "pagamentos",
  "outros",
];

const categoriaLabels: Record<string, string> = {
  matricula: "Matrícula",
  mensalidade: "Mensalidade",
  contribuicao: "Contribuição",
  servicos: "Serviços",
  producao_escolar: "Produção Escolar",
  manutencao: "Manutenção",
  materiais: "Materiais",
  eventos: "Eventos",
  pagamentos: "Pagamentos",
  outros: "Outros",
};

const GestaoFinanceira = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [saldo, setSaldo] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [formData, setFormData] = useState<TransacaoFormData>({
    tipo: "entrada",
    categoria: "",
    valor: 0,
    descricao: "",
    data_transacao: new Date().toISOString().split("T")[0],
    aluno_id: "",
    comprovante: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "tesoureiro")) {
      fetchTransacoes();
      fetchAlunos();
    }
  }, [user, userRole]);

  const fetchTransacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("financas")
        .select(`
          id,
          tipo,
          categoria,
          valor,
          descricao,
          data_transacao,
          comprovante,
          registado_por,
          aluno_id,
          alunos!fk_financas_aluno_id (
            numero_matricula,
            profiles!fk_alunos_user (
              nome_completo
            )
          )
        `)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      
      // Fetch registado_por profiles separately to avoid join conflicts
      const transacoesComPerfis = await Promise.all(
        (data || []).map(async (transacao) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome_completo")
            .eq("id", transacao.registado_por)
            .single();
          
          return {
            ...transacao,
            profiles: profile,
          };
        })
      );
      
      setTransacoes(transacoesComPerfis);
      calcularResumo(transacoesComPerfis);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          numero_matricula,
          profiles:user_id (
            nome_completo
          )
        `)
        .eq("estado", "activo")
        .order("numero_matricula");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alunos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calcularResumo = (transacoes: Transacao[]) => {
    const entradas = transacoes
      .filter((t) => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const saidas = transacoes
      .filter((t) => t.tipo === "saida")
      .reduce((sum, t) => sum + Number(t.valor), 0);

    setTotalEntradas(entradas);
    setTotalSaidas(saidas);
    setSaldo(entradas - saidas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = transacaoSchema.parse({
        ...formData,
        valor: Number(formData.valor),
        aluno_id: formData.aluno_id || undefined,
        comprovante: formData.comprovante || undefined,
      });

      const { error } = await supabase
        .from("financas")
        .insert([{
          tipo: validatedData.tipo as any,
          categoria: validatedData.categoria as any,
          valor: validatedData.valor,
          descricao: validatedData.descricao,
          data_transacao: validatedData.data_transacao,
          aluno_id: validatedData.aluno_id || null,
          comprovante: validatedData.comprovante || null,
          registado_por: user!.id,
        }]);

      if (error) throw error;

      toast({
        title: "Transação registrada",
        description: "A transação foi registrada com sucesso.",
      });

      setIsDialogOpen(false);
      setFormData({
        tipo: "entrada",
        categoria: "",
        valor: 0,
        descricao: "",
        data_transacao: new Date().toISOString().split("T")[0],
        aluno_id: "",
        comprovante: "",
      });
      fetchTransacoes();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: "Erro ao registrar transação",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const transacoesFiltradas = transacoes.filter((transacao) => {
    const matchTipo = filtroTipo === "todos" || transacao.tipo === filtroTipo;
    const matchCategoria = filtroCategoria === "todos" || transacao.categoria === filtroCategoria;
    return matchTipo && matchCategoria;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (userRole !== "admin" && userRole !== "tesoureiro")) {
    navigate("/dashboard");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controle de receitas e despesas da escola</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatarMoeda(saldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total em caixa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatarMoeda(totalEntradas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas acumuladas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatarMoeda(totalSaidas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Despesas acumuladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Tipo de Transação</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {[...categoriasEntrada, ...categoriasSaida]
                      .filter((cat, index, arr) => arr.indexOf(cat) === index)
                      .map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoriaLabels[cat] || cat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
            <CardDescription>
              {transacoesFiltradas.length} transação(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transacoesFiltradas.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell>{formatarData(transacao.data_transacao)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transacao.tipo === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {categoriaLabels[transacao.categoria] || transacao.categoria}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transacao.descricao}
                        </TableCell>
                        <TableCell>
                          {transacao.alunos ? (
                            <div>
                              <div className="font-medium">
                                {transacao.alunos.profiles?.nome_completo || "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {transacao.alunos.numero_matricula}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transacao.profiles?.nome_completo || "N/A"}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${
                          transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(Number(transacao.valor))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog para Nova Transação */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
              <DialogDescription>
                Registre uma nova entrada ou saída financeira
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select 
                      value={formData.tipo} 
                      onValueChange={(value: "entrada" | "saida") => {
                        setFormData({ ...formData, tipo: value, categoria: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada (Receita)</SelectItem>
                        <SelectItem value="saida">Saída (Despesa)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo && <p className="text-sm text-destructive mt-1">{errors.tipo}</p>}
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.tipo === "entrada" ? categoriasEntrada : categoriasSaida).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoriaLabels[cat] || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoria && <p className="text-sm text-destructive mt-1">{errors.categoria}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valor">Valor (MZN) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor || ""}
                      onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                    />
                    {errors.valor && <p className="text-sm text-destructive mt-1">{errors.valor}</p>}
                  </div>
                  <div>
                    <Label htmlFor="data_transacao">Data *</Label>
                    <Input
                      id="data_transacao"
                      type="date"
                      value={formData.data_transacao}
                      onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
                    />
                    {errors.data_transacao && <p className="text-sm text-destructive mt-1">{errors.data_transacao}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o motivo da transação..."
                    rows={3}
                  />
                  {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao}</p>}
                </div>

                {formData.tipo === "entrada" && ["matricula", "mensalidade"].includes(formData.categoria) && (
                  <div>
                    <Label htmlFor="aluno_id">Aluno (opcional)</Label>
                    <Select 
                      value={formData.aluno_id} 
                      onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos.map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.numero_matricula} - {aluno.profiles?.nome_completo || "N/A"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="comprovante">Comprovante/Referência (opcional)</Label>
                  <Input
                    id="comprovante"
                    value={formData.comprovante}
                    onChange={(e) => setFormData({ ...formData, comprovante: e.target.value })}
                    placeholder="Ex: Recibo nº 123, Fatura nº 456..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Transação
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default GestaoFinanceira;
