-- Drop and recreate FK constraints with ON DELETE SET NULL to allow user deletion

-- inventario.responsavel_id
ALTER TABLE public.inventario DROP CONSTRAINT IF EXISTS fk_inventario_responsavel_id;
ALTER TABLE public.inventario ADD CONSTRAINT fk_inventario_responsavel_id 
  FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- documentos.user_id
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS fk_documentos_user_id;
ALTER TABLE public.documentos ADD CONSTRAINT fk_documentos_user_id 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- documentos.gerado_por
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS fk_documentos_gerado_por;
ALTER TABLE public.documentos ADD CONSTRAINT fk_documentos_gerado_por 
  FOREIGN KEY (gerado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- noticias.autor_id
ALTER TABLE public.noticias DROP CONSTRAINT IF EXISTS fk_noticias_autor_id;
ALTER TABLE public.noticias ADD CONSTRAINT fk_noticias_autor_id 
  FOREIGN KEY (autor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- relatorios.user_id
ALTER TABLE public.relatorios DROP CONSTRAINT IF EXISTS fk_relatorios_user_id;
ALTER TABLE public.relatorios ADD CONSTRAINT fk_relatorios_user_id 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- notas.lancado_por
ALTER TABLE public.notas DROP CONSTRAINT IF EXISTS fk_notas_lancado_por;
ALTER TABLE public.notas ADD CONSTRAINT fk_notas_lancado_por 
  FOREIGN KEY (lancado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- exames.lancado_por
ALTER TABLE public.exames DROP CONSTRAINT IF EXISTS exames_lancado_por_fkey;
ALTER TABLE public.exames ADD CONSTRAINT exames_lancado_por_fkey 
  FOREIGN KEY (lancado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create table for system alerts (automated notifications for late payments and pending grades)
CREATE TABLE IF NOT EXISTS public.alertas_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'pagamento_atrasado', 'nota_pendente', 'matricula_pendente'
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  referencia_id UUID, -- ID relacionado (aluno_id, nota_id, etc)
  referencia_tipo VARCHAR(50), -- 'aluno', 'nota', 'matricula'
  data_vencimento DATE,
  valor DECIMAL(10,2),
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolvido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.alertas_sistema ENABLE ROW LEVEL SECURITY;

-- Create policies - only admin, secretario and tesoureiro can view/manage alerts
CREATE POLICY "Staff can view alerts" ON public.alertas_sistema
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretario', 'tesoureiro', 'funcionario')
    )
  );

CREATE POLICY "Staff can manage alerts" ON public.alertas_sistema
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'secretario', 'tesoureiro')
    )
  );

-- Create function to generate late payment alerts
CREATE OR REPLACE FUNCTION public.gerar_alertas_pagamentos_atrasados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aluno_record RECORD;
  ultimo_pagamento DATE;
  meses_atrasados INTEGER;
BEGIN
  -- Loop through active students
  FOR aluno_record IN 
    SELECT a.id, a.user_id, p.nome_completo
    FROM alunos a
    JOIN profiles p ON a.user_id = p.id
    WHERE a.estado = 'activo'
  LOOP
    -- Find last payment for this student
    SELECT MAX(data_transacao::date) INTO ultimo_pagamento
    FROM financas
    WHERE aluno_id = aluno_record.id
    AND categoria = 'mensalidade'
    AND tipo = 'entrada';
    
    -- If no payment or last payment is more than 30 days ago
    IF ultimo_pagamento IS NULL OR ultimo_pagamento < (CURRENT_DATE - INTERVAL '30 days') THEN
      meses_atrasados := COALESCE(
        EXTRACT(MONTH FROM age(CURRENT_DATE, COALESCE(ultimo_pagamento, CURRENT_DATE - INTERVAL '60 days')))::INTEGER,
        2
      );
      
      -- Check if alert already exists for this student
      IF NOT EXISTS (
        SELECT 1 FROM alertas_sistema 
        WHERE referencia_id = aluno_record.id 
        AND tipo = 'pagamento_atrasado'
        AND resolvido = FALSE
      ) THEN
        INSERT INTO alertas_sistema (tipo, titulo, mensagem, referencia_id, referencia_tipo, data_vencimento)
        VALUES (
          'pagamento_atrasado',
          'Pagamento em Atraso - ' || aluno_record.nome_completo,
          'O aluno ' || aluno_record.nome_completo || ' tem mensalidade(s) em atraso há aproximadamente ' || 
          GREATEST(meses_atrasados, 1) || ' mês(es).',
          aluno_record.id,
          'aluno',
          ultimo_pagamento + INTERVAL '30 days'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Create function to generate pending grade alerts
CREATE OR REPLACE FUNCTION public.gerar_alertas_notas_pendentes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trimestre_record RECORD;
  turma_record RECORD;
  disciplina_record RECORD;
  alunos_sem_nota INTEGER;
BEGIN
  -- Get active academic year and current trimester
  FOR trimestre_record IN
    SELECT t.id, t.numero, al.ano, al.id as ano_lectivo_id
    FROM trimestres t
    JOIN anos_lectivos al ON t.ano_lectivo_id = al.id
    WHERE al.activo = TRUE
    AND t.bloqueado = FALSE
    AND t.data_inicio <= CURRENT_DATE
    AND t.data_fim >= CURRENT_DATE - INTERVAL '7 days'
  LOOP
    -- Check each class
    FOR turma_record IN
      SELECT id, nome, classe FROM turmas WHERE ano_lectivo_id = trimestre_record.ano_lectivo_id
    LOOP
      -- Check each discipline for the class
      FOR disciplina_record IN
        SELECT d.id, d.nome
        FROM disciplinas d
        WHERE d.classe = turma_record.classe
      LOOP
        -- Count students without grades
        SELECT COUNT(*) INTO alunos_sem_nota
        FROM alunos a
        WHERE a.turma_id = turma_record.id
        AND a.estado = 'activo'
        AND NOT EXISTS (
          SELECT 1 FROM notas n
          WHERE n.aluno_id = a.id
          AND n.disciplina_id = disciplina_record.id
          AND n.ano_lectivo_id = trimestre_record.ano_lectivo_id
          AND n.trimestre = trimestre_record.numero
          AND n.media_trimestral IS NOT NULL
        );
        
        -- Create alert if there are students without grades
        IF alunos_sem_nota > 0 THEN
          IF NOT EXISTS (
            SELECT 1 FROM alertas_sistema
            WHERE tipo = 'nota_pendente'
            AND referencia_tipo = 'turma_disciplina'
            AND mensagem LIKE '%' || turma_record.nome || '%' || disciplina_record.nome || '%Trimestre ' || trimestre_record.numero || '%'
            AND resolvido = FALSE
          ) THEN
            INSERT INTO alertas_sistema (tipo, titulo, mensagem, referencia_tipo)
            VALUES (
              'nota_pendente',
              'Notas Pendentes - ' || turma_record.nome,
              alunos_sem_nota || ' aluno(s) da turma ' || turma_record.nome || ' sem notas em ' || 
              disciplina_record.nome || ' - Trimestre ' || trimestre_record.numero,
              'turma_disciplina'
            );
          END IF;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;