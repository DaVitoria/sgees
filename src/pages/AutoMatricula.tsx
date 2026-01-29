import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const matriculaSchema = z.object({
  nome_completo: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  bi: z.string().trim().min(5, "BI deve ter pelo menos 5 caracteres").max(20, "BI deve ter no máximo 20 caracteres"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  telefone: z.string().trim().min(9, "Telefone deve ter pelo menos 9 dígitos").max(15, "Telefone deve ter no máximo 15 dígitos"),
  endereco: z.string().trim().min(5, "Endereço deve ter pelo menos 5 caracteres").max(200, "Endereço deve ter no máximo 200 caracteres"),
  encarregado_nome: z.string().trim().min(3, "Nome do encarregado deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  encarregado_telefone: z.string().trim().min(9, "Telefone deve ter pelo menos 9 dígitos").max(15, "Telefone deve ter no máximo 15 dígitos"),
  encarregado_parentesco: z.string().trim().min(2, "Parentesco deve ter pelo menos 2 caracteres").max(50, "Parentesco deve ter no máximo 50 caracteres"),
  classe: z.string().min(1, "Classe é obrigatória"),
  ano_lectivo_id: z.string().min(1, "Ano lectivo é obrigatório"),
  observacoes: z.string().trim().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
});

const AutoMatricula = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingEnrollment, setHasExistingEnrollment] = useState(false);
  const [anosLectivos, setAnosLectivos] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    nome_completo: "",
    bi: "",
    data_nascimento: "",
    telefone: "",
    endereco: "",
    sexo: "",
    encarregado_nome: "",
    encarregado_telefone: "",
    encarregado_parentesco: "",
    classe: "",
    ano_lectivo_id: "",
    observacoes: "",
  });

  useEffect(() => {
    // Redirect if user is not logged in
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // Allow access ONLY for users with 'aluno' role
    // Users without role or with other roles are redirected
    if (!authLoading && user && userRole !== 'aluno') {
      toast({
        title: "Acesso Negado",
        description: "Esta página é apenas para alunos.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (user) {
      checkExistingEnrollment();
      fetchAnosLectivos();
      loadUserProfile();
    }
  }, [user, userRole, authLoading]);

  const loadUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome_completo, bi, data_nascimento, telefone, endereco, sexo")
        .eq("id", user?.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          nome_completo: profile.nome_completo || "",
          bi: profile.bi || "",
          data_nascimento: profile.data_nascimento || "",
          telefone: profile.telefone || "",
          endereco: profile.endereco || "",
          sexo: profile.sexo || "",
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const checkExistingEnrollment = async () => {
    try {
      // Verificar se já existe um registo de aluno para este utilizador
      const { data: alunoData } = await supabase
        .from("alunos")
        .select("id, estado")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (alunoData) {
        // Já existe um registo de aluno - redirecionar independentemente do estado
        setHasExistingEnrollment(true);
        toast({
          title: "Matrícula já existe",
          description: alunoData.estado === 'activo' 
            ? "Você já possui uma matrícula activa registrada."
            : "Você já possui uma matrícula em processamento. Aguarde a aprovação.",
        });
        navigate("/aluno");
        return;
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnosLectivos = async () => {
    try {
      const { data } = await supabase
        .from("anos_lectivos")
        .select("*")
        .eq("activo", true)
        .order("ano", { ascending: false });

      setAnosLectivos(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, ano_lectivo_id: data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching anos lectivos:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationErrors({});

    try {
      // Validate with zod
      const validatedData = matriculaSchema.parse(formData);

      // Verificar novamente se já existe um aluno para prevenir race conditions
      const { data: existingAluno } = await supabase
        .from("alunos")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (existingAluno) {
        toast({
          title: "Matrícula já existe",
          description: "Você já possui uma matrícula registrada. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => navigate("/aluno"), 1500);
        return;
      }

      // Get current user email to check for duplicates in profiles
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user?.id)
        .single();

      // If email is different from current, check for duplicates
      if (currentProfile?.email) {
        const { data: duplicateEmail } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", currentProfile.email)
          .neq("id", user?.id)
          .maybeSingle();

        if (duplicateEmail) {
          toast({
            title: "E-mail já em uso",
            description: "Este e-mail já está registrado no sistema.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome_completo: validatedData.nome_completo,
          bi: validatedData.bi,
          data_nascimento: validatedData.data_nascimento,
          telefone: validatedData.telefone,
          endereco: validatedData.endereco,
          sexo: formData.sexo || null,
        })
        .eq("id", user?.id);

      if (profileError) {
        // Handle unique constraint violation for email
        if (profileError.code === '23505' && profileError.message.includes('email')) {
          toast({
            title: "E-mail já em uso",
            description: "Este e-mail já está registrado no sistema.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        throw profileError;
      }

      // Generate matricula number
      const { data: numeroData, error: numeroError } = await supabase
        .rpc("gerar_numero_matricula");

      if (numeroError) throw numeroError;

      const numero_matricula = numeroData || "M0001";

      // Create aluno record
      const { data: alunoData, error: alunoError } = await supabase
        .from("alunos")
        .insert({
          user_id: user?.id,
          numero_matricula,
          encarregado_nome: formData.encarregado_nome,
          encarregado_telefone: formData.encarregado_telefone,
          encarregado_parentesco: formData.encarregado_parentesco,
          estado: "activo",
          data_matricula: format(new Date(), "yyyy-MM-dd"),
        })
        .select()
        .single();

      if (alunoError) {
        // Tratar erro de chave duplicada especificamente
        if (alunoError.code === '23505' || alunoError.message.includes('duplicate')) {
          toast({
            title: "Matrícula já existe",
            description: "Você já possui uma matrícula registrada.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/aluno"), 1500);
          return;
        }
        throw alunoError;
      }

      // Create matricula record with pending status
      const { error: matriculaError } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: alunoData.id,
          ano_lectivo_id: formData.ano_lectivo_id,
          data_matricula: format(new Date(), "yyyy-MM-dd"),
          status: "pendente",
          estado: "activo",
          observacoes: `Classe desejada: ${formData.classe}ª. ${formData.observacoes || ""}`,
        });

      if (matriculaError) throw matriculaError;

      // Assign aluno role (ignorar se já existir)
      await supabase
        .from("user_roles")
        .insert({
          user_id: user?.id,
          role: "aluno",
        });

      toast({
        title: "Matrícula submetida com sucesso!",
        description: "Aguarde a aprovação da secretaria. Você receberá uma notificação quando sua matrícula for processada.",
      });

      setTimeout(() => {
        window.location.href = "/aluno";
      }, 2000);

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(newErrors);
        toast({
          title: "Erro de validação",
          description: "Por favor, verifique os campos do formulário.",
          variant: "destructive",
        });
      } else {
        console.error("Error submitting enrollment:", error);
        toast({
          title: "Erro ao submeter matrícula",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (hasExistingEnrollment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Formulário de Matrícula</CardTitle>
          <CardDescription>
            Preencha os seus dados para solicitar a matrícula. A secretaria irá aprovar e atribuir você a uma turma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => {
                        setFormData({ ...formData, nome_completo: e.target.value });
                        setValidationErrors({ ...validationErrors, nome_completo: '' });
                      }}
                      required
                      className={validationErrors.nome_completo ? 'border-red-500' : ''}
                    />
                  )}
                  {validationErrors.nome_completo && (
                    <p className="text-sm text-red-500">{validationErrors.nome_completo}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bi">Bilhete de Identidade *</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="bi"
                      value={formData.bi}
                      onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                      required
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      required
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="+258 84 123 4567"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo *</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={formData.sexo}
                      onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H">Masculino</SelectItem>
                        <SelectItem value="M">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  {loadingProfile ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  )}
                </div>
              </div>
            </div>
            {/* Dados do Encarregado */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Encarregado de Educação</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="encarregado_nome">Nome do Encarregado *</Label>
                  <Input
                    id="encarregado_nome"
                    value={formData.encarregado_nome}
                    onChange={(e) => setFormData({ ...formData, encarregado_nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="encarregado_telefone">Telefone do Encarregado *</Label>
                  <Input
                    id="encarregado_telefone"
                    value={formData.encarregado_telefone}
                    onChange={(e) => setFormData({ ...formData, encarregado_telefone: e.target.value })}
                    required
                    placeholder="+258 84 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="encarregado_parentesco">Parentesco</Label>
                  <Select
                    value={formData.encarregado_parentesco}
                    onValueChange={(value) => setFormData({ ...formData, encarregado_parentesco: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pai">Pai</SelectItem>
                      <SelectItem value="mae">Mãe</SelectItem>
                      <SelectItem value="irmao">Irmão/Irmã</SelectItem>
                      <SelectItem value="tio">Tio/Tia</SelectItem>
                      <SelectItem value="avo">Avô/Avó</SelectItem>
                      <SelectItem value="tutor">Tutor Legal</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dados Acadêmicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados Acadêmicos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="classe">Classe Pretendida *</Label>
                  <Select
                    value={formData.classe}
                    onValueChange={(value) => setFormData({ ...formData, classe: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((classe) => (
                        <SelectItem key={classe} value={classe.toString()}>
                          {classe}ª Classe
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano_lectivo_id">Ano Lectivo *</Label>
                  <Select
                    value={formData.ano_lectivo_id}
                    onValueChange={(value) => setFormData({ ...formData, ano_lectivo_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {anosLectivos.map((ano) => (
                        <SelectItem key={ano.id} value={ano.id}>
                          {ano.ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais (opcional)"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Após submeter, sua matrícula ficará pendente até que a secretaria aprove e atribua você a uma turma. Você receberá uma notificação quando o processo estiver completo.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A submeter matrícula...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submeter Matrícula
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoMatricula;
