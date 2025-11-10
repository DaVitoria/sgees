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
import NotFound from "./pages/NotFound";
import GestaoDeTurmas from "./pages/pedagogico/GestaoDeTurmas";
import AtribuicaoDisciplinas from "./pages/pedagogico/AtribuicaoDisciplinas";
import LancamentoNotas from "./pages/pedagogico/LancamentoNotas";
import RelatoriosPedagogicos from "./pages/pedagogico/RelatoriosPedagogicos";
import Aprovacoes from "./pages/pedagogico/Aprovacoes";
import GestaoProfessores from "./pages/GestaoProfessores";

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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/administrativo" element={<Administrativo />} />
            <Route path="/pedagogico" element={<Pedagogico />} />
            <Route path="/pedagogico/gestao-turmas" element={<GestaoDeTurmas />} />
            <Route path="/pedagogico/atribuicao-disciplinas" element={<AtribuicaoDisciplinas />} />
            <Route path="/pedagogico/lancamento-notas" element={<LancamentoNotas />} />
            <Route path="/pedagogico/relatorios" element={<RelatoriosPedagogicos />} />
            <Route path="/pedagogico/aprovacoes" element={<Aprovacoes />} />
            <Route path="/aluno" element={<Aluno />} />
            <Route path="/professor" element={<Professor />} />
            <Route path="/administrativo/gestao-professores" element={<GestaoProfessores />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
