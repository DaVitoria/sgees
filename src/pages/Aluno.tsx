import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { AlunoDashboard } from "@/components/dashboards/AlunoDashboard";

const Aluno = () => {
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

  if (!user || userRole !== 'aluno') {
    navigate("/dashboard");
    return null;
  }

  return (
    <Layout>
      <AlunoDashboard />
    </Layout>
  );
};

export default Aluno;
