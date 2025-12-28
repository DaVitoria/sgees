import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, Clock, CheckCircle, XCircle, Loader2, Receipt, AlertCircle } from "lucide-react";
import { z } from "zod";

const pagamentoSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
  descricao: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").max(200),
  comprovante: z.string().optional(),
});

type PagamentoFormData = z.infer<typeof pagamentoSchema>;

interface Pagamento {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  descricao: string;
  data_transacao: string;
  comprovante: string | null;
  status_confirmacao: string;
  data_confirmacao: string | null;
  motivo_rejeicao: string | null;
  created_at: string | null;
}

const categoriasPagamento = [
  { value: "matricula", label: "Matrícula" },
  { value: "mensalidade", label: "Mensalidade" },
  { value: "contribuicao", label: "Contribuição" },
  { value: "servicos", label: "Serviços" },
  { value: "producao_escolar", label: "Produção Escolar" },
  { value: "outros", label: "Outros" },
];

interface PagamentosAlunoProps {
  alunoId: string;
}

export const PagamentosAluno = ({ alunoId }: PagamentosAlunoProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PagamentoFormData>({
    categoria: "",
    valor: 0,
    descricao: "",
    comprovante: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (alunoId) {
      fetchPagamentos();
      setupRealtimeSubscription();
    }
  }, [alunoId]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('pagamentos-aluno')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financas',
          filter: `aluno_id=eq.${alunoId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchPagamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchPagamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("financas")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPagamentos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar pagamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const validatedData = pagamentoSchema.parse({
        ...formData,
        valor: Number(formData.valor),
      });

      const { error } = await supabase
        .from("financas")
        .insert([{
          tipo: "entrada",
          categoria: validatedData.categoria as any,
          valor: validatedData.valor,
          descricao: validatedData.descricao,
          data_transacao: new Date().toISOString().split("T")[0],
          aluno_id: alunoId,
          comprovante: validatedData.comprovante || null,
          registado_por: user!.id,
          status_confirmacao: "pendente",
        }]);

      if (error) throw error;

      toast({
        title: "Pagamento submetido",
        description: "O seu pagamento foi submetido e aguarda confirmação.",
      });

      setIsDialogOpen(false);
      setFormData({
        categoria: "",
        valor: 0,
        descricao: "",
        comprovante: "",
      });
      fetchPagamentos();
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
          title: "Erro ao submeter pagamento",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "confirmado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "rejeitado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    return categoriasPagamento.find(c => c.value === categoria)?.label || categoria;
  };

  const totalConfirmado = pagamentos
    .filter(p => p.status_confirmacao === "confirmado")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const totalPendente = pagamentos
    .filter(p => p.status_confirmacao === "pendente")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de novo pagamento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Meus Pagamentos
          </h3>
          <p className="text-sm text-muted-foreground">
            Submeta pagamentos e acompanhe o status de confirmação
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submeter Pagamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do pagamento. Após a submissão, a secretaria ou tesoureiro irá confirmar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasPagamento.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && (
                  <p className="text-sm text-destructive">{errors.categoria}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (MZN) *</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor || ""}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                {errors.valor && (
                  <p className="text-sm text-destructive">{errors.valor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Pagamento da mensalidade de Janeiro"
                  rows={3}
                />
                {errors.descricao && (
                  <p className="text-sm text-destructive">{errors.descricao}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comprovante">Número do Comprovante (opcional)</Label>
                <Input
                  id="comprovante"
                  value={formData.comprovante}
                  onChange={(e) => setFormData({ ...formData, comprovante: e.target.value })}
                  placeholder="Ex: M-PESA 123456789"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submeter Pagamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Confirmado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(totalConfirmado)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente de Confirmação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatarMoeda(totalPendente)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            {pagamentos.length} pagamento(s) registado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pagamentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum pagamento registado ainda.</p>
              <p className="text-sm">Clique em "Novo Pagamento" para submeter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentos.map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatarData(pagamento.data_transacao)}
                      </TableCell>
                      <TableCell>
                        {getCategoriaLabel(pagamento.categoria)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{pagamento.descricao}</div>
                        {pagamento.comprovante && (
                          <div className="text-xs text-muted-foreground">
                            Comprovante: {pagamento.comprovante}
                          </div>
                        )}
                        {pagamento.status_confirmacao === "rejeitado" && pagamento.motivo_rejeicao && (
                          <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {pagamento.motivo_rejeicao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(pagamento.status_confirmacao)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatarMoeda(pagamento.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
