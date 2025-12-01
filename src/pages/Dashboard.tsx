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
    } else if (!loading && user && !userRole) {
      // Redirect users without role to auto-enrollment
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
