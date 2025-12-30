import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Edit, Trash2, Download, FileCheck, FileBadge, FileSpreadsheet, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { generateBoletimPDF } from "@/utils/generateBoletimPDF";

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  url_ficheiro: string | null;
  aluno_id: string | null;
  user_id: string | null;
  gerado_por: string | null;
  data_geracao: string | null;
  created_at: string | null;
}

interface Aluno {
  id: string;
  numero_matricula: string;
  user_id: string;
  turma_id: string | null;
  profiles: {
    nome_completo: string;
  } | null;
  turmas: {
    nome: string;
    classe: number;
  } | null;
}

interface AnoLectivo {
  id: string;
  ano: string;
  activo: boolean;
}

const TIPOS_DOCUMENTO = [
  { value: "boletim", label: "Boletim de Notas", icon: FileSpreadsheet },
  { value: "declaracao_matricula", label: "Declaração de Matrícula", icon: FileCheck },
  { value: "declaracao_frequencia", label: "Declaração de Frequência", icon: FileText },
  { value: "certificado", label: "Certificado de Conclusão", icon: FileBadge },
  { value: "outro", label: "Outro Documento", icon: FileText }
];

const Documentos = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    tipo: "",
    titulo: "",
    descricao: "",
    aluno_id: "",
    url_ficheiro: ""
  });

  const [generateData, setGenerateData] = useState({
    tipo: "boletim",
    aluno_id: "",
    ano_lectivo_id: "",
    trimestre: "1"
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [docsRes, alunosRes, anosRes] = await Promise.all([
        supabase
          .from("documentos")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("alunos")
          .select(`
            id,
            numero_matricula,
            user_id,
            turma_id,
            profiles:user_id (nome_completo),
            turmas:turma_id (nome, classe)
          `)
          .eq("estado", "activo"),
        supabase
          .from("anos_lectivos")
          .select("*")
          .order("ano", { ascending: false })
      ]);

      if (docsRes.error) throw docsRes.error;
      if (alunosRes.error) throw alunosRes.error;
      if (anosRes.error) throw anosRes.error;

      setDocumentos(docsRes.data || []);
      setAlunos(alunosRes.data as Aluno[] || []);
      setAnosLectivos(anosRes.data || []);

      // Set default ano lectivo to active one
      const activeAno = anosRes.data?.find(a => a.activo);
      if (activeAno) {
        setGenerateData(prev => ({ ...prev, ano_lectivo_id: activeAno.id }));
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "",
      titulo: "",
      descricao: "",
      aluno_id: "",
      url_ficheiro: ""
    });
    setEditingDoc(null);
  };

  const handleOpenDialog = (doc?: Documento) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        tipo: doc.tipo,
        titulo: doc.titulo,
        descricao: doc.descricao || "",
        aluno_id: doc.aluno_id || "",
        url_ficheiro: doc.url_ficheiro || ""
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.tipo || !formData.titulo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo e título do documento",
        variant: "destructive"
      });
      return;
    }

    try {
      const docData = {
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        aluno_id: formData.aluno_id || null,
        url_ficheiro: formData.url_ficheiro || null,
        gerado_por: user?.id,
        data_geracao: new Date().toISOString().split("T")[0]
      };

      if (editingDoc) {
        const { error } = await supabase
          .from("documentos")
          .update(docData)
          .eq("id", editingDoc.id);

        if (error) throw error;

        toast({
          title: "Documento atualizado",
          description: "O documento foi atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from("documentos")
          .insert(docData);

        if (error) throw error;

        toast({
          title: "Documento criado",
          description: "O documento foi registado com sucesso"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso"
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGenerateDocument = async () => {
    if (!generateData.aluno_id) {
      toast({
        title: "Selecione um aluno",
        description: "É necessário selecionar um aluno para gerar o documento",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const aluno = alunos.find(a => a.id === generateData.aluno_id);
      if (!aluno) throw new Error("Aluno não encontrado");

      const anoLectivo = anosLectivos.find(a => a.id === generateData.ano_lectivo_id);

      if (generateData.tipo === "boletim") {
        // Fetch grades for the student
        const { data: notas, error: notasError } = await supabase
          .from("notas")
          .select(`
            *,
            disciplinas:disciplina_id (nome, codigo)
          `)
          .eq("aluno_id", generateData.aluno_id)
          .eq("ano_lectivo_id", generateData.ano_lectivo_id);

        if (notasError) throw notasError;

        // Transform notas to match expected format
        const notasFormatted = (notas || []).map(nota => ({
          disciplina: nota.disciplinas?.nome || "N/A",
          trimestre: nota.trimestre,
          nota_as1: nota.nota_as1,
          nota_as2: nota.nota_as2,
          nota_as3: nota.nota_as3,
          media_as: nota.media_as,
          nota_at: nota.nota_at,
          media_trimestral: nota.media_trimestral
        }));

        // Calculate annual average
        const mediasTrimestrais = notasFormatted
          .filter(n => n.media_trimestral !== null)
          .map(n => n.media_trimestral as number);
        const mediaAnual = mediasTrimestrais.length > 0
          ? mediasTrimestrais.reduce((a, b) => a + b, 0) / mediasTrimestrais.length
          : null;

        // Generate PDF
        const result = await generateBoletimPDF({
          aluno: {
            nome: aluno.profiles?.nome_completo || "Aluno",
            matricula: aluno.numero_matricula,
            turma: aluno.turmas?.nome || "N/A",
            classe: aluno.turmas?.classe || 0
          },
          anoLectivo: anoLectivo?.ano || "N/A",
          mediaAnual,
          notas: notasFormatted
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        // Register document in database
        await supabase.from("documentos").insert({
          tipo: "boletim",
          titulo: `Boletim de Notas - ${aluno.profiles?.nome_completo} - ${generateData.trimestre}º Trimestre`,
          descricao: `Boletim de notas do ${generateData.trimestre}º trimestre do ano lectivo ${anoLectivo?.ano}`,
          aluno_id: generateData.aluno_id,
          gerado_por: user?.id,
          data_geracao: new Date().toISOString().split("T")[0]
        });

        toast({
          title: "Boletim gerado",
          description: result.path 
            ? "O boletim foi guardado com sucesso" 
            : "O boletim foi gerado e baixado com sucesso"
        });
      } else if (generateData.tipo === "declaracao_matricula") {
        generateDeclaracaoMatricula(aluno, anoLectivo);
      } else if (generateData.tipo === "declaracao_frequencia") {
        generateDeclaracaoFrequencia(aluno, anoLectivo);
      } else if (generateData.tipo === "certificado") {
        generateCertificado(aluno, anoLectivo);
      }

      setIsGenerateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar documento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateDeclaracaoMatricula = async (aluno: Aluno, anoLectivo: AnoLectivo | undefined) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const hoje = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DECLARAÇÃO DE MATRÍCULA", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const texto = `Para os devidos efeitos, declara-se que ${aluno.profiles?.nome_completo || "o(a) aluno(a)"}, portador(a) do número de matrícula ${aluno.numero_matricula}, encontra-se devidamente matriculado(a) nesta instituição de ensino, frequentando a ${aluno.turmas?.classe || ""}ª classe, turma ${aluno.turmas?.nome || ""}, no ano lectivo de ${anoLectivo?.ano || ""}.

Por ser verdade, e a pedido do(a) interessado(a), passa-se a presente declaração que vai devidamente assinada e autenticada.`;

    const lines = doc.splitTextToSize(texto, 170);
    doc.text(lines, 20, 60);

    doc.text(`Maputo, ${hoje}`, 105, 140, { align: "center" });

    doc.text("_______________________________", 105, 180, { align: "center" });
    doc.text("O Director", 105, 190, { align: "center" });

    doc.save(`Declaracao_Matricula_${aluno.numero_matricula}.pdf`);

    await supabase.from("documentos").insert({
      tipo: "declaracao_matricula",
      titulo: `Declaração de Matrícula - ${aluno.profiles?.nome_completo}`,
      descricao: `Declaração de matrícula do ano lectivo ${anoLectivo?.ano}`,
      aluno_id: aluno.id,
      gerado_por: user?.id,
      data_geracao: new Date().toISOString().split("T")[0]
    });

    toast({
      title: "Declaração gerada",
      description: "A declaração de matrícula foi gerada e baixada"
    });
  };

  const generateDeclaracaoFrequencia = async (aluno: Aluno, anoLectivo: AnoLectivo | undefined) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const hoje = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DECLARAÇÃO DE FREQUÊNCIA", 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const texto = `Para os devidos efeitos, declara-se que ${aluno.profiles?.nome_completo || "o(a) aluno(a)"}, portador(a) do número de matrícula ${aluno.numero_matricula}, frequenta regularmente esta instituição de ensino, estando inscrito(a) na ${aluno.turmas?.classe || ""}ª classe, turma ${aluno.turmas?.nome || ""}, no ano lectivo de ${anoLectivo?.ano || ""}.

O(A) referido(a) aluno(a) apresenta frequência regular às aulas e demais actividades escolares.

Por ser verdade, e a pedido do(a) interessado(a), passa-se a presente declaração que vai devidamente assinada e autenticada.`;

    const lines = doc.splitTextToSize(texto, 170);
    doc.text(lines, 20, 60);

    doc.text(`Maputo, ${hoje}`, 105, 150, { align: "center" });

    doc.text("_______________________________", 105, 190, { align: "center" });
    doc.text("O Director", 105, 200, { align: "center" });

    doc.save(`Declaracao_Frequencia_${aluno.numero_matricula}.pdf`);

    await supabase.from("documentos").insert({
      tipo: "declaracao_frequencia",
      titulo: `Declaração de Frequência - ${aluno.profiles?.nome_completo}`,
      descricao: `Declaração de frequência do ano lectivo ${anoLectivo?.ano}`,
      aluno_id: aluno.id,
      gerado_por: user?.id,
      data_geracao: new Date().toISOString().split("T")[0]
    });

    toast({
      title: "Declaração gerada",
      description: "A declaração de frequência foi gerada e baixada"
    });
  };

  const generateCertificado = async (aluno: Aluno, anoLectivo: AnoLectivo | undefined) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("landscape");
    const hoje = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: pt });

    // Border
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(1);
    doc.rect(15, 15, 267, 180);

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text("CERTIFICADO DE CONCLUSÃO", 148.5, 50, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const texto = `Certificamos que ${aluno.profiles?.nome_completo || "o(a) aluno(a)"}, portador(a) do número de matrícula ${aluno.numero_matricula}, concluiu com aproveitamento a ${aluno.turmas?.classe || ""}ª classe nesta instituição de ensino, no ano lectivo de ${anoLectivo?.ano || ""}.`;

    const lines = doc.splitTextToSize(texto, 240);
    doc.text(lines, 148.5, 85, { align: "center" });

    doc.text(`Maputo, ${hoje}`, 148.5, 140, { align: "center" });

    doc.text("_______________________________", 148.5, 170, { align: "center" });
    doc.text("O Director", 148.5, 180, { align: "center" });

    doc.save(`Certificado_${aluno.numero_matricula}.pdf`);

    await supabase.from("documentos").insert({
      tipo: "certificado",
      titulo: `Certificado de Conclusão - ${aluno.profiles?.nome_completo}`,
      descricao: `Certificado de conclusão da ${aluno.turmas?.classe}ª classe - ano lectivo ${anoLectivo?.ano}`,
      aluno_id: aluno.id,
      gerado_por: user?.id,
      data_geracao: new Date().toISOString().split("T")[0]
    });

    toast({
      title: "Certificado gerado",
      description: "O certificado foi gerado e baixado"
    });
  };

  const filteredDocs = documentos.filter(doc => {
    const matchesSearch = doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === "todos" || doc.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const getTipoLabel = (tipo: string) => {
    const tipoInfo = TIPOS_DOCUMENTO.find(t => t.value === tipo);
    return tipoInfo?.label || tipo;
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "boletim": return "bg-blue-500";
      case "declaracao_matricula": return "bg-green-500";
      case "declaracao_frequencia": return "bg-purple-500";
      case "certificado": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getAlunoNome = (alunoId: string | null) => {
    if (!alunoId) return "-";
    const aluno = alunos.find(a => a.id === alunoId);
    return aluno?.profiles?.nome_completo || "-";
  };

  const totalDocs = documentos.length;
  const totalBoletins = documentos.filter(d => d.tipo === "boletim").length;
  const totalDeclaracoes = documentos.filter(d => d.tipo.startsWith("declaracao")).length;
  const totalCertificados = documentos.filter(d => d.tipo === "certificado").length;

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h2>
            <p className="text-muted-foreground">
              Emitir certificados, declarações e boletins
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Gerar Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Gerar Documento</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de documento e o aluno
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select
                      value={generateData.tipo}
                      onValueChange={(value) => setGenerateData({ ...generateData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.filter(t => t.value !== "outro").map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aluno</Label>
                    <Select
                      value={generateData.aluno_id}
                      onValueChange={(value) => setGenerateData({ ...generateData, aluno_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos.map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.profiles?.nome_completo} - {aluno.numero_matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano Lectivo</Label>
                    <Select
                      value={generateData.ano_lectivo_id}
                      onValueChange={(value) => setGenerateData({ ...generateData, ano_lectivo_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ano lectivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {anosLectivos.map((ano) => (
                          <SelectItem key={ano.id} value={ano.id}>
                            {ano.ano} {ano.activo && "(Activo)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {generateData.tipo === "boletim" && (
                    <div className="space-y-2">
                      <Label>Trimestre</Label>
                      <Select
                        value={generateData.trimestre}
                        onValueChange={(value) => setGenerateData({ ...generateData, trimestre: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Trimestre</SelectItem>
                          <SelectItem value="2">2º Trimestre</SelectItem>
                          <SelectItem value="3">3º Trimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerateDocument} disabled={generating}>
                    {generating ? "A gerar..." : "Gerar e Baixar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registar Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingDoc ? "Editar Documento" : "Registar Documento"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDoc ? "Atualize os dados do documento" : "Registar um documento existente no sistema"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_DOCUMENTO.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Título do documento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição do documento"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aluno (opcional)</Label>
                    <Select
                      value={formData.aluno_id}
                      onValueChange={(value) => setFormData({ ...formData, aluno_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {alunos.map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.profiles?.nome_completo} - {aluno.numero_matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Ficheiro (opcional)</Label>
                    <Input
                      value={formData.url_ficheiro}
                      onChange={(e) => setFormData({ ...formData, url_ficheiro: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingDoc ? "Atualizar" : "Registar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocs}</div>
              <p className="text-xs text-muted-foreground">Documentos registados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletins</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBoletins}</div>
              <p className="text-xs text-muted-foreground">Boletins de notas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declarações</CardTitle>
              <FileCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeclaracoes}</div>
              <p className="text-xs text-muted-foreground">Matrícula e frequência</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificados</CardTitle>
              <FileBadge className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCertificados}</div>
              <p className="text-xs text-muted-foreground">Certificados de conclusão</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Documentos</CardTitle>
            <CardDescription>
              {filteredDocs.length} documento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Data de Geração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        Nenhum documento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div>
                            {doc.titulo}
                            {doc.descricao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                {doc.descricao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getTipoBadgeColor(doc.tipo)} text-white`}>
                            {getTipoLabel(doc.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getAlunoNome(doc.aluno_id)}</TableCell>
                        <TableCell>
                          {doc.data_geracao
                            ? format(new Date(doc.data_geracao), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {doc.url_ficheiro && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.url_ficheiro!, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Documento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover "{doc.titulo}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(doc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Documentos;
