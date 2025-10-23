import { Card } from "@/components/ui/card";
import { BookOpen, Users, ClipboardList, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ProfessorDashboard = () => {
  const navigate = useNavigate();

  const turmas = [
    { nome: "8ª Classe A", alunos: 32, disciplina: "Matemática" },
    { nome: "9ª Classe B", alunos: 28, disciplina: "Matemática" },
    { nome: "7ª Classe C", alunos: 30, disciplina: "Física" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard do Professor</h1>
        <p className="text-muted-foreground">
          Gerir as suas turmas e disciplinas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Turmas</p>
              <p className="text-2xl font-bold">{turmas.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
              <p className="text-2xl font-bold">{turmas.reduce((acc, t) => acc + t.alunos, 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded">
              <ClipboardList className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avaliações Pendentes</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Minhas Turmas</h3>
          <Button onClick={() => navigate("/pedagogico/lancamento-notas")} size="sm">
            Lançar Notas
          </Button>
        </div>
        <div className="space-y-3">
          {turmas.map((turma, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{turma.nome}</h4>
                  <p className="text-sm text-muted-foreground">{turma.disciplina}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{turma.alunos} alunos</p>
                  <Button variant="ghost" size="sm" className="mt-1">
                    Ver Turma
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Aulas
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Matemática - 8ª Classe A</p>
              <p className="text-sm text-muted-foreground">Hoje, 08:00 - 09:30</p>
            </div>
            <Button variant="outline" size="sm">Começar</Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <p className="font-medium">Física - 7ª Classe C</p>
              <p className="text-sm text-muted-foreground">Hoje, 10:00 - 11:30</p>
            </div>
            <Button variant="outline" size="sm">Começar</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
