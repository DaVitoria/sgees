import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Administrativo from "./pages/Administrativo";
import Pedagogico from "./pages/Pedagogico";
import Aluno from "./pages/Aluno";
import Professor from "./pages/Professor";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import AutoMatricula from "./pages/AutoMatricula";
import GestaoDeTurmas from "./pages/pedagogico/GestaoDeTurmas";
import TurmaDetalhes from "./pages/pedagogico/TurmaDetalhes";
import AtribuicaoDisciplinas from "./pages/pedagogico/AtribuicaoDisciplinas";
import LancamentoNotas from "./pages/pedagogico/LancamentoNotas";
import RelatoriosPedagogicos from "./pages/pedagogico/RelatoriosPedagogicos";
import Aprovacoes from "./pages/pedagogico/Aprovacoes";
import GestaoExames from "./pages/pedagogico/GestaoExames";
import GestaoProfessores from "./pages/GestaoProfessores";
import GestaoAlunos from "./pages/GestaoAlunos";
import GestaoFinanceira from "./pages/GestaoFinanceira";
import Matriculas from "./pages/administrativo/Matriculas";
import Inventario from "./pages/administrativo/Inventario";
import Documentos from "./pages/administrativo/Documentos";
import RelatoriosAdmin from "./pages/administrativo/Relatorios";
import GestaoUtilizadores from "./pages/administrativo/GestaoUtilizadores";
import Organograma from "./pages/administrativo/Organograma";
import AcompanhamentoMatricula from "./pages/AcompanhamentoMatricula";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auto-matricula" element={<AutoMatricula />} />
            <Route path="/acompanhamento-matricula" element={<AcompanhamentoMatricula />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/administrativo" element={<Administrativo />} />
            <Route path="/pedagogico" element={<Pedagogico />} />
            <Route path="/pedagogico/gestao-turmas" element={<GestaoDeTurmas />} />
            <Route path="/pedagogico/gestao-turmas/:id" element={<TurmaDetalhes />} />
            <Route path="/pedagogico/atribuicao-disciplinas" element={<AtribuicaoDisciplinas />} />
            <Route path="/pedagogico/lancamento-notas" element={<LancamentoNotas />} />
            <Route path="/pedagogico/relatorios" element={<RelatoriosPedagogicos />} />
            <Route path="/pedagogico/aprovacoes" element={<Aprovacoes />} />
            <Route path="/pedagogico/gestao-exames" element={<GestaoExames />} />
            <Route path="/aluno" element={<Aluno />} />
            <Route path="/professor" element={<Professor />} />
            <Route path="/administrativo/gestao-professores" element={<GestaoProfessores />} />
            <Route path="/administrativo/gestao-alunos" element={<GestaoAlunos />} />
            <Route path="/administrativo/gestao-financeira" element={<GestaoFinanceira />} />
            <Route path="/administrativo/matriculas" element={<Matriculas />} />
            <Route path="/administrativo/inventario" element={<Inventario />} />
            <Route path="/administrativo/documentos" element={<Documentos />} />
            <Route path="/administrativo/relatorios" element={<RelatoriosAdmin />} />
            <Route path="/administrativo/gestao-utilizadores" element={<GestaoUtilizadores />} />
            <Route path="/administrativo/organograma" element={<Organograma />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
