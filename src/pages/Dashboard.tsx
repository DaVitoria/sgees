import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ProfessorDashboard } from "@/components/dashboards/ProfessorDashboard";
import { AlunoDashboard } from "@/components/dashboards/AlunoDashboard";
import { FuncionarioDashboard } from "@/components/dashboards/FuncionarioDashboard";

const Dashboard = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!loading && !user) {
        navigate("/login");
      } else if (!loading && user && userRole === 'aluno') {
        // Verificar se aluno já tem matrícula
        const { data: alunoData } = await supabase
          .from("alunos")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (alunoData) {
          navigate("/aluno");
        } else {
          navigate("/auto-matricula");
        }
      } else if (!loading && user && userRole === 'professor') {
        // Redirecionar professores para seu portal específico
        navigate("/professor");
      }
      // Utilizadores sem role ficam no dashboard (sem acesso a funcionalidades)
    };
    
    checkAndRedirect();
  }, [user, loading, userRole, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
      case 'secretario':
        return <AdminDashboard />;
      case 'professor':
        return <ProfessorDashboard />;
      case 'aluno':
        return <AlunoDashboard />;
      case 'funcionario':
      case 'tesoureiro':
        return <FuncionarioDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};

export default Dashboard;
