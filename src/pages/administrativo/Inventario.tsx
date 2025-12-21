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
import { Package, Plus, Search, Edit, Trash2, Box, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface InventarioItem {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  quantidade: number;
  valor_unitario: number | null;
  estado: string | null;
  localizacao: string | null;
  responsavel_id: string | null;
  data_aquisicao: string | null;
  created_at: string | null;
}

interface Funcionario {
  id: string;
  user_id: string;
  profiles: {
    nome_completo: string;
  } | null;
}

const CATEGORIAS = [
  "Mobiliário",
  "Equipamento Informático",
  "Material Didático",
  "Material de Escritório",
  "Equipamento Desportivo",
  "Equipamento de Laboratório",
  "Veículos",
  "Outro"
];

const ESTADOS = [
  { value: "bom", label: "Bom", color: "bg-green-500" },
  { value: "regular", label: "Regular", color: "bg-yellow-500" },
  { value: "mau", label: "Mau", color: "bg-red-500" },
  { value: "em_reparacao", label: "Em Reparação", color: "bg-blue-500" },
  { value: "abatido", label: "Abatido", color: "bg-gray-500" }
];

const Inventario = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<InventarioItem[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    descricao: "",
    quantidade: 1,
    valor_unitario: "",
    estado: "bom",
    localizacao: "",
    responsavel_id: "",
    data_aquisicao: ""
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
      const [itemsRes, funcionariosRes] = await Promise.all([
        supabase
          .from("inventario")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("funcionarios")
          .select(`
            id,
            user_id,
            profiles:user_id (nome_completo)
          `)
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (funcionariosRes.error) throw funcionariosRes.error;

      setItems(itemsRes.data || []);
      setFuncionarios(funcionariosRes.data as Funcionario[] || []);
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
      nome: "",
      categoria: "",
      descricao: "",
      quantidade: 1,
      valor_unitario: "",
      estado: "bom",
      localizacao: "",
      responsavel_id: "",
      data_aquisicao: ""
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: InventarioItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        categoria: item.categoria,
        descricao: item.descricao || "",
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario?.toString() || "",
        estado: item.estado || "bom",
        localizacao: item.localizacao || "",
        responsavel_id: item.responsavel_id || "",
        data_aquisicao: item.data_aquisicao || ""
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.categoria) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e categoria do item",
        variant: "destructive"
      });
      return;
    }

    try {
      const itemData = {
        nome: formData.nome,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        quantidade: formData.quantidade,
        valor_unitario: formData.valor_unitario ? parseFloat(formData.valor_unitario) : null,
        estado: formData.estado,
        localizacao: formData.localizacao || null,
        responsavel_id: formData.responsavel_id || null,
        data_aquisicao: formData.data_aquisicao || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from("inventario")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Item atualizado",
          description: "O item foi atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from("inventario")
          .insert(itemData);

        if (error) throw error;

        toast({
          title: "Item adicionado",
          description: "O item foi adicionado ao inventário"
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
        .from("inventario")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "O item foi removido do inventário"
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.localizacao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "todas" || item.categoria === filterCategoria;
    const matchesEstado = filterEstado === "todos" || item.estado === filterEstado;
    return matchesSearch && matchesCategoria && matchesEstado;
  });

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValor = items.reduce((acc, item) => acc + (item.quantidade * (item.valor_unitario || 0)), 0);
  const itemsBomEstado = items.filter(item => item.estado === "bom").length;
  const itemsAtencao = items.filter(item => item.estado === "mau" || item.estado === "em_reparacao").length;

  const getEstadoBadge = (estado: string | null) => {
    const estadoInfo = ESTADOS.find(e => e.value === estado) || ESTADOS[0];
    return (
      <Badge className={`${estadoInfo.color} text-white`}>
        {estadoInfo.label}
      </Badge>
    );
  };

  const getResponsavelNome = (responsavelId: string | null) => {
    if (!responsavelId) return "-";
    const funcionario = funcionarios.find(f => f.id === responsavelId);
    return funcionario?.profiles?.nome_completo || "-";
  };

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
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Inventário</h2>
            <p className="text-muted-foreground">
              Gerir bens, materiais e equipamentos escolares
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar Item" : "Adicionar Novo Item"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? "Atualize os dados do item" : "Preencha os dados do novo item"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do item"
                    />
                  </div>
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
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição detalhada do item"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="0"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_unitario">Valor Unitário (MZN)</Label>
                    <Input
                      id="valor_unitario"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_unitario}
                      onChange={(e) => setFormData({ ...formData, valor_unitario: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((estado) => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização</Label>
                    <Input
                      id="localizacao"
                      value={formData.localizacao}
                      onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                      placeholder="Ex: Sala 101, Armazém A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                    <Input
                      id="data_aquisicao"
                      type="date"
                      value={formData.data_aquisicao}
                      onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select
                    value={formData.responsavel_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, responsavel_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.profiles?.nome_completo || "Funcionário"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                {items.length} tipos de itens
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalValor.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
              </div>
              <p className="text-xs text-muted-foreground">
                Patrimônio estimado
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bom Estado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{itemsBomEstado}</div>
              <p className="text-xs text-muted-foreground">
                Itens em condições ideais
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requer Atenção</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{itemsAtencao}</div>
              <p className="text-xs text-muted-foreground">
                Mau estado ou em reparação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, descrição ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  {ESTADOS.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Itens</CardTitle>
            <CardDescription>
              {filteredItems.length} item(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            {item.nome}
                            {item.descricao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.descricao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell className="text-center">{item.quantidade}</TableCell>
                        <TableCell>
                          {item.valor_unitario
                            ? Number(item.valor_unitario).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })
                            : "-"}
                        </TableCell>
                        <TableCell>{getEstadoBadge(item.estado)}</TableCell>
                        <TableCell>{item.localizacao || "-"}</TableCell>
                        <TableCell>{getResponsavelNome(item.responsavel_id)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {userRole === 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja remover "{item.nome}" do inventário?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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

export default Inventario;
