import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, DollarSign, GraduationCap, CheckCircle2, RefreshCw, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  referencia_id: string | null;
  referencia_tipo: string | null;
  data_vencimento: string | null;
  valor: number | null;
  resolvido: boolean;
  resolvido_em: string | null;
  created_at: string;
}

export const AlertasPanel = () => {
  const { toast } = useToast();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pendentes");

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from("alertas_sistema")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlertas(data || []);
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const gerarAlertas = async () => {
    setRefreshing(true);
    try {
      // Call the functions to generate alerts
      await supabase.rpc("gerar_alertas_pagamentos_atrasados");
      await supabase.rpc("gerar_alertas_notas_pendentes");
      
      toast({
        title: "Alertas actualizados",
        description: "Os alertas foram verificados e actualizados",
      });
      
      await fetchAlertas();
    } catch (error: any) {
      console.error("Error generating alerts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os alertas",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const marcarResolvido = async (alertaId: string) => {
    try {
      const { error } = await supabase
        .from("alertas_sistema")
        .update({
          resolvido: true,
          resolvido_em: new Date().toISOString(),
        })
        .eq("id", alertaId);

      if (error) throw error;

      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido",
      });

      setAlertas((prev) =>
        prev.map((a) =>
          a.id === alertaId
            ? { ...a, resolvido: true, resolvido_em: new Date().toISOString() }
            : a
        )
      );
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar o alerta como resolvido",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "pagamento_atrasado":
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case "nota_pendente":
        return <GraduationCap className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "pagamento_atrasado":
        return "destructive";
      case "nota_pendente":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "pagamento_atrasado":
        return "Pagamento Atrasado";
      case "nota_pendente":
        return "Nota Pendente";
      default:
        return tipo;
    }
  };

  const pendentes = alertas.filter((a) => !a.resolvido);
  const resolvidos = alertas.filter((a) => a.resolvido);

  const AlertaCard = ({ alerta }: { alerta: Alerta }) => (
    <div
      className={`p-4 rounded-lg border ${
        alerta.resolvido
          ? "bg-muted/50 border-muted"
          : alerta.tipo === "pagamento_atrasado"
          ? "bg-red-500/10 border-red-500/30"
          : "bg-orange-500/10 border-orange-500/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon(alerta.tipo)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm">{alerta.titulo}</h4>
            <Badge variant={getBadgeVariant(alerta.tipo) as any} className="text-xs">
              {getTipoLabel(alerta.tipo)}
            </Badge>
            {alerta.resolvido && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resolvido
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{alerta.mensagem}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(alerta.created_at), "dd/MM/yyyy HH:mm", {
                locale: pt,
              })}
            </span>
            {alerta.data_vencimento && (
              <span className="text-red-600">
                Vencimento: {format(new Date(alerta.data_vencimento), "dd/MM/yyyy")}
              </span>
            )}
          </div>
        </div>
        {!alerta.resolvido && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => marcarResolvido(alerta.id)}
            className="shrink-0"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Resolver
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas do Sistema
            </CardTitle>
            <CardDescription>
              Pagamentos atrasados e notas pendentes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={gerarAlertas}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="pendentes" className="relative">
              Pendentes
              {pendentes.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] text-xs">
                  {pendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolvidos">
              Resolvidos
              {resolvidos.length > 0 && (
                <Badge variant="outline" className="ml-2 h-5 min-w-[20px] text-xs">
                  {resolvidos.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {pendentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h4 className="font-medium">Sem alertas pendentes</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os alertas foram resolvidos
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendentes.map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolvidos" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {resolvidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h4 className="font-medium">Sem alertas resolvidos</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Os alertas resolvidos aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resolvidos.map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
            <DollarSign className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">
                {pendentes.filter((a) => a.tipo === "pagamento_atrasado").length}
              </p>
              <p className="text-xs text-muted-foreground">Pagamentos Atrasados</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10">
            <GraduationCap className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">
                {pendentes.filter((a) => a.tipo === "nota_pendente").length}
              </p>
              <p className="text-xs text-muted-foreground">Notas Pendentes</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
