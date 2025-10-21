import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Target, Heart, TrendingUp, BookOpen, Users, Award, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Noticia {
  id: string;
  titulo: string;
  conteudo: string;
  data_publicacao: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    const fetchNoticias = async () => {
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("publicado", true)
        .order("data_publicacao", { ascending: false })
        .limit(3);
      
      if (data) setNoticias(data);
    };

    fetchNoticias();
  }, []);

  const valores = [
    { icon: Target, title: "Excelência", description: "Compromisso com a qualidade no ensino e formação integral dos alunos" },
    { icon: Heart, title: "Inclusão", description: "Ambiente acolhedor e respeitoso para todos os estudantes" },
    { icon: TrendingUp, title: "Inovação", description: "Uso de métodos modernos e tecnologia na educação" },
    { icon: Users, title: "Comunidade", description: "Parceria entre escola, família e sociedade" }
  ];

  const stats = [
    { icon: BookOpen, value: "6", label: "Classes (7ª-12ª)" },
    { icon: Users, value: "500+", label: "Alunos Activos" },
    { icon: Award, value: "95%", label: "Taxa de Aprovação" },
    { icon: Calendar, value: "15+", label: "Anos de Experiência" }
  ];

  return (
    <div className="min-h-screen">
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
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="bg-white/10 backdrop-blur border-white/20 text-white">
                      <CardContent className="p-6 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-3xl font-bold mb-1">{stat.value}</div>
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
    </div>
  );
};

export default Home;