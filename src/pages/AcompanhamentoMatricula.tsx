import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, XCircle, FileText, UserCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Matricula {
  id: string;
  data_matricula: string;
  status: string;
  estado: string;
  observacoes: string | null;
  turma_id: string | null;
  turmas: {
    nome: string;
    classe: number;
  } | null;
  anos_lectivos: {
    ano: string;
  };
}

export default function AcompanhamentoMatricula() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState<Matricula | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (userRole && userRole !== "aluno") {
      navigate("/dashboard");
      return;
    }

    fetchMatricula();
  }, [user, userRole, navigate]);

  const fetchMatricula = async () => {
    if (!user) return;

    try {
      // Buscar o aluno_id do usuário atual
      const { data: alunoData, error: alunoError } = await supabase
        .from("alunos")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (alunoError) throw alunoError;

      if (!alunoData) {
        // Aluno ainda não tem registo - mostra estado sem matrícula
        setMatricula(null);
        return;
      }

      // Buscar a matrícula mais recente
      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          id,
          data_matricula,
          status,
          estado,
          observacoes,
          turma_id,
          turmas!fk_matriculas_turma_id (
            nome,
            classe
          ),
          anos_lectivos!fk_matriculas_ano_lectivo_id (
            ano
          )
        `)
        .eq("aluno_id", alunoData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setMatricula(data);
    } catch (error) {
      console.error("Erro ao buscar matrícula:", error);
      toast.error("Erro ao carregar dados da matrícula");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "bg-green-500";
      case "pendente":
        return "bg-yellow-500";
      case "rejeitada":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-500";
      case "transferido":
        return "bg-blue-500";
      case "cancelado":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const timelineSteps = [
    {
      id: 1,
      title: "Formulário Submetido",
      description: "A sua candidatura foi recebida",
      icon: FileText,
      completed: !!matricula,
      current: !matricula,
      date: matricula?.data_matricula,
    },
    {
      id: 2,
      title: "Em Análise",
      description: "A secretaria está a analisar o seu pedido",
      icon: Clock,
      completed: matricula?.status === "aprovada" || matricula?.status === "rejeitada",
      current: matricula?.status === "pendente",
    },
    {
      id: 3,
      title: matricula?.status === "rejeitada" ? "Matrícula Rejeitada" : "Matrícula Aprovada",
      description: matricula?.status === "rejeitada" 
        ? "O seu pedido foi rejeitado" 
        : matricula?.status === "aprovada"
        ? "A sua matrícula foi aprovada"
        : "Aguardando aprovação",
      icon: matricula?.status === "rejeitada" ? XCircle : UserCheck,
      completed: matricula?.status === "aprovada",
      current: false,
      failed: matricula?.status === "rejeitada",
    },
    {
      id: 4,
      title: "Turma Atribuída",
      description: matricula?.turmas 
        ? `Atribuído à ${matricula.turmas.nome} (${matricula.turmas.classe}ª Classe)`
        : "Aguardando atribuição de turma",
      icon: GraduationCap,
      completed: !!matricula?.turma_id && matricula?.status === "aprovada",
      current: false,
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Acompanhamento de Matrícula</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso da sua candidatura de matrícula
          </p>
        </div>

        {!matricula ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma Matrícula Encontrada</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não submeteu um pedido de matrícula
              </p>
              <button
                onClick={() => navigate("/auto-matricula")}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Fazer Matrícula
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Estado atual do pedido</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(matricula.status)}>
                    {matricula.status === "aprovada" ? "Aprovada" :
                     matricula.status === "pendente" ? "Pendente" : "Rejeitada"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado</CardTitle>
                  <CardDescription>Situação da matrícula</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className={getEstadoColor(matricula.estado)}>
                    {matricula.estado === "activo" ? "Activo" :
                     matricula.estado === "transferido" ? "Transferido" : "Cancelado"}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ano Lectivo</CardTitle>
                  <CardDescription>Período académico</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{matricula.anos_lectivos.ano}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progresso da Matrícula</CardTitle>
                <CardDescription>
                  Acompanhe cada etapa do processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
                        {/* Timeline Line */}
                        {index < timelineSteps.length - 1 && (
                          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                        )}

                        {/* Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? "bg-green-500 text-white" 
                            : step.failed
                            ? "bg-red-500 text-white"
                            : step.current 
                            ? "bg-primary text-primary-foreground animate-pulse" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {step.completed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : step.failed ? (
                            <XCircle className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <h3 className={`font-semibold ${
                            step.completed || step.failed ? "text-foreground" : 
                            step.current ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(step.date).toLocaleDateString("pt-MZ")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {matricula.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{matricula.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
