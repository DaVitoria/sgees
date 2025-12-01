import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ProfessorDashboard } from "@/components/dashboards/ProfessorDashboard";
import { AlunoDashboard } from "@/components/dashboards/AlunoDashboard";
import { FuncionarioDashboard } from "@/components/dashboards/FuncionarioDashboard";

const Dashboard = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && user && userRole === 'aluno') {
      // Redirecionar alunos para seu portal específico
      navigate("/aluno");
    } else if (!loading && user && userRole === 'professor') {
      // Redirecionar professores para seu portal específico
      navigate("/professor");
    } else if (!loading && user && !userRole) {
      // Utilizadores sem role, redirecionar para auto-matrícula
      navigate("/auto-matricula");
    }
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
