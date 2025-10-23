import { Card } from "@/components/ui/card";
import { GraduationCap, FileText, DollarSign, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AlunoDashboard = () => {
  const disciplinas = [
    { nome: "Matemática", nota1: 14, nota2: 16, nota3: 15, media: 15 },
    { nome: "Português", nota1: 16, nota2: 15, nota3: 17, media: 16 },
    { nome: "Física", nota1: 13, nota2: 14, nota3: 15, media: 14 },
    { nome: "Química", nota1: 15, nota2: 16, nota3: 14, media: 15 },
    { nome: "História", nota1: 17, nota2: 16, nota3: 18, media: 17 },
  ];

  const aluno = {
    nome: "João Silva",
    matricula: "2024001",
    classe: "9ª Classe A",
    mediaGeral: 15.4,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Meu Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {aluno.nome}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Matrícula</p>
              <p className="text-lg font-bold">{aluno.matricula}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média Geral</p>
              <p className="text-lg font-bold">{aluno.mediaGeral}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Situação Financeira</p>
              <p className="text-lg font-bold text-green-600">Em dia</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documentos</p>
              <p className="text-lg font-bold">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Situação Académica</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Disciplina</th>
                <th className="text-center py-3 px-4">1º Trim.</th>
                <th className="text-center py-3 px-4">2º Trim.</th>
                <th className="text-center py-3 px-4">3º Trim.</th>
                <th className="text-center py-3 px-4">Média</th>
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((disc, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{disc.nome}</td>
                  <td className="text-center py-3 px-4">{disc.nota1}</td>
                  <td className="text-center py-3 px-4">{disc.nota2}</td>
                  <td className="text-center py-3 px-4">{disc.nota3}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`font-bold ${disc.media >= 14 ? 'text-green-600' : 'text-red-600'}`}>
                      {disc.media}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Certificados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Aceda aos seus certificados e documentos académicos
          </p>
          <Button className="w-full">Ver Certificados</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Boletim de Notas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Baixe o seu boletim de notas actualizado
          </p>
          <Button className="w-full">Baixar Boletim</Button>
        </Card>
      </div>
    </div>
  );
};
