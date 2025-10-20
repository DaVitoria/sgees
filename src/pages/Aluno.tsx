import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, Award, FileText } from "lucide-react";

const Aluno = () => {
  // Dados simulados do aluno
  const aluno = {
    nome: "João Manuel Silva",
    matricula: "2024001234",
    classe: "10ª Classe",
    turma: "A",
    estado: "Aprovado",
  };

  const disciplinas = [
    { nome: "Matemática", nota1: 14, nota2: 16, nota3: 15, media: 15 },
    { nome: "Português", nota1: 16, nota2: 15, nota3: 17, media: 16 },
    { nome: "Física", nota1: 13, nota2: 14, nota3: 15, media: 14 },
    { nome: "Química", nota1: 15, nota2: 16, nota3: 14, media: 15 },
    { nome: "Biologia", nota1: 17, nota2: 16, nota3: 18, media: 17 },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portal do Aluno</h2>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho e situação escolar
          </p>
        </div>

        {/* Informações do Aluno */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{aluno.nome}</CardTitle>
                  <CardDescription>
                    Matrícula: {aluno.matricula} | {aluno.classe} - Turma {aluno.turma}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default" className="bg-success">
                {aluno.estado}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Notas por Disciplina */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Notas e Aproveitamento
            </CardTitle>
            <CardDescription>
              Desempenho por disciplina e trimestre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disciplinas.map((disciplina) => (
                <div key={disciplina.nome} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{disciplina.nome}</p>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">1º Trim</p>
                      <p className="font-semibold">{disciplina.nota1}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">2º Trim</p>
                      <p className="font-semibold">{disciplina.nota2}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">3º Trim</p>
                      <p className="font-semibold">{disciplina.nota3}</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                      <p className="text-muted-foreground text-xs">Média</p>
                      <p className="font-bold text-primary">{disciplina.media}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentos e Certificados */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Certificados</CardTitle>
                  <CardDescription>Ver e baixar certificados</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Boletim de Notas</CardTitle>
                  <CardDescription>Baixar boletim completo</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Aluno;
