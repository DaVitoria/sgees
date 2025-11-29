import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Target, Heart, TrendingUp, BookOpen, Users, Award, Calendar, Wallet, Building2, UserCircle, ChevronRight, DollarSign, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Noticia {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

interface SchoolStats {
  total_alunos: number;
  total_professores: number;
  total_funcionarios: number;
  total_turmas: number;
  total_disciplinas: number;
}

interface FinancialSummary {
  total_entradas: number;
  total_saidas: number;
  saldo_actual: number;
  entradas_mes_actual: number;
  saidas_mes_actual: number;
}

interface Departamento {
  nome: string;
  descricao: string;
  total_membros: number;
}

interface DirecaoMembro {
  cargo: string;
  departamento: string;
}

interface TurmaClasse {
  classe: number;
  total_turmas: number;
}

interface OrgStructure {
  direcao: DirecaoMembro[];
  departamentos: Departamento[];
  turmas_por_classe: TurmaClasse[] | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  }).format(value);
};

const Home = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [orgStructure, setOrgStructure] = useState<OrgStructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch all data in parallel
      const [noticiasRes, statsRes, financialRes, orgRes] = await Promise.all([
        supabase
          .from("noticias")
          .select("*")
          .eq("publicado", true)
          .order("data_publicacao", { ascending: false })
          .limit(3),
        supabase.rpc("get_school_statistics"),
        supabase.rpc("get_financial_summary"),
        supabase.rpc("get_organizational_structure")
      ]);
      
      if (noticiasRes.data) setNoticias(noticiasRes.data);
      if (statsRes.data) setStats(statsRes.data as unknown as SchoolStats);
      if (financialRes.data) setFinancialSummary(financialRes.data as unknown as FinancialSummary);
      if (orgRes.data) setOrgStructure(orgRes.data as unknown as OrgStructure);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const valores = [
    { icon: Target, title: "Excelência", description: "Compromisso com a qualidade no ensino e formação integral dos alunos" },
    { icon: Heart, title: "Inclusão", description: "Ambiente acolhedor e respeitoso para todos os estudantes" },
    { icon: TrendingUp, title: "Inovação", description: "Uso de métodos modernos e tecnologia na educação" },
    { icon: Users, title: "Comunidade", description: "Parceria entre escola, família e sociedade" }
  ];

  const heroStats = [
    { icon: BookOpen, value: stats?.total_turmas?.toString() || "0", label: "Turmas Activas" },
    { icon: Users, value: stats?.total_alunos?.toString() || "0", label: "Alunos Activos" },
    { icon: Award, value: stats?.total_professores?.toString() || "0", label: "Professores" },
    { icon: Calendar, value: stats?.total_disciplinas?.toString() || "0", label: "Disciplinas" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-primary text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6">
              <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur">
                <GraduationCap className="h-16 w-16" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">Bem-vindo à Nossa Escola Secundária</h1>
              <p className="text-lg text-white/90">Construindo o futuro de Moçambique através da educação de excelência.</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>Aceder ao Sistema</Button>
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                {heroStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="bg-white/10 backdrop-blur border-white/20 text-white">
                      <CardContent className="p-6 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2" />
                        {loading ? (
                          <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20" />
                        ) : (
                          <div className="text-3xl font-bold mb-1">{stat.value}</div>
                        )}
                        <div className="text-sm text-white/80">{stat.label}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Members Summary Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Membros da Escola</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nossa comunidade escolar é composta por profissionais dedicados e alunos comprometidos com a excelência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-20 mx-auto mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">{stats?.total_alunos || 0}</div>
                )}
                <div className="text-lg font-semibold text-foreground">Alunos</div>
                <p className="text-sm text-muted-foreground mt-2">Estudantes activos matriculados</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full gradient-accent flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-20 mx-auto mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">{stats?.total_professores || 0}</div>
                )}
                <div className="text-lg font-semibold text-foreground">Professores</div>
                <p className="text-sm text-muted-foreground mt-2">Docentes qualificados</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 flex items-center justify-center mb-4">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-20 mx-auto mb-2" />
                ) : (
                  <div className="text-4xl font-bold text-primary mb-2">{stats?.total_funcionarios || 0}</div>
                )}
                <div className="text-lg font-semibold text-foreground">Funcionários</div>
                <p className="text-sm text-muted-foreground mt-2">Equipa administrativa e apoio</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Financial Summary Section */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Situação Financeira</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transparência na gestão dos recursos financeiros da nossa instituição.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Saldo Actual</span>
                  <Wallet className="h-5 w-5 text-green-500" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary?.saldo_actual || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Entradas</span>
                  <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialSummary?.total_entradas || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Saídas</span>
                  <ArrowDownCircle className="h-5 w-5 text-red-500" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialSummary?.total_saidas || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Entradas (Mês)</span>
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <div className="text-2xl font-bold text-amber-600">
                    {formatCurrency(financialSummary?.entradas_mes_actual || 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Organizational Structure Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Organograma da Escola</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Estrutura organizacional que garante o bom funcionamento da nossa instituição.
            </p>
          </div>

          {/* Direction */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Direcção</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {orgStructure?.direcao?.map((membro, index) => (
                <Card key={index} className="w-64 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full gradient-primary flex items-center justify-center mb-3">
                      <UserCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-semibold text-foreground">{membro.cargo}</div>
                    <div className="text-sm text-muted-foreground">{membro.departamento}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Departamentos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orgStructure?.departamentos?.map((dept, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="font-semibold text-foreground">{dept.nome}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{dept.descricao}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Membros:</span>
                      {loading ? (
                        <Skeleton className="h-5 w-8" />
                      ) : (
                        <span className="font-semibold text-primary">{dept.total_membros}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Classes Distribution */}
          {orgStructure?.turmas_por_classe && orgStructure.turmas_por_classe.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Distribuição de Turmas por Classe</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {orgStructure.turmas_por_classe.map((turma, index) => (
                  <Card key={index} className="w-32 shadow-md">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{turma.classe}ª</div>
                      <div className="text-sm text-muted-foreground">Classe</div>
                      <div className="mt-2 text-lg font-semibold">{turma.total_turmas}</div>
                      <div className="text-xs text-muted-foreground">turma(s)</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Nossa Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Proporcionar uma educação de qualidade, inclusiva e inovadora, formando cidadãos críticos e responsáveis.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Nossa Visão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Ser uma instituição de referência nacional na educação secundária reconhecida pela excelência.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nossos Valores</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Princípios que guiam todas as nossas acções e decisões.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor) => {
              const Icon = valor.icon;
              return (
                <Card key={valor.title} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">{valor.title}</h3>
                    <p className="text-sm text-muted-foreground">{valor.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* News Section */}
      {noticias.length > 0 && (
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Notícias Recentes</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Fique por dentro das últimas novidades da nossa escola.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {noticias.map((noticia) => (
                <Card key={noticia.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{noticia.titulo}</CardTitle>
                    <CardDescription>
                      {new Date(noticia.data_publicacao).toLocaleDateString('pt-MZ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-3">{noticia.conteudo}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
