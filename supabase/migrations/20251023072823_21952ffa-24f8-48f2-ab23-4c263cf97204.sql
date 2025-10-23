-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_funcionario TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL,
  departamento TEXT,
  data_admissao DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage funcionarios"
ON public.funcionarios FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

CREATE POLICY "Funcionarios can view their own data"
ON public.funcionarios FOR SELECT
USING (auth.uid() = user_id);

-- Criar tabela de matrículas (histórico de matrículas)
CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  ano_lectivo_id UUID NOT NULL REFERENCES public.anos_lectivos(id) ON DELETE CASCADE,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'transferido', 'desistente', 'concluido')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and secretarios can manage matriculas"
ON public.matriculas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

CREATE POLICY "Alunos can view their own matriculas"
ON public.matriculas FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.alunos WHERE alunos.id = matriculas.aluno_id AND alunos.user_id = auth.uid()
));

-- Criar tabela de inventário
CREATE TABLE IF NOT EXISTS public.inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  localizacao TEXT,
  estado TEXT DEFAULT 'bom' CHECK (estado IN ('bom', 'regular', 'mau', 'danificado')),
  valor_unitario NUMERIC(10,2),
  data_aquisicao DATE,
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and funcionarios can manage inventario"
ON public.inventario FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'funcionario'::app_role));

CREATE POLICY "Authenticated users can view inventario"
ON public.inventario FOR SELECT
USING (true);

-- Criar trigger para updated_at do inventário
CREATE TRIGGER update_inventario_updated_at
BEFORE UPDATE ON public.inventario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('certificado', 'boletim', 'declaracao', 'atestado', 'outros')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url_ficheiro TEXT,
  gerado_por UUID REFERENCES auth.users(id),
  data_geracao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and secretarios can manage all documentos"
ON public.documentos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'secretario'::app_role));

CREATE POLICY "Alunos can view their own documentos"
ON public.documentos FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.alunos WHERE alunos.id = documentos.aluno_id AND alunos.user_id = auth.uid()
));

CREATE POLICY "Users can view their own user documentos"
ON public.documentos FOR SELECT
USING (auth.uid() = user_id);

-- Criar tabela de relatórios
CREATE TABLE IF NOT EXISTS public.relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pedagogico', 'financeiro', 'administrativo', 'outros')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo JSONB,
  periodo_inicio DATE,
  periodo_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all relatorios"
ON public.relatorios FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own relatorios"
ON public.relatorios FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Professores can create pedagogical relatorios"
ON public.relatorios FOR INSERT
WITH CHECK (has_role(auth.uid(), 'professor'::app_role) AND tipo = 'pedagogico');

CREATE POLICY "Tesoureiros can create financial relatorios"
ON public.relatorios FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tesoureiro'::app_role) AND tipo = 'financeiro');