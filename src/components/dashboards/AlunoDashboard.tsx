import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, FileText, TrendingUp, Award, BookOpen, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { generateBoletimPDF } from "@/utils/generateBoletimPDF";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export const AlunoDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aluno, setAluno] = useState<any>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [trimestreData, setTrimestreData] = useState<any[]>([]);
  const [mediaAnual, setMediaAnual] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [anoLectivo, setAnoLectivo] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchAlunoData();
    }
  }, [user]);

  const fetchAlunoData = async () => {
    try {
      // Buscar dados do aluno
      const { data: alunoData } = await supabase
        .from("alunos")
        .select(`
          *,
          profiles(nome_completo),
          turmas(nome, classe)
        `)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!alunoData) {
        setLoading(false);
        return;
      }

      setAluno(alunoData);

      // Buscar ano lectivo ativo
      const { data: anoData } = await supabase
        .from("anos_lectivos")
        .select("ano")
        .eq("activo", true)
        .maybeSingle();
      
      if (anoData) {
        setAnoLectivo(anoData.ano);
      }

      // Buscar notas do aluno
      const { data: notasData } = await supabase
        .from("notas")
        .select(`
          *,
          disciplinas(nome, codigo),
          anos_lectivos(ano)
        `)
        .eq("aluno_id", alunoData.id)
        .order("trimestre");

      setNotas(notasData || []);

      // Agrupar notas por disciplina para radar chart
      const notasPorDisciplina = notasData?.reduce((acc: any, nota) => {
        const disciplina = nota.disciplinas?.nome || "Outra";
        if (!acc[disciplina]) {
          acc[disciplina] = { disciplina, notas: [] };
        }
        if (nota.media_trimestral) {
          acc[disciplina].notas.push(nota.media_trimestral);
        }
        return acc;
      }, {}) || {};

      const radarData = Object.values(notasPorDisciplina).map((d: any) => ({
        disciplina: d.disciplina,
        media: d.notas.length > 0 ? (d.notas.reduce((a: number, b: number) => a + b, 0) / d.notas.length).toFixed(1) : 0,
      }));
      setPerformanceData(radarData);

      // Dados por trimestre
      const trimestreStats = notasData?.reduce((acc: any, nota) => {
        if (!acc[nota.trimestre]) {
          acc[nota.trimestre] = { trimestre: `${nota.trimestre}º Trim`, total: 0, count: 0 };
        }
        if (nota.media_trimestral) {
          acc[nota.trimestre].total += Number(nota.media_trimestral);
          acc[nota.trimestre].count += 1;
        }
        return acc;
      }, {}) || {};

      const trimData = Object.values(trimestreStats).map((t: any) => ({
        trimestre: t.trimestre,
        media: t.count > 0 ? Number((t.total / t.count).toFixed(1)) : 0,
      }));
      setTrimestreData(trimData);

      // Calcular Média Anual (MA) - média das médias trimestrais
      if (trimData.length > 0) {
        const maTotal = trimData.reduce((acc, t) => acc + t.media, 0);
        setMediaAnual(Number((maTotal / trimData.length).toFixed(2)));
      }

    } catch (error) {
      console.error("Erro ao carregar dados do aluno:", error);
    } finally {
      setLoading(false);
    }
  };

  const calcularMediaGeral = () => {
    const medias = notas.map(n => n.media_trimestral).filter(m => m !== null);
    return medias.length > 0 ? (medias.reduce((acc, m) => acc + Number(m), 0) / medias.length).toFixed(1) : 0;
  };

  const getStatusAprovacao = (media: number) => {
    if (media >= 10) return { label: "Aprovado", color: "text-green-600" };
    if (media >= 7) return { label: "Em Exame", color: "text-yellow-600" };
    return { label: "Reprovado", color: "text-red-600" };
  };

  const handleDownloadBoletim = () => {
    if (!aluno || notas.length === 0) {
      toast({
        title: "Sem dados disponíveis",
        description: "Não há notas lançadas para gerar o boletim.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPDF(true);

    try {
      const boletimData = {
        aluno: {
          nome: aluno.profiles?.nome_completo || "N/A",
          matricula: aluno.numero_matricula,
          turma: aluno.turmas?.nome || "N/A",
          classe: aluno.turmas?.classe || 0,
          anoLectivo: anoLectivo || notas[0]?.anos_lectivos?.ano || "N/A",
        },
        notas: notas.map(nota => ({
          disciplina: nota.disciplinas?.nome || "N/A",
          trimestre: nota.trimestre,
          nota_as1: nota.nota_as1,
          nota_as2: nota.nota_as2,
          nota_as3: nota.nota_as3,
          media_as: nota.media_as,
          nota_at: nota.nota_at,
          media_trimestral: nota.media_trimestral,
        })),
        mediaAnual,
        anoLectivo: anoLectivo || notas[0]?.anos_lectivos?.ano || "N/A",
      };

      generateBoletimPDF(boletimData);

      toast({
        title: "Boletim gerado!",
        description: "O seu boletim de notas foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar boletim",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">A carregar dados...</p>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Nenhum registo de aluno encontrado para esta conta.</p>
      </div>
    );
  }

  const mediaGeral = Number(calcularMediaGeral());
  const status = getStatusAprovacao(mediaAnual || mediaGeral);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meu Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {aluno?.profiles?.nome_completo}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matrícula</p>
              <p className="text-lg font-bold">{aluno?.numero_matricula}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turma</p>
              <p className="text-lg font-bold">{aluno?.turmas?.nome || "N/A"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Anual (MA)</p>
              <p className="text-lg font-bold">{mediaAnual?.toFixed(2) || mediaGeral}/20</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Situação</p>
              <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Disciplina</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="disciplina" />
                <PolarRadiusAxis domain={[0, 20]} />
                <Radar name="Média" dataKey="media" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução por Trimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trimestreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trimestre" />
                <YAxis domain={[0, 20]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="media" name="Média Trimestral (MT)">
                  {trimestreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Notas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Disciplina</th>
                <th className="text-center py-3 px-4">AS1</th>
                <th className="text-center py-3 px-4">AS2</th>
                <th className="text-center py-3 px-4">AS3</th>
                <th className="text-center py-3 px-4">MAS</th>
                <th className="text-center py-3 px-4">AT</th>
                <th className="text-center py-3 px-4">MT</th>
                <th className="text-center py-3 px-4">Trim.</th>
              </tr>
            </thead>
            <tbody>
              {notas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-muted-foreground">
                    Nenhuma nota lançada ainda
                  </td>
                </tr>
              ) : (
                notas.map((nota, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{nota.disciplinas?.nome}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as1?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as2?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_as3?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4 font-medium">{nota.media_as?.toFixed(2) || "-"}</td>
                    <td className="text-center py-3 px-4">{nota.nota_at?.toFixed(1) || "-"}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold ${Number(nota.media_trimestral) >= 10 ? 'text-green-600' : Number(nota.media_trimestral) >= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {nota.media_trimestral?.toFixed(2) || "-"}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{nota.trimestre}º</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {mediaAnual && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Média Anual (MA):</strong> {mediaAnual.toFixed(2)}/20 - 
              <span className={`ml-2 font-bold ${status.color}`}>{status.label}</span>
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Boletim de Notas</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Baixe o seu boletim de notas actualizado em formato PDF
          </p>
          <Button 
            className="w-full" 
            onClick={handleDownloadBoletim}
            disabled={generatingPDF || notas.length === 0}
          >
            {generatingPDF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A gerar...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Boletim PDF
              </>
            )}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Certificados</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Aceda aos seus certificados académicos
          </p>
          <Button className="w-full" variant="outline">Ver Certificados</Button>
        </Card>
      </div>
    </div>
  );
};
