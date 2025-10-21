-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'professor', 'aluno', 'secretario', 'tesoureiro');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  bi TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create anos_lectivos table
CREATE TABLE public.anos_lectivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano TEXT NOT NULL UNIQUE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create turmas table
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  classe INTEGER NOT NULL CHECK (classe >= 7 AND classe <= 12),
  ano_lectivo_id UUID REFERENCES public.anos_lectivos(id) ON DELETE CASCADE NOT NULL,
  capacidade INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nome, ano_lectivo_id)
);

-- Create disciplinas table
CREATE TABLE public.disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,
  classe INTEGER NOT NULL CHECK (classe >= 7 AND classe <= 12),
  carga_horaria INTEGER,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create professores table
CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  numero_funcionario TEXT UNIQUE NOT NULL,
  habilitacao TEXT NOT NULL,
  categoria TEXT,
  data_admissao DATE,
  especialidade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create professor_disciplinas (associação professores-disciplinas)
CREATE TABLE public.professor_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  ano_lectivo_id UUID REFERENCES public.anos_lectivos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professor_id, disciplina_id, turma_id, ano_lectivo_id)
);

-- Create alunos table
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  numero_matricula TEXT UNIQUE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  encarregado_nome TEXT NOT NULL,
  encarregado_telefone TEXT NOT NULL,
  encarregado_parentesco TEXT,
  data_matricula DATE DEFAULT CURRENT_DATE,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'transferido', 'concluido', 'desistente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notas table
CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  ano_lectivo_id UUID REFERENCES public.anos_lectivos(id) ON DELETE CASCADE NOT NULL,
  trimestre INTEGER NOT NULL CHECK (trimestre >= 1 AND trimestre <= 3),
  nota_mac NUMERIC(5,2) CHECK (nota_mac >= 0 AND nota_mac <= 20),
  nota_cpp NUMERIC(5,2) CHECK (nota_cpp >= 0 AND nota_cpp <= 20),
  nota_cat NUMERIC(5,2) CHECK (nota_cat >= 0 AND nota_cat <= 20),
  media NUMERIC(5,2) GENERATED ALWAYS AS (
    (COALESCE(nota_mac, 0) + COALESCE(nota_cpp, 0) + COALESCE(nota_cat, 0)) / 
    NULLIF((CASE WHEN nota_mac IS NOT NULL THEN 1 ELSE 0 END + 
            CASE WHEN nota_cpp IS NOT NULL THEN 1 ELSE 0 END + 
            CASE WHEN nota_cat IS NOT NULL THEN 1 ELSE 0 END), 0)
  ) STORED,
  observacoes TEXT,
  lancado_por UUID REFERENCES auth.users(id),
  lancado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aluno_id, disciplina_id, ano_lectivo_id, trimestre)
);

-- Create tipo_transacao enum
CREATE TYPE public.tipo_transacao AS ENUM ('entrada', 'saida');

-- Create categoria_financeira enum
CREATE TYPE public.categoria_financeira AS ENUM (
  'matricula',
  'mensalidade',
  'contribuicao',
  'servicos',
  'producao_escolar',
  'manutencao',
  'materiais',
  'eventos',
  'pagamentos',
  'outros'
);

-- Create financas table
CREATE TABLE public.financas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_transacao NOT NULL,
  categoria categoria_financeira NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  descricao TEXT NOT NULL,
  data_transacao DATE DEFAULT CURRENT_DATE,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  comprovante TEXT,
  registado_por UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create noticias table (para página inicial)
CREATE TABLE public.noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  publicado BOOLEAN DEFAULT false,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  autor_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anos_lectivos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for alunos
CREATE POLICY "Alunos can view their own data"
  ON public.alunos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and secretarios can view all alunos"
  ON public.alunos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

CREATE POLICY "Admins and secretarios can manage alunos"
  ON public.alunos FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

-- RLS Policies for professores
CREATE POLICY "Professores can view their own data"
  ON public.professores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all professores"
  ON public.professores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

CREATE POLICY "Admins can manage professores"
  ON public.professores FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

-- RLS Policies for notas
CREATE POLICY "Alunos can view their own notas"
  ON public.notas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.alunos
      WHERE alunos.id = notas.aluno_id AND alunos.user_id = auth.uid()
    )
  );

CREATE POLICY "Professores can view notas of their turmas"
  ON public.notas FOR SELECT
  USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Professores can insert/update notas"
  ON public.notas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Professores can update notas"
  ON public.notas FOR UPDATE
  USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Admins can manage all notas"
  ON public.notas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for financas
CREATE POLICY "Admins and tesoureiros can view financas"
  ON public.financas FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesoureiro'));

CREATE POLICY "Admins and tesoureiros can manage financas"
  ON public.financas FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesoureiro'));

-- RLS Policies for noticias (público pode ver notícias publicadas)
CREATE POLICY "Anyone can view published noticias"
  ON public.noticias FOR SELECT
  USING (publicado = true);

CREATE POLICY "Admins can manage noticias"
  ON public.noticias FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for public tables (todos autenticados podem ver)
CREATE POLICY "Authenticated users can view turmas"
  ON public.turmas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage turmas"
  ON public.turmas FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

CREATE POLICY "Authenticated users can view disciplinas"
  ON public.disciplinas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage disciplinas"
  ON public.disciplinas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view anos_lectivos"
  ON public.anos_lectivos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage anos_lectivos"
  ON public.anos_lectivos FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretario'));

CREATE POLICY "Authenticated users can view professor_disciplinas"
  ON public.professor_disciplinas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage professor_disciplinas"
  ON public.professor_disciplinas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON public.noticias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Utilizador'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();