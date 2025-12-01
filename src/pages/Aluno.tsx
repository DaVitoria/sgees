import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { AlunoDashboard } from "@/components/dashboards/AlunoDashboard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, Mail, FileEdit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Aluno = () => {
  const { user, loading, userRole } = useAuth();
  const navigate = useNavigate();
  const [hasAlunoRecord, setHasAlunoRecord] = useState<boolean | null>(null);

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
    if (!loading && user && userRole && userRole !== 'aluno') {
      navigate("/dashboard");
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    const checkAlunoRecord = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('alunos')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking aluno record:', error);
        setHasAlunoRecord(false);
        return;
      }
      
      setHasAlunoRecord(!!data);
    };
    
    if (user) {
      checkAlunoRecord();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  if (hasAlunoRecord === false) {
    return (
      <Layout>
        <div className="container mx-auto p-6 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                Portal do Aluno
              </CardTitle>
              <CardDescription>
                Nenhum registo de aluno encontrado para esta conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>O que pode estar a acontecer:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>A sua conta ainda não foi associada a um registo de aluno</li>
                    <li>O processo de matrícula ainda não foi concluído</li>
                    <li>A secretaria ainda não activou o seu acesso</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold">Próximos passos:</h3>
                <p className="text-sm text-muted-foreground">
                  Por favor, contacte a secretaria da escola para verificar o estado da sua matrícula e activar o acesso ao portal.
                </p>
                
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span>+258 84 123 4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    <span>secretaria@escola.co.mz</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/auto-matricula')} 
                  className="w-full gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  Solicitar Matrícula
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AlunoDashboard />
    </Layout>
  );
};

export default Aluno;
