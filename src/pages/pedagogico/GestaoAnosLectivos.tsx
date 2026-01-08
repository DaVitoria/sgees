import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AnoLectivo {
  id: string;
  ano: string;
  data_inicio: string;
  data_fim: string;
  activo: boolean;
}

const GestaoAnosLectivos = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [anosLectivos, setAnosLectivos] = useState<AnoLectivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAno, setEditingAno] = useState<AnoLectivo | null>(null);
  
  const [formData, setFormData] = useState({
    ano: "",
    data_inicio: "",
    data_fim: "",
    activo: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnosLectivos();
    }
  }, [user]);

  const fetchAnosLectivos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("anos_lectivos")
      .select("*")
      .order("ano", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar anos lectivos");
    } else {
      setAnosLectivos(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ano || !formData.data_inicio || !formData.data_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Se este ano está sendo definido como activo, desactivar os outros
    if (formData.activo) {
      await supabase
        .from("anos_lectivos")
        .update({ activo: false })
        .neq("id", editingAno?.id || "");
    }

    if (editingAno) {
      const { error } = await supabase
        .from("anos_lectivos")
        .update({
          ano: formData.ano,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          activo: formData.activo,
        })
        .eq("id", editingAno.id);

      if (error) {
        toast.error("Erro ao actualizar ano lectivo");
      } else {
        toast.success("Ano lectivo actualizado com sucesso!");
        setDialogOpen(false);
        resetForm();
        fetchAnosLectivos();
      }
    } else {
      const { error } = await supabase.from("anos_lectivos").insert({
        ano: formData.ano,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
        activo: formData.activo,
      });

      if (error) {
        toast.error("Erro ao criar ano lectivo");
      } else {
        toast.success("Ano lectivo criado com sucesso!");
        setDialogOpen(false);
        resetForm();
        fetchAnosLectivos();
      }
    }
  };

  const handleEdit = (ano: AnoLectivo) => {
    setEditingAno(ano);
    setFormData({
      ano: ano.ano,
      data_inicio: ano.data_inicio,
      data_fim: ano.data_fim,
      activo: ano.activo || false,
    });
    setDialogOpen(true);
  };

  const handleSetActive = async (anoId: string) => {
    // Desactivar todos os anos
    await supabase.from("anos_lectivos").update({ activo: false }).neq("id", "");
    
    // Activar o seleccionado
    const { error } = await supabase
      .from("anos_lectivos")
      .update({ activo: true })
      .eq("id", anoId);

    if (error) {
      toast.error("Erro ao definir ano lectivo activo");
    } else {
      toast.success("Ano lectivo definido como activo!");
      fetchAnosLectivos();
    }
  };

  const resetForm = () => {
    setEditingAno(null);
    setFormData({
      ano: "",
      data_inicio: "",
      data_fim: "",
      activo: false,
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getStatus = (ano: AnoLectivo) => {
    const hoje = new Date();
    const inicio = new Date(ano.data_inicio);
    const fim = new Date(ano.data_fim);

    if (ano.activo) {
      return { label: "Activo", variant: "default" as const };
    } else if (hoje < inicio) {
      return { label: "Agendado", variant: "secondary" as const };
    } else if (hoje > fim) {
      return { label: "Encerrado", variant: "outline" as const };
    } else {
      return { label: "Em Curso", variant: "secondary" as const };
    }
  };

  const canManage = userRole === "admin" || userRole === "secretario";

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Não tem permissões para aceder a esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Anos Lectivos</h2>
            <p className="text-muted-foreground">
              Criar e gerir anos lectivos do sistema
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Ano Lectivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAno ? "Editar Ano Lectivo" : "Novo Ano Lectivo"}
                </DialogTitle>
                <DialogDescription>
                  {editingAno
                    ? "Actualizar os dados do ano lectivo"
                    : "Preencha os dados para criar um novo ano lectivo"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano *</Label>
                  <Input
                    id="ano"
                    placeholder="Ex: 2025"
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({ ...formData, ano: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, data_inicio: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data Fim *</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) =>
                        setFormData({ ...formData, data_fim: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, activo: checked })
                    }
                  />
                  <Label htmlFor="activo">Definir como ano lectivo activo</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAno ? "Actualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Anos Lectivos
            </CardTitle>
            <CardDescription>
              Lista de todos os anos lectivos registados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {anosLectivos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ano lectivo registado. Clique em "Novo Ano Lectivo" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anosLectivos.map((ano) => {
                    const status = getStatus(ano);
                    return (
                      <TableRow key={ano.id}>
                        <TableCell className="font-medium">{ano.ano}</TableCell>
                        <TableCell>
                          {format(new Date(ano.data_inicio), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ano.data_fim), "dd/MM/yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {ano.activo && <CheckCircle className="mr-1 h-3 w-3" />}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(ano)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!ano.activo && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSetActive(ano.id)}
                              >
                                Definir Activo
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GestaoAnosLectivos;
