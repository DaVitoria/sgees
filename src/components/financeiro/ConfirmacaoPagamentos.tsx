import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle, User, CreditCard, Eye } from "lucide-react";

interface PagamentoPendente {
  id: string;
  tipo: string;
  categoria: string;
  valor: number;
  descricao: string;
  data_transacao: string;
  comprovante: string | null;
  status_confirmacao: string;
  created_at: string | null;
  aluno_id: string;
  alunos: {
    numero_matricula: string;
    profiles: {
      nome_completo: string;
    } | null;
  } | null;
}

const categoriaLabels: Record<string, string> = {
  matricula: "Matrícula",
  mensalidade: "Mensalidade",
  contribuicao: "Contribuição",
  servicos: "Serviços",
  producao_escolar: "Produção Escolar",
  outros: "Outros",
};

export const ConfirmacaoPagamentos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pagamentos, setPagamentos] = useState<PagamentoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPagamento, setSelectedPagamento] = useState<PagamentoPendente | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pendentes");

  useEffect(() => {
    fetchPagamentos();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('pagamentos-confirmacao')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financas',
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
        .select(`
          id,
          tipo,
          categoria,
          valor,
          descricao,
          data_transacao,
          comprovante,
          status_confirmacao,
          created_at,
          aluno_id,
          alunos!fk_financas_aluno_id (
            numero_matricula,
            profiles!fk_alunos_user (
              nome_completo
            )
          )
        `)
        .not("aluno_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPagamentos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar pagamentos:", error);
      toast({
        title: "Erro ao carregar pagamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (pagamento: PagamentoPendente) => {
    setProcessing(pagamento.id);
    try {
      const { error } = await supabase
        .from("financas")
        .update({
          status_confirmacao: "confirmado",
          confirmado_por: user!.id,
          data_confirmacao: new Date().toISOString(),
        })
        .eq("id", pagamento.id);

      if (error) throw error;

      // Create notification for student
      await supabase.from("notificacoes").insert({
        user_id: (await supabase.from("alunos").select("user_id").eq("id", pagamento.aluno_id).single()).data?.user_id,
        titulo: "Pagamento Confirmado",
        mensagem: `O seu pagamento de ${formatarMoeda(pagamento.valor)} (${categoriaLabels[pagamento.categoria] || pagamento.categoria}) foi confirmado.`,
        tipo: "sucesso",
        link: "/aluno",
      });

      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi confirmado com sucesso.",
      });

      fetchPagamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejeitar = async () => {
    if (!selectedPagamento) return;
    
    setProcessing(selectedPagamento.id);
    try {
      const { error } = await supabase
        .from("financas")
        .update({
          status_confirmacao: "rejeitado",
          confirmado_por: user!.id,
          data_confirmacao: new Date().toISOString(),
          motivo_rejeicao: motivoRejeicao,
        })
        .eq("id", selectedPagamento.id);

      if (error) throw error;

      // Create notification for student
      await supabase.from("notificacoes").insert({
        user_id: (await supabase.from("alunos").select("user_id").eq("id", selectedPagamento.aluno_id).single()).data?.user_id,
        titulo: "Pagamento Rejeitado",
        mensagem: `O seu pagamento de ${formatarMoeda(selectedPagamento.valor)} foi rejeitado. Motivo: ${motivoRejeicao}`,
        tipo: "erro",
        link: "/aluno",
      });

      toast({
        title: "Pagamento rejeitado",
        description: "O pagamento foi rejeitado e o aluno foi notificado.",
      });

      setShowRejectDialog(false);
      setSelectedPagamento(null);
      setMotivoRejeicao("");
      fetchPagamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
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
      hour: "2-digit",
      minute: "2-digit",
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

  const pagamentosPendentes = pagamentos.filter(p => p.status_confirmacao === "pendente");
  const pagamentosProcessados = pagamentos.filter(p => p.status_confirmacao !== "pendente");

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
      {/* Alert for pending payments */}
      {pagamentosPendentes.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">
                {pagamentosPendentes.length} pagamento(s) aguardando confirmação
              </p>
              <p className="text-sm text-yellow-700">
                Total pendente: {formatarMoeda(pagamentosPendentes.reduce((sum, p) => sum + Number(p.valor), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {pagamentosPendentes.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {pagamentosPendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processados" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Processados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamentos Pendentes
              </CardTitle>
              <CardDescription>
                Pagamentos submetidos por alunos aguardando confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagamentosPendentes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-green-500" />
                  <p>Nenhum pagamento pendente.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosPendentes.map((pagamento) => (
                        <TableRow key={pagamento.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {pagamento.alunos?.profiles?.nome_completo || "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {pagamento.alunos?.numero_matricula}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {categoriaLabels[pagamento.categoria] || pagamento.categoria}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">{pagamento.descricao}</div>
                            {pagamento.comprovante && (
                              <div className="text-xs text-muted-foreground">
                                Comprovante: {pagamento.comprovante}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatarData(pagamento.created_at || pagamento.data_transacao)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatarMoeda(pagamento.valor)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => handleConfirmar(pagamento)}
                                disabled={processing === pagamento.id}
                              >
                                {processing === pagamento.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedPagamento(pagamento);
                                  setShowRejectDialog(true);
                                }}
                                disabled={processing === pagamento.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processados">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pagamentos Processados
              </CardTitle>
              <CardDescription>
                Histórico de pagamentos confirmados ou rejeitados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagamentosProcessados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pagamento processado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosProcessados.map((pagamento) => (
                        <TableRow key={pagamento.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {pagamento.alunos?.profiles?.nome_completo || "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pagamento.alunos?.numero_matricula}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {categoriaLabels[pagamento.categoria] || pagamento.categoria}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {pagamento.descricao}
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
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Pagamento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O aluno será notificado.
            </DialogDescription>
          </DialogHeader>
          {selectedPagamento && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-sm">
                  <strong>Aluno:</strong> {selectedPagamento.alunos?.profiles?.nome_completo}
                </p>
                <p className="text-sm">
                  <strong>Valor:</strong> {formatarMoeda(selectedPagamento.valor)}
                </p>
                <p className="text-sm">
                  <strong>Categoria:</strong> {categoriaLabels[selectedPagamento.categoria]}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo da Rejeição *</Label>
                <Textarea
                  id="motivo"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Ex: Comprovante inválido, valor incorreto..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejeitar}
              disabled={!motivoRejeicao.trim() || processing !== null}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rejeitar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
