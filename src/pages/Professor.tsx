import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { ProfessorDashboard } from "@/components/dashboards/ProfessorDashboard";

const Professor = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    if (!loading && user && userRole && userRole !== 'professor') {
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <ProfessorDashboard />
    </Layout>
  );
};

export default Professor;
