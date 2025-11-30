import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Users, GraduationCap, UserCircle, Building2, ArrowUp, ArrowDown, Upload, Camera } from "lucide-react";
import Layout from "@/components/Layout";

interface OrganogramaItem {
  id: string;
  cargo: string;
  nome: string;
  ordem: number;
  foto_url: string | null;
}

const Organograma = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<OrganogramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganogramaItem | null>(null);
  const [formData, setFormData] = useState({ cargo: "", nome: "" });
  const [stats, setStats] = useState({ professores: 0, alunos: 0, funcionarios: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const [orgRes, statsRes] = await Promise.all([
      supabase.from("organograma").select("*").order("ordem", { ascending: true }),
      supabase.rpc("get_school_statistics")
    ]);

    if (orgRes.data) setItems(orgRes.data);
    if (statsRes.data) {
      const data = statsRes.data as { total_professores: number; total_alunos: number; total_funcionarios: number };
      setStats({
        professores: data.total_professores || 0,
        alunos: data.total_alunos || 0,
        funcionarios: data.total_funcionarios || 0
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (item?: OrganogramaItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ cargo: item.cargo, nome: item.nome });
    } else {
      setEditingItem(null);
      setFormData({ cargo: "", nome: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.cargo.trim() || !formData.nome.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editingItem) {
      const { error } = await supabase
        .from("organograma")
        .update({ cargo: formData.cargo, nome: formData.nome })
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Erro", description: "Não foi possível actualizar.", variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Cargo actualizado com sucesso." });
        fetchData();
      }
    } else {
      const maxOrdem = items.length > 0 ? Math.max(...items.map(i => i.ordem)) + 1 : 1;
      const { error } = await supabase
        .from("organograma")
        .insert({ cargo: formData.cargo, nome: formData.nome, ordem: maxOrdem });

      if (error) {
        toast({ title: "Erro", description: "Não foi possível adicionar.", variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Cargo adicionado com sucesso." });
        fetchData();
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este cargo?")) return;

    // Delete photo from storage if exists
    const item = items.find(i => i.id === id);
    if (item?.foto_url) {
      const fileName = item.foto_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from("organograma").remove([fileName]);
      }
    }

    const { error } = await supabase.from("organograma").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível remover.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Cargo removido com sucesso." });
      fetchData();
    }
  };

  const handleMoveUp = async (item: OrganogramaItem) => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (currentIndex <= 0) return;

    const prevItem = items[currentIndex - 1];
    
    await Promise.all([
      supabase.from("organograma").update({ ordem: item.ordem }).eq("id", prevItem.id),
      supabase.from("organograma").update({ ordem: prevItem.ordem }).eq("id", item.id)
    ]);

    fetchData();
  };

  const handleMoveDown = async (item: OrganogramaItem) => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (currentIndex >= items.length - 1) return;

    const nextItem = items[currentIndex + 1];
    
    await Promise.all([
      supabase.from("organograma").update({ ordem: item.ordem }).eq("id", nextItem.id),
      supabase.from("organograma").update({ ordem: nextItem.ordem }).eq("id", item.id)
    ]);

    fetchData();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedItemForPhoto) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Erro", description: "Formato de imagem não suportado. Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter menos de 5MB.", variant: "destructive" });
      return;
    }

    setUploadingPhoto(selectedItemForPhoto);

    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedItemForPhoto}.${fileExt}`;

    // Delete old photo if exists
    const item = items.find(i => i.id === selectedItemForPhoto);
    if (item?.foto_url) {
      const oldFileName = item.foto_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from("organograma").remove([oldFileName]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from("organograma")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro", description: "Não foi possível carregar a foto.", variant: "destructive" });
      setUploadingPhoto(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("organograma").getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("organograma")
      .update({ foto_url: publicUrl })
      .eq("id", selectedItemForPhoto);

    if (updateError) {
      toast({ title: "Erro", description: "Não foi possível actualizar a foto.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Foto actualizada com sucesso." });
      fetchData();
    }

    setUploadingPhoto(null);
    setSelectedItemForPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerPhotoUpload = (itemId: string) => {
    setSelectedItemForPhoto(itemId);
    fileInputRef.current?.click();
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoUpload}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão do Organograma</h1>
            <p className="text-muted-foreground">Configure a estrutura organizacional da escola</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Cargo" : "Adicionar Cargo"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Actualize as informações do cargo." : "Adicione um novo cargo à estrutura organizacional."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    placeholder="Ex: Director Adjunto Pedagógico"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nome">Nome do Responsável</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: João Silva"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingItem ? "Actualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização do Organograma</CardTitle>
            <CardDescription>Esta é a estrutura que será exibida na página inicial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-col items-center">
                  {index > 0 && (
                    <div className="w-px h-6 bg-border" />
                  )}
                  <Card className="w-64 shadow-md border-2 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage src={item.foto_url || undefined} alt={item.nome} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {getInitials(item.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-foreground">{item.cargo}</div>
                      <div className="text-sm text-primary">{item.nome}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {/* Stats Cards */}
              {items.length > 0 && (
                <>
                  <div className="w-px h-6 bg-border" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                    <Card className="shadow-md">
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full gradient-accent flex items-center justify-center mb-2">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-primary">{stats.professores}</div>
                        <div className="text-sm text-muted-foreground">Professores</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-md">
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-amber-500 flex items-center justify-center mb-2">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-primary">{stats.alunos}</div>
                        <div className="text-sm text-muted-foreground">Alunos</div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-md">
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 flex items-center justify-center mb-2">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-primary">{stats.funcionarios}</div>
                        <div className="text-sm text-muted-foreground">Funcionários</div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cargos Configurados</CardTitle>
            <CardDescription>Gerencie os cargos, responsáveis e fotos do organograma</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ordem</TableHead>
                  <TableHead className="w-20">Foto</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum cargo configurado. Adicione o primeiro cargo.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveUp(item)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveDown(item)}
                            disabled={index === items.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative group">
                          <Avatar className="h-10 w-10 cursor-pointer" onClick={() => triggerPhotoUpload(item.id)}>
                            <AvatarImage src={item.foto_url || undefined} alt={item.nome} />
                            <AvatarFallback className="bg-muted">
                              {uploadingPhoto === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                getInitials(item.nome)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => triggerPhotoUpload(item.id)}
                          >
                            <Camera className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.cargo}</TableCell>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => triggerPhotoUpload(item.id)} title="Carregar foto">
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Organograma;
