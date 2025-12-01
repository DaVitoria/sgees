-- Criar tabela de exames
CREATE TABLE IF NOT EXISTS public.exames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  ano_lectivo_id UUID NOT NULL REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  classe INTEGER NOT NULL CHECK (classe IN (9, 10, 12)),
  tipo_exame TEXT NOT NULL CHECK (tipo_exame IN ('nacional', 'provincial', 'final')),
  nota_exame NUMERIC CHECK (nota_exame >= 0 AND nota_exame <= 20),
  nota_final NUMERIC CHECK (nota_final >= 0 AND nota_final <= 20),
  data_exame DATE,
  local_exame TEXT,
  numero_pauta TEXT,
  estado TEXT DEFAULT 'agendado' CHECK (estado IN ('agendado', 'realizado', 'aprovado', 'reprovado')),
  observacoes TEXT,
  lancado_por UUID REFERENCES public.profiles(id),
  lancado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(aluno_id, disciplina_id, ano_lectivo_id, tipo_exame)
);

-- Comentários
COMMENT ON TABLE public.exames IS 'Tabela para gestão de exames das classes 9, 10 e 12';
COMMENT ON COLUMN public.exames.tipo_exame IS 'Tipo de exame: nacional (9ª e 12ª), provincial, ou final';
COMMENT ON COLUMN public.exames.nota_exame IS 'Nota obtida no exame (0-20)';
COMMENT ON COLUMN public.exames.nota_final IS 'Nota final após combinação com avaliações do ano';
COMMENT ON COLUMN public.exames.numero_pauta IS 'Número de pauta do aluno no exame';

-- Índices para melhor performance
CREATE INDEX idx_exames_aluno ON public.exames(aluno_id);
CREATE INDEX idx_exames_disciplina ON public.exames(disciplina_id);
CREATE INDEX idx_exames_ano_lectivo ON public.exames(ano_lectivo_id);
CREATE INDEX idx_exames_classe ON public.exames(classe);
CREATE INDEX idx_exames_estado ON public.exames(estado);

-- Enable RLS
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;

-- RLS Policies para exames
CREATE POLICY "Admins podem gerir todos os exames"
  ON public.exames
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professores podem ver exames das suas disciplinas"
  ON public.exames
  FOR SELECT
  USING (
    has_role(auth.uid(), 'professor'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      JOIN public.professores p ON p.id = pd.professor_id
      WHERE p.user_id = auth.uid()
        AND pd.disciplina_id = exames.disciplina_id
    )
  );

CREATE POLICY "Professores podem inserir exames das suas disciplinas"
  ON public.exames
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'professor'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      JOIN public.professores p ON p.id = pd.professor_id
      WHERE p.user_id = auth.uid()
        AND pd.disciplina_id = exames.disciplina_id
    )
  );

CREATE POLICY "Professores podem atualizar exames das suas disciplinas"
  ON public.exames
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'professor'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      JOIN public.professores p ON p.id = pd.professor_id
      WHERE p.user_id = auth.uid()
        AND pd.disciplina_id = exames.disciplina_id
    )
  );

CREATE POLICY "Alunos podem ver seus próprios exames"
  ON public.exames
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE alunos.id = exames.aluno_id
        AND alunos.user_id = auth.uid()
    )
  );

CREATE POLICY "Autenticação obrigatória para exames"
  ON public.exames
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Trigger para validar integridade dos exames
CREATE OR REPLACE FUNCTION public.validate_exame_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o aluno existe
  IF NOT EXISTS (SELECT 1 FROM public.alunos WHERE id = NEW.aluno_id) THEN
    RAISE EXCEPTION 'Aluno não encontrado: %', NEW.aluno_id;
  END IF;
  
  -- Verificar se a disciplina existe
  IF NOT EXISTS (SELECT 1 FROM public.disciplinas WHERE id = NEW.disciplina_id) THEN
    RAISE EXCEPTION 'Disciplina não encontrada: %', NEW.disciplina_id;
  END IF;
  
  -- Verificar se o ano letivo existe
  IF NOT EXISTS (SELECT 1 FROM public.anos_lectivos WHERE id = NEW.ano_lectivo_id) THEN
    RAISE EXCEPTION 'Ano letivo não encontrado: %', NEW.ano_lectivo_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_exame_before_insert_update
  BEFORE INSERT OR UPDATE ON public.exames
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_exame_integrity();

-- Trigger para audit log de exames
CREATE OR REPLACE FUNCTION public.log_exames_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', 'exames', NEW.id::text, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', 'exames', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', 'exames', OLD.id::text, to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER log_exames_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.exames
  FOR EACH ROW
  EXECUTE FUNCTION public.log_exames_changes();