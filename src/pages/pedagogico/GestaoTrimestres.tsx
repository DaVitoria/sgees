import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Calendar, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Trimestre {
  id: string;
  ano_lectivo_id: string;
  numero: number;
  data_inicio: string;
  data_fim: string;
  bloqueado: boolean;
  anos_lectivos?: {
    ano: string;
  };
}

interface AnoLectivo {
  id: string;
  ano: string;
  activo: boolean;
}

const GestaoTrimestres = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [selectedAnoLectivo, setSelectedAnoLectivo] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrimestre, setEditingTrimestre] = useState<Trimestre | null>(null);
  const [formData, setFormData] = useState({
    ano_lectivo_id: "",
    numero: 1,
    data_inicio: "",
    data_fim: "",
    bloqueado: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "secretario")) {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    try {
      const { data: anosData } = await supabase
        .from("anos_lectivos")
        .select("*")
        .order("ano", { ascending: false });

      setAnosLectivos(anosData || []);

      const anoActivo = anosData?.find((a) => a.activo);
      if (anoActivo) {
        setSelectedAnoLectivo(anoActivo.id);
        setFormData((prev) => ({ ...prev, ano_lectivo_id: anoActivo.id }));
      }

      const { data: trimestresData } = await supabase
        .from("trimestres")
        .select(`
          *,
          anos_lectivos(ano)
        `)
        .order("numero", { ascending: true });

      setTrimestres(trimestresData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrimestres = selectedAnoLectivo
    ? trimestres.filter((t) => t.ano_lectivo_id === selectedAnoLectivo)
    : trimestres;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTrimestre) {
        const { error } = await supabase
          .from("trimestres")
          .update({
            data_inicio: formData.data_inicio,
            data_fim: formData.data_fim,
            bloqueado: formData.bloqueado,
          })
          .eq("id", editingTrimestre.id);

        if (error) throw error;

        toast({
          title: "Trimestre atualizado",
          description: "As datas do trimestre foram atualizadas com sucesso.",
        });
      } else {
        const { error } = await supabase.from("trimestres").insert({
          ano_lectivo_id: formData.ano_lectivo_id,
          numero: formData.numero,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          bloqueado: formData.bloqueado,
        });

        if (error) throw error;

        toast({
          title: "Trimestre criado",
          description: "O trimestre foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao guardar o trimestre.",
        variant: "destructive",
      });
    }
  };

  const handleToggleBloqueado = async (trimestre: Trimestre) => {
    try {
      const { error } = await supabase
        .from("trimestres")
        .update({ bloqueado: !trimestre.bloqueado })
        .eq("id", trimestre.id);

      if (error) throw error;

      toast({
        title: trimestre.bloqueado ? "Trimestre desbloqueado" : "Trimestre bloqueado",
        description: trimestre.bloqueado
          ? "O lançamento de notas foi reaberto para este trimestre."
          : "O lançamento de notas foi encerrado para este trimestre.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (trimestre: Trimestre) => {
    setEditingTrimestre(trimestre);
    setFormData({
      ano_lectivo_id: trimestre.ano_lectivo_id,
      numero: trimestre.numero,
      data_inicio: trimestre.data_inicio,
      data_fim: trimestre.data_fim,
      bloqueado: trimestre.bloqueado,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTrimestre(null);
    setFormData({
      ano_lectivo_id: selectedAnoLectivo,
      numero: 1,
      data_inicio: "",
      data_fim: "",
      bloqueado: false,
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getTrimestreStatus = (trimestre: Trimestre) => {
    const hoje = new Date();
    const inicio = new Date(trimestre.data_inicio);
    const fim = new Date(trimestre.data_fim);

    if (trimestre.bloqueado) {
      return { label: "Bloqueado", variant: "destructive" as const };
    }
    if (hoje < inicio) {
      return { label: "Agendado", variant: "secondary" as const };
    }
    if (hoje >= inicio && hoje <= fim) {
      return { label: "Em Curso", variant: "default" as const };
    }
    return { label: "Encerrado", variant: "outline" as const };
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (userRole !== "admin" && userRole !== "secretario") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Não tem permissão para aceder a esta página.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Trimestres</h2>
            <p className="text-muted-foreground">
              Configurar datas e bloquear/desbloquear trimestres
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Trimestre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTrimestre ? "Editar Trimestre" : "Novo Trimestre"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingTrimestre && (
                  <>
                    <div className="space-y-2">
                      <Label>Ano Lectivo</Label>
                      <Select
                        value={formData.ano_lectivo_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, ano_lectivo_id: value })
                        }
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
                    <div className="space-y-2">
                      <Label>Número do Trimestre</Label>
                      <Select
                        value={formData.numero.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, numero: parseInt(value) })
                        }
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
                  </>
                )}
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, data_inicio: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) =>
                      setFormData({ ...formData, data_fim: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bloqueado"
                    checked={formData.bloqueado}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, bloqueado: checked })
                    }
                  />
                  <Label htmlFor="bloqueado">Bloquear lançamento de notas</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingTrimestre ? "Atualizar" : "Criar Trimestre"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Trimestres
              </CardTitle>
              <Select value={selectedAnoLectivo} onValueChange={setSelectedAnoLectivo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por ano" />
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
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Ano Lectivo</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrimestres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum trimestre configurado para este ano lectivo.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrimestres.map((trimestre) => {
                    const status = getTrimestreStatus(trimestre);
                    return (
                      <TableRow key={trimestre.id}>
                        <TableCell className="font-medium">
                          {trimestre.numero}º Trimestre
                        </TableCell>
                        <TableCell>{trimestre.anos_lectivos?.ano}</TableCell>
                        <TableCell>
                          {new Date(trimestre.data_inicio).toLocaleDateString("pt-MZ")}
                        </TableCell>
                        <TableCell>
                          {new Date(trimestre.data_fim).toLocaleDateString("pt-MZ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trimestre)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={trimestre.bloqueado ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleToggleBloqueado(trimestre)}
                            >
                              {trimestre.bloqueado ? (
                                <Unlock className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GestaoTrimestres;
