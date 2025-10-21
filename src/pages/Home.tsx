import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Target, Eye, Award, Users, BookOpen, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Noticia {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

const Home = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data } = await supabase
        .from('noticias')
        .select('*')
        .eq('publicado', true)
        .order('data_publicacao', { ascending: false })
        .limit(3);
      
      if (data) setNoticias(data);
    };

    fetchNoticias();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mb-6">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Escola Secundária de Excelência
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Formando líderes e cidadãos responsáveis para o futuro de Moçambique
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/login">Entrar no Sistema</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" asChild>
              <Link to="#sobre">Conheça-nos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nossos Valores</h2>
            <p className="text-muted-foreground">
              Princípios que guiam nossa missão educacional
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Excelência</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprometimento com a qualidade no ensino e aprendizagem, buscando sempre a melhoria contínua.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Respeito</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Valorização da diversidade, dignidade humana e convivência harmoniosa entre toda a comunidade escolar.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Inovação</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Adoção de metodologias modernas e tecnologia para preparar os alunos para os desafios do século XXI.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Missão e Visão */}
      <section id="sobre" className="py-16 px-4 gradient-subtle">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Nossa Missão</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Proporcionar educação de qualidade que desenvolva competências académicas, 
                  valores éticos e habilidades sociais, preparando jovens moçambicanos para 
                  serem cidadãos activos, críticos e responsáveis na construção de uma sociedade 
                  mais justa e próspera.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="shadow-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl">Nossa Visão</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Ser reconhecida como instituição de referência em educação secundária em 
                  Moçambique, formando líderes éticos e competentes que contribuam 
                  significativamente para o desenvolvimento sustentável do país e que sejam 
                  capazes de competir globalmente.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Notícias */}
      {noticias.length > 0 && (
        <section className="py-16 px-4 bg-background">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Notícias Recentes</h2>
              <p className="text-muted-foreground">
                Fique informado sobre as últimas novidades da escola
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {noticias.map((noticia) => (
                <Card key={noticia.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(noticia.data_publicacao).toLocaleDateString('pt-MZ')}
                    </div>
                    <CardTitle className="text-lg">{noticia.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {noticia.conteudo}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Organograma */}
      <section className="py-16 px-4 gradient-subtle">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Estrutura Organizacional</h2>
            <p className="text-muted-foreground">
              Conheça a equipa que lidera nossa instituição
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-primary">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-primary/5 rounded-lg">
                    <h3 className="font-bold text-lg">Direção Geral</h3>
                    <p className="text-sm text-muted-foreground">Director(a) da Escola</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <h4 className="font-semibold">Direção Pedagógica</h4>
                      <p className="text-xs text-muted-foreground mt-1">Coordenação de Ensino</p>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <h4 className="font-semibold">Secretaria</h4>
                      <p className="text-xs text-muted-foreground mt-1">Administração Escolar</p>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <h4 className="font-semibold">Tesouraria</h4>
                      <p className="text-xs text-muted-foreground mt-1">Gestão Financeira</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold">Corpo Docente</h4>
                      <p className="text-xs text-muted-foreground mt-1">Professores</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold">Alunos</h4>
                      <p className="text-xs text-muted-foreground mt-1">Classes 7ª a 12ª</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 px-4 gradient-primary text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg text-white/90 mb-8">
            Aceda ao sistema para gerir todas as actividades escolares
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">Aceder ao Sistema</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Sistema de Gestão Escolar - Moçambique</p>
          <p className="mt-2">Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
