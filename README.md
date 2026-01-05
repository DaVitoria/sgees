# Sistema de Gestão Escolar - Moçambique

## Descrição do Projeto

Sistema de Gestão Escolar completo desenvolvido para escolas secundárias em Moçambique (7ª à 12ª classe), abrangendo a área administrativa e pedagógica.

**URL do Projeto**: https://lovable.dev/projects/0c5ea40d-018a-48c8-81ae-5f3fea4b0b0f

---

## Problema Constatado

As escolas secundárias em Moçambique enfrentam diversos desafios na gestão das suas actividades diárias:

1. **Gestão Manual de Matrículas**: Processo demorado e propenso a erros, com dificuldade em rastrear o estado das matrículas e manter registos actualizados dos alunos.

2. **Lançamento e Acompanhamento de Notas**: Professores utilizam métodos manuais (cadernos, folhas de cálculo) para registar notas, dificultando o cálculo de médias e a geração de boletins.

3. **Falta de Transparência**: Alunos e encarregados de educação têm acesso limitado às informações académicas, dependendo de deslocações à escola para obter notas e situação pedagógica.

4. **Gestão Financeira Desorganizada**: Controlo de propinas, contribuições e despesas feito manualmente, dificultando a geração de relatórios e o balanço financeiro.

5. **Comunicação Ineficiente**: Ausência de canais digitais para notificações sobre notas, matrículas e comunicados da direcção.

6. **Documentação Dispersa**: Emissão manual de certificados, declarações e boletins, causando atrasos e inconsistências.

---

## Objectivo Geral

Desenvolver uma plataforma web integrada que auxilie as escolas secundárias moçambicanas na gestão eficiente de todas as actividades escolares, automatizando processos administrativos e pedagógicos para melhorar a qualidade do ensino e a experiência de alunos, professores e funcionários.

---

## Objectivos Específicos

1. **Automatizar o processo de matrícula** - Permitir que alunos submetam matrículas online e funcionários aprovem/rejeitem com atribuição de turmas.

2. **Digitalizar o lançamento de notas** - Criar sistema para professores registarem notas (AS1, AS2, AS3, AT) com cálculo automático de médias trimestrais e anuais.

3. **Implementar portal do aluno** - Disponibilizar acesso seguro para alunos visualizarem notas, situação pedagógica e documentos.

4. **Centralizar gestão financeira** - Registar entradas (propinas, contribuições) e saídas (manutenção, materiais) com geração de relatórios.

5. **Automatizar emissão de documentos** - Gerar boletins, declarações e certificados em formato PDF.

6. **Implementar sistema de notificações** - Alertar alunos em tempo real sobre notas lançadas e actualizações de matrícula.

7. **Controlar acessos por perfil** - Garantir que cada utilizador aceda apenas às funcionalidades autorizadas para o seu perfil.

---

## Requisitos Funcionais

| RF | Descrição |
|----|-----------|
| RF01 | O sistema deve permitir o registo e autenticação de utilizadores com diferentes perfis |
| RF02 | O sistema deve permitir a submissão de matrículas online pelos alunos |
| RF03 | O sistema deve permitir a aprovação/rejeição de matrículas por funcionários |
| RF04 | O sistema deve permitir a atribuição de alunos a turmas |
| RF05 | O sistema deve permitir o lançamento de notas por trimestre (AS1, AS2, AS3, AT) |
| RF06 | O sistema deve calcular automaticamente médias trimestrais e anuais |
| RF07 | O sistema deve determinar automaticamente o estado de aprovação (Aprovado/Reprovado/Exame) |
| RF08 | O sistema deve gerar boletins de notas em PDF |
| RF09 | O sistema deve permitir o registo de transacções financeiras (entradas e saídas) |
| RF10 | O sistema deve gerar relatórios financeiros mensais e anuais |
| RF11 | O sistema deve permitir a gestão de inventário escolar |
| RF12 | O sistema deve enviar notificações em tempo real aos alunos |
| RF13 | O sistema deve permitir a gestão de turmas e atribuição de disciplinas a professores |
| RF14 | O sistema deve permitir a gestão de exames para classes 9, 10 e 12 |
| RF15 | O sistema deve permitir a emissão de declarações e certificados |
| RF16 | O sistema deve exibir o organograma da escola na página inicial |
| RF17 | O sistema deve permitir a atribuição de perfis a novos utilizadores |

---

## Requisitos Não Funcionais

| RNF | Descrição |
|-----|-----------|
| RNF01 | **Segurança**: Autenticação JWT com políticas RLS (Row Level Security) em todas as tabelas |
| RNF02 | **Usabilidade**: Interface responsiva e intuitiva, adaptada a dispositivos móveis |
| RNF03 | **Desempenho**: Tempo de resposta inferior a 3 segundos para operações comuns |
| RNF04 | **Disponibilidade**: Sistema disponível 24/7 com hospedagem na cloud |
| RNF05 | **Localização**: Adaptado ao contexto moçambicano (idioma pt-MZ, moeda MZN, formato dd/mm/yyyy) |
| RNF06 | **Escalabilidade**: Arquitectura que suporta crescimento do número de utilizadores |
| RNF07 | **Auditoria**: Registo de todas as alterações em tabelas críticas para rastreabilidade |
| RNF08 | **Compatibilidade**: Suporte aos navegadores Chrome, Firefox, Safari e Edge |

---

## Classes do Sistema (Perfis de Utilizador)

### 1. Administrador (Admin)
- Acesso total ao sistema
- Gestão de utilizadores e atribuição de perfis
- Visualização de todos os relatórios e estatísticas
- Configurações gerais do sistema

### 2. Professor
- Lançamento de notas para turmas atribuídas
- Visualização de relatórios pedagógicos das suas turmas
- Gestão de aprovações dos seus alunos

### 3. Aluno
- Visualização das próprias notas e situação pedagógica
- Submissão de matrícula online
- Acompanhamento do estado da matrícula
- Download de boletins e documentos

### 4. Funcionário/Secretário
- Gestão de matrículas (aprovação/rejeição)
- Gestão de alunos e professores
- Gestão de turmas e horários
- Controlo financeiro e inventário
- Emissão de documentos

### 5. Tesoureiro
- Gestão financeira completa
- Registo de entradas e saídas
- Geração de relatórios financeiros

---

## Casos de Uso

### UC01 - Realizar Matrícula
**Actor**: Aluno  
**Pré-condição**: Utilizador autenticado com perfil aluno  
**Fluxo Principal**:
1. Aluno acede ao formulário de auto-matrícula
2. Preenche dados pessoais e selecciona a classe
3. Submete a matrícula
4. Sistema gera número de matrícula e regista como "pendente"

### UC02 - Aprovar Matrícula
**Actor**: Funcionário  
**Pré-condição**: Existir matrículas pendentes  
**Fluxo Principal**:
1. Funcionário visualiza lista de matrículas pendentes
2. Selecciona matrícula e atribui turma
3. Aprova a matrícula
4. Sistema notifica o aluno

### UC03 - Lançar Notas
**Actor**: Professor  
**Pré-condição**: Professor com turmas e disciplinas atribuídas  
**Fluxo Principal**:
1. Professor selecciona turma, disciplina e trimestre
2. Insere notas AS1, AS2, AS3 e AT para cada aluno
3. Sistema calcula médias automaticamente
4. Professor confirma o lançamento
5. Sistema notifica os alunos

### UC04 - Consultar Notas
**Actor**: Aluno  
**Pré-condição**: Aluno com matrícula aprovada  
**Fluxo Principal**:
1. Aluno acede ao portal do aluno
2. Visualiza notas por disciplina e trimestre
3. Consulta média anual e estado de aprovação

### UC05 - Gerar Relatório Financeiro
**Actor**: Funcionário/Tesoureiro  
**Pré-condição**: Existirem transacções registadas  
**Fluxo Principal**:
1. Utilizador acede à gestão financeira
2. Selecciona período do relatório
3. Sistema gera relatório com entradas, saídas e saldo
4. Exporta em PDF

---

## Funcionalidades

### Área Administrativa
- ✅ Gestão de Utilizadores
- ✅ Atribuição de Perfis (Roles)
- ✅ Gestão de Matrículas
- ✅ Gestão de Alunos
- ✅ Gestão de Professores
- ✅ Gestão Financeira
- ✅ Gestão de Inventário
- ✅ Emissão de Documentos
- ✅ Relatórios Administrativos
- ✅ Organograma da Escola

### Área Pedagógica
- ✅ Gestão de Turmas
- ✅ Atribuição de Disciplinas
- ✅ Lançamento de Notas (AS1, AS2, AS3, AT, MAS, MT, MA)
- ✅ Gestão de Exames (Classes 9, 10, 12)
- ✅ Relatórios Pedagógicos
- ✅ Gestão de Aprovações

### Portal do Aluno
- ✅ Dashboard Personalizado
- ✅ Visualização de Notas
- ✅ Situação Pedagógica
- ✅ Acompanhamento de Matrícula
- ✅ Download de Documentos
- ✅ Notificações em Tempo Real

---

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Gráficos**: Recharts
- **PDF**: jsPDF, jspdf-autotable
- **Validação**: Zod
- **Estado**: TanStack React Query

---

## Como Executar o Projecto

### Pré-requisitos
- Node.js & npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Conta Supabase (para backend)

### Passos

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>

# Navegar para o directório do projecto
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm i

# Iniciar servidor de desenvolvimento
npm run dev
```

---

## Configuração do Banco de Dados Supabase (lurocvdb)

Esta secção documenta todos os passos necessários para configurar um novo banco de dados Supabase chamado **lurocvdb** com todas as tabelas, relacionamentos, RLS policies e funções.

### Passo 1: Criar Projecto Supabase

1. Aceda a [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Configure:
   - **Nome do Projecto**: `lurocvdb`
   - **Database Password**: (guarde em local seguro)
   - **Região**: Escolha a mais próxima (Europe para Moçambique)
4. Aguarde a criação do projecto (2-3 minutos)

### Passo 2: Obter Credenciais

Após criação, vá a **Project Settings > API** e copie:
- **Project URL**: `https://[project-id].supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
- **service_role key**: (para Edge Functions - manter segura!)

### Passo 3: Configurar Variáveis de Ambiente

Crie/edite o ficheiro `.env` na raiz do projecto:

```env
VITE_SUPABASE_URL=https://[seu-project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[sua-anon-key]
VITE_SUPABASE_PROJECT_ID=[seu-project-id]
```

### Passo 4: Criar Enumerações (Enums)

Execute no **SQL Editor** do Supabase Dashboard:

```sql
-- Enum para perfis de utilizador
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'professor', 
  'aluno',
  'secretario',
  'tesoureiro',
  'funcionario'
);

-- Enum para tipos de transacção financeira
CREATE TYPE public.tipo_transacao AS ENUM (
  'entrada',
  'saida'
);

-- Enum para categorias financeiras
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
```

### Passo 5: Criar Função de Verificação de Roles

```sql
-- Função para verificar se utilizador tem um role específico
-- SECURITY DEFINER evita problemas de RLS recursivo
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Passo 6: Criar Tabelas Base

Execute os scripts na ordem indicada (respeitando dependências):

#### 6.1 - Tabela profiles (associada a auth.users)
```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_completo text NOT NULL,
  email text,
  bi text,
  telefone text,
  endereco text,
  sexo text,
  data_nascimento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

#### 6.2 - Tabela user_roles
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### 6.3 - Tabela anos_lectivos
```sql
CREATE TABLE public.anos_lectivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.anos_lectivos ENABLE ROW LEVEL SECURITY;
```

#### 6.4 - Tabela turmas
```sql
CREATE TABLE public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  classe integer NOT NULL CHECK (classe BETWEEN 7 AND 12),
  capacidade integer DEFAULT 40 CHECK (capacidade > 0),
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  director_turma_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
```

#### 6.5 - Tabela disciplinas
```sql
CREATE TABLE public.disciplinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text NOT NULL,
  classe integer NOT NULL CHECK (classe BETWEEN 7 AND 12),
  carga_horaria integer,
  descricao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;
```

#### 6.6 - Tabela trimestres
```sql
CREATE TABLE public.trimestres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  numero integer NOT NULL CHECK (numero BETWEEN 1 AND 3),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  bloqueado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trimestres ENABLE ROW LEVEL SECURITY;
```

#### 6.7 - Tabela alunos
```sql
CREATE TABLE public.alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  turma_id uuid REFERENCES public.turmas(id),
  numero_matricula text NOT NULL UNIQUE,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'transferido', 'concluido', 'desistente')),
  encarregado_nome text NOT NULL,
  encarregado_telefone text NOT NULL,
  encarregado_parentesco text,
  data_matricula date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
```

#### 6.8 - Tabela professores
```sql
CREATE TABLE public.professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  numero_funcionario text NOT NULL UNIQUE,
  habilitacao text NOT NULL,
  especialidade text,
  categoria text,
  data_admissao date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

-- Adicionar FK de director_turma após criar professores
ALTER TABLE public.turmas 
ADD CONSTRAINT turmas_director_turma_id_fkey 
FOREIGN KEY (director_turma_id) REFERENCES public.professores(id);
```

#### 6.9 - Tabela funcionarios
```sql
CREATE TABLE public.funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  numero_funcionario text NOT NULL UNIQUE,
  cargo text NOT NULL,
  departamento text,
  data_admissao date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
```

#### 6.10 - Tabela professor_disciplinas
```sql
CREATE TABLE public.professor_disciplinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (professor_id, disciplina_id, turma_id, ano_lectivo_id)
);

ALTER TABLE public.professor_disciplinas ENABLE ROW LEVEL SECURITY;
```

#### 6.11 - Tabela matriculas
```sql
CREATE TABLE public.matriculas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  turma_id uuid REFERENCES public.turmas(id),
  data_matricula date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  estado text DEFAULT 'activo',
  observacoes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (aluno_id, ano_lectivo_id)
);

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
```

#### 6.12 - Tabela notas
```sql
CREATE TABLE public.notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id),
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  trimestre integer NOT NULL CHECK (trimestre BETWEEN 1 AND 3),
  nota_as1 numeric CHECK (nota_as1 BETWEEN 0 AND 20),
  nota_as2 numeric CHECK (nota_as2 BETWEEN 0 AND 20),
  nota_as3 numeric CHECK (nota_as3 BETWEEN 0 AND 20),
  media_as numeric,
  nota_at numeric CHECK (nota_at BETWEEN 0 AND 20),
  media_trimestral numeric,
  observacoes text,
  lancado_por uuid REFERENCES auth.users(id),
  lancado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (aluno_id, disciplina_id, trimestre, ano_lectivo_id)
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
```

#### 6.13 - Tabela exames
```sql
CREATE TABLE public.exames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  disciplina_id uuid NOT NULL REFERENCES public.disciplinas(id),
  ano_lectivo_id uuid NOT NULL REFERENCES public.anos_lectivos(id),
  classe integer NOT NULL CHECK (classe IN (9, 10, 12)),
  tipo_exame text NOT NULL,
  nota_exame numeric CHECK (nota_exame BETWEEN 0 AND 20),
  nota_final numeric,
  data_exame date,
  local_exame text,
  numero_pauta text,
  estado text DEFAULT 'agendado' CHECK (estado IN ('agendado', 'realizado', 'cancelado')),
  observacoes text,
  lancado_por uuid REFERENCES auth.users(id),
  lancado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;
```

#### 6.14 - Tabela financas
```sql
CREATE TABLE public.financas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_transacao NOT NULL,
  categoria categoria_financeira NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0),
  data_transacao date DEFAULT CURRENT_DATE,
  aluno_id uuid REFERENCES public.alunos(id),
  registado_por uuid NOT NULL REFERENCES auth.users(id),
  comprovante text,
  status_confirmacao text DEFAULT 'confirmado',
  confirmado_por uuid REFERENCES auth.users(id),
  data_confirmacao timestamptz,
  motivo_rejeicao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.financas ENABLE ROW LEVEL SECURITY;
```

#### 6.15 - Tabela inventario
```sql
CREATE TABLE public.inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  estado text DEFAULT 'bom' CHECK (estado IN ('bom', 'danificado', 'em_reparacao', 'obsoleto')),
  localizacao text,
  valor_unitario numeric,
  data_aquisicao date,
  responsavel_id uuid REFERENCES auth.users(id),
  descricao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
```

#### 6.16 - Tabela documentos
```sql
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL,
  descricao text,
  url_ficheiro text,
  aluno_id uuid REFERENCES public.alunos(id),
  user_id uuid REFERENCES auth.users(id),
  gerado_por uuid REFERENCES auth.users(id),
  data_geracao date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
```

#### 6.17 - Tabela notificacoes
```sql
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'info' CHECK (tipo IN ('info', 'nota', 'matricula', 'alerta', 'erro')),
  link text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
```

#### 6.18 - Tabela noticias
```sql
CREATE TABLE public.noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  conteudo text NOT NULL,
  imagem_url text,
  publicado boolean DEFAULT false,
  data_publicacao timestamptz,
  autor_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
```

#### 6.19 - Tabela organograma
```sql
CREATE TABLE public.organograma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text NOT NULL,
  foto_url text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.organograma ENABLE ROW LEVEL SECURITY;
```

#### 6.20 - Tabela relatorios
```sql
CREATE TABLE public.relatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo text NOT NULL,
  descricao text,
  conteudo jsonb,
  periodo_inicio date,
  periodo_fim date,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
```

#### 6.21 - Tabela audit_logs
```sql
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

#### 6.22 - Tabela alertas_sistema
```sql
CREATE TABLE public.alertas_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo varchar NOT NULL,
  titulo varchar NOT NULL,
  mensagem text NOT NULL,
  referencia_tipo varchar,
  referencia_id uuid,
  data_vencimento date,
  valor numeric,
  resolvido boolean DEFAULT false,
  resolvido_por uuid REFERENCES auth.users(id),
  resolvido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.alertas_sistema ENABLE ROW LEVEL SECURITY;
```

#### 6.23 - View alunos_basico
```sql
CREATE VIEW public.alunos_basico AS
SELECT 
  a.id,
  a.user_id,
  a.turma_id,
  a.numero_matricula,
  a.estado,
  a.data_matricula,
  a.created_at,
  p.nome_completo,
  p.email
FROM public.alunos a
LEFT JOIN public.profiles p ON p.id = a.user_id;
```

### Passo 7: Criar Funções Auxiliares

```sql
-- Função para gerar número de matrícula
CREATE OR REPLACE FUNCTION public.gerar_numero_matricula()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  novo_numero text;
  ultimo_numero integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_matricula FROM 2) AS integer)), 0)
  INTO ultimo_numero
  FROM public.alunos;
  
  novo_numero := 'M' || LPAD((ultimo_numero + 1)::text, 4, '0');
  RETURN novo_numero;
END;
$$;

-- Função para calcular média anual
CREATE OR REPLACE FUNCTION public.calcular_media_anual(
  p_aluno_id uuid,
  p_disciplina_id uuid,
  p_ano_lectivo_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ROUND(AVG(media_trimestral), 1)
  FROM public.notas
  WHERE aluno_id = p_aluno_id
    AND disciplina_id = p_disciplina_id
    AND ano_lectivo_id = p_ano_lectivo_id
    AND media_trimestral IS NOT NULL;
$$;

-- Função para verificar se é director de turma
CREATE OR REPLACE FUNCTION public.is_director_turma(_user_id uuid, _turma_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.turmas t
    JOIN public.professores p ON p.id = t.director_turma_id
    WHERE t.id = _turma_id AND p.user_id = _user_id
  )
$$;

-- Função para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### Passo 8: Criar RLS Policies

Consulte o ficheiro `TECHNICAL.md` para a lista completa de RLS policies ou execute o script consolidado disponível na pasta `supabase/migrations/`.

**Exemplo de policies essenciais:**

```sql
-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- alunos
CREATE POLICY "Students can view own data" ON public.alunos
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins secretarios can manage" ON public.alunos
FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'secretario'));

-- notas
CREATE POLICY "Alunos can view their own notas" ON public.notas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM alunos
    WHERE alunos.id = notas.aluno_id AND alunos.user_id = auth.uid()
  )
);

CREATE POLICY "Professores can manage assigned notas" ON public.notas
FOR ALL USING (
  has_role(auth.uid(), 'professor') AND 
  EXISTS (
    SELECT 1 FROM professor_disciplinas pd
    JOIN professores p ON p.id = pd.professor_id
    WHERE p.user_id = auth.uid() 
    AND pd.disciplina_id = notas.disciplina_id
    AND pd.turma_id IN (
      SELECT turma_id FROM alunos WHERE id = notas.aluno_id
    )
  )
);
```

### Passo 9: Configurar Storage Buckets

No Supabase Dashboard, vá a **Storage** e crie:

| Bucket | Público | Uso |
|--------|---------|-----|
| `organograma` | Sim | Fotos do organograma |
| `documentos` | Não | Documentos gerados |
| `comprovantes` | Não | Comprovantes de pagamento |

### Passo 10: Configurar Autenticação

1. Vá a **Authentication > Providers**
2. Habilite **Email** provider
3. Em **Authentication > URL Configuration**:
   - **Site URL**: URL do seu frontend
   - **Redirect URLs**: URLs permitidas
4. Em **Authentication > Email Templates**, personalize os templates (opcional)

### Passo 11: Deploy Edge Functions

As Edge Functions estão em `supabase/functions/`:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projecto
supabase link --project-ref [seu-project-id]

# Deploy das funções
supabase functions deploy delete-user
supabase functions deploy send-grade-notification
supabase functions deploy send-enrollment-notification
```

---

## Arquivos que Podem Ser Modificados

### Configuração Backend

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Variáveis de ambiente (VITE_SUPABASE_URL, etc.) |
| `supabase/config.toml` | Configuração Supabase local |
| `supabase/functions/*/index.ts` | Edge Functions |

### Integração Supabase (Auto-gerados - NÃO EDITAR)

| Arquivo | Descrição |
|---------|-----------|
| `src/integrations/supabase/client.ts` | Cliente Supabase |
| `src/integrations/supabase/types.ts` | Tipos TypeScript do schema |

### Código Frontend Relacionado a Dados

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useAuth.tsx` | Hook de autenticação e roles |
| `src/hooks/useNotifications.tsx` | Hook de notificações |
| `src/pages/Login.tsx` | Página de login |
| `src/pages/Dashboard.tsx` | Dashboard principal |
| `src/pages/GestaoAlunos.tsx` | Gestão de alunos |
| `src/pages/GestaoProfessores.tsx` | Gestão de professores |
| `src/pages/GestaoFinanceira.tsx` | Gestão financeira |
| `src/pages/pedagogico/*.tsx` | Páginas pedagógicas |
| `src/pages/administrativo/*.tsx` | Páginas administrativas |
| `src/components/dashboards/*.tsx` | Componentes de dashboard |

### Utilitários e Geração de Documentos

| Arquivo | Descrição |
|---------|-----------|
| `src/utils/generateBoletimPDF.ts` | Gerador de boletins PDF |
| `src/utils/generateTurmaReportPDF.ts` | Relatórios de turma |
| `src/utils/generateFinancialReportPDF.ts` | Relatórios financeiros |
| `src/utils/exportToExcel.ts` | Exportação Excel |
| `src/utils/fileDownload.ts` | Download de arquivos (mobile/web) |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `README.md` | Documentação geral |
| `TECHNICAL.md` | Documentação técnica detalhada |

---

## Checklist de Migração

- [ ] Criar projecto Supabase com nome `lurocvdb`
- [ ] Copiar credenciais para `.env`
- [ ] Executar scripts de criação de enums
- [ ] Executar função `has_role`
- [ ] Criar todas as tabelas na ordem correcta
- [ ] Criar funções auxiliares
- [ ] Configurar todas as RLS policies
- [ ] Criar storage buckets
- [ ] Configurar autenticação
- [ ] Deploy das Edge Functions
- [ ] Criar utilizador admin inicial
- [ ] Testar login e funcionalidades básicas

---

## Criar Utilizador Admin Inicial

Após configurar tudo, crie o primeiro admin:

1. Registe um utilizador pelo frontend
2. Execute no SQL Editor:

```sql
-- Substituir pelo ID do utilizador criado
INSERT INTO public.user_roles (user_id, role)
VALUES ('[user-id-aqui]', 'admin');
```

---

## Publicação

Aceda a [Lovable](https://lovable.dev/projects/0c5ea40d-018a-48c8-81ae-5f3fea4b0b0f) e clique em Share -> Publish.

---

## Conectar Domínio Personalizado

Navegue até Project > Settings > Domains e clique em Connect Domain.

Mais informações: [Configurar domínio personalizado](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Autores

Desenvolvido por [Clands](https://github.com/DaVitoria)

---

## Licença

Este projecto é propriedade privada e destina-se a fins educacionais.
