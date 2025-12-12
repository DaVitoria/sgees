# Documentação Técnica - Sistema de Gestão Escolar

Este documento destina-se a desenvolvedores e contém informações técnicas detalhadas sobre a arquitectura, base de dados e implementação do sistema.

---

## Índice

1. [Arquitectura do Sistema](#arquitectura-do-sistema)
2. [Estrutura da Base de Dados](#estrutura-da-base-de-dados)
3. [Diagrama Entidade-Relacionamento](#diagrama-entidade-relacionamento)
4. [Tabelas e Campos](#tabelas-e-campos)
5. [Enumerações (Enums)](#enumerações-enums)
6. [Funções de Base de Dados](#funções-de-base-de-dados)
7. [Políticas de Segurança (RLS)](#políticas-de-segurança-rls)
8. [Edge Functions](#edge-functions)
9. [Padrões de Código](#padrões-de-código)

---

## Arquitectura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + TypeScript + Vite + Tailwind CSS + shadcn/ui           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOVABLE CLOUD                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Supabase  │  │   Storage   │  │    Edge Functions       │  │
│  │  PostgreSQL │  │   Buckets   │  │  (Deno/TypeScript)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │     Auth    │  │  Realtime   │  │      RLS Policies       │  │
│  │    (JWT)    │  │ Subscriptions│  │   (Row Level Security) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | ^18.3.1 |
| Build Tool | Vite | Latest |
| Linguagem | TypeScript | Latest |
| Estilos | Tailwind CSS | Latest |
| UI Components | shadcn/ui | Latest |
| Estado | TanStack React Query | ^5.83.0 |
| Backend | Supabase (PostgreSQL) | Latest |
| Autenticação | Supabase Auth (JWT) | Latest |
| PDF | jsPDF + jspdf-autotable | ^3.0.4 |
| Gráficos | Recharts | ^2.15.4 |
| Validação | Zod | ^4.1.13 |

---

## Estrutura da Base de Dados

### Diagrama Entidade-Relacionamento

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │  user_roles  │     │    alunos    │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │◄────│ user_id (FK) │     │ id (PK)      │
│ nome_completo│     │ role (enum)  │     │ user_id (FK) │────►profiles
│ email        │     └──────────────┘     │ turma_id(FK) │────►turmas
│ bi           │                          │ estado       │
│ telefone     │◄─────────────────────────│ numero_mat.  │
│ endereco     │                          └──────────────┘
│ data_nasc.   │                                 │
└──────────────┘                                 │
       ▲                                         ▼
       │                                  ┌──────────────┐
       │                                  │  matriculas  │
┌──────────────┐                          │──────────────│
│  professores │                          │ id (PK)      │
│──────────────│                          │ aluno_id(FK) │
│ id (PK)      │                          │ turma_id(FK) │
│ user_id (FK) │────►profiles             │ ano_lect.(FK)│
│ num_func.    │                          │ status       │
│ habilitacao  │                          └──────────────┘
│ especialidade│
└──────────────┘
       │
       ▼
┌───────────────────┐     ┌──────────────┐     ┌──────────────┐
│professor_discipl. │     │    turmas    │     │ anos_lectivos│
│───────────────────│     │──────────────│     │──────────────│
│ id (PK)           │     │ id (PK)      │     │ id (PK)      │
│ professor_id (FK) │     │ nome         │     │ ano          │
│ disciplina_id(FK) │────►│ classe       │────►│ activo       │
│ turma_id (FK)     │────►│ capacidade   │     │ data_inicio  │
│ ano_lectivo_id(FK)│────►│ ano_lect.(FK)│     │ data_fim     │
└───────────────────┘     └──────────────┘     └──────────────┘
                                 │
                                 ▼
┌──────────────┐          ┌──────────────┐
│    notas     │          │ disciplinas  │
│──────────────│          │──────────────│
│ id (PK)      │          │ id (PK)      │
│ aluno_id(FK) │          │ nome         │
│ disciplina_id│────►     │ codigo       │
│ ano_lect.(FK)│          │ classe       │
│ trimestre    │          │ carga_horaria│
│ nota_as1/2/3 │          └──────────────┘
│ nota_at      │
│ media_trim.  │
└──────────────┘
```

---

## Tabelas e Campos

### profiles
Armazena informações pessoais de todos os utilizadores.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | - | PK, referência auth.users |
| nome_completo | text | No | - | Nome completo do utilizador |
| email | text | Yes | - | Email do utilizador |
| bi | text | Yes | - | Bilhete de Identidade |
| telefone | text | Yes | - | Número de telefone |
| endereco | text | Yes | - | Endereço completo |
| data_nascimento | date | Yes | - | Data de nascimento |
| created_at | timestamptz | Yes | now() | Data de criação |
| updated_at | timestamptz | Yes | now() | Última actualização |

### user_roles
Armazena os perfis/roles atribuídos aos utilizadores.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → auth.users |
| role | app_role | No | - | Enum do perfil |
| created_at | timestamptz | Yes | now() | Data de criação |

**Constraint Único**: (user_id, role)

### alunos
Registo de alunos matriculados.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → profiles (UNIQUE) |
| turma_id | uuid | Yes | - | FK → turmas |
| numero_matricula | text | No | - | Número único de matrícula |
| estado | text | Yes | 'activo' | Estado do aluno |
| encarregado_nome | text | No | - | Nome do encarregado |
| encarregado_telefone | text | No | - | Telefone do encarregado |
| encarregado_parentesco | text | Yes | - | Parentesco com aluno |
| data_matricula | date | Yes | CURRENT_DATE | Data da matrícula |
| created_at | timestamptz | Yes | now() | Data de criação |

**Check Constraint**: estado IN ('activo', 'transferido', 'concluido', 'desistente')

### professores
Registo de professores.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → profiles (UNIQUE) |
| numero_funcionario | text | No | - | Número do funcionário |
| habilitacao | text | No | - | Habilitação académica |
| especialidade | text | Yes | - | Área de especialidade |
| categoria | text | Yes | - | Categoria profissional |
| data_admissao | date | Yes | - | Data de admissão |
| created_at | timestamptz | Yes | now() | Data de criação |

### funcionarios
Registo de funcionários administrativos.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → profiles |
| numero_funcionario | text | No | - | Número do funcionário |
| cargo | text | No | - | Cargo ocupado |
| departamento | text | Yes | - | Departamento |
| data_admissao | date | Yes | - | Data de admissão |
| created_at | timestamptz | Yes | now() | Data de criação |

### turmas
Classes/turmas disponíveis.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| nome | text | No | - | Nome da turma (ex: "A", "B") |
| classe | integer | No | - | Classe (7-12) |
| capacidade | integer | Yes | 40 | Capacidade máxima |
| ano_lectivo_id | uuid | No | - | FK → anos_lectivos |
| created_at | timestamptz | Yes | now() | Data de criação |

**Check Constraint**: classe BETWEEN 7 AND 12, capacidade > 0

### disciplinas
Disciplinas curriculares.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| nome | text | No | - | Nome da disciplina |
| codigo | text | No | - | Código único |
| classe | integer | No | - | Classe (7-12) |
| carga_horaria | integer | Yes | - | Horas semanais |
| descricao | text | Yes | - | Descrição |
| created_at | timestamptz | Yes | now() | Data de criação |

### anos_lectivos
Anos lectivos configurados.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| ano | text | No | - | Ano (ex: "2024/2025") |
| data_inicio | date | No | - | Data de início |
| data_fim | date | No | - | Data de fim |
| activo | boolean | Yes | true | Ano lectivo activo |
| created_at | timestamptz | Yes | now() | Data de criação |

### professor_disciplinas
Atribuição de disciplinas a professores.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| professor_id | uuid | No | - | FK → professores |
| disciplina_id | uuid | No | - | FK → disciplinas |
| turma_id | uuid | No | - | FK → turmas |
| ano_lectivo_id | uuid | No | - | FK → anos_lectivos |
| created_at | timestamptz | Yes | now() | Data de criação |

**Constraint Único**: (professor_id, disciplina_id, turma_id, ano_lectivo_id)

### notas
Notas dos alunos por disciplina e trimestre.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| aluno_id | uuid | No | - | FK → alunos |
| disciplina_id | uuid | No | - | FK → disciplinas |
| ano_lectivo_id | uuid | No | - | FK → anos_lectivos |
| trimestre | integer | No | - | Trimestre (1-3) |
| nota_as1 | numeric | Yes | - | Avaliação Sistemática 1 |
| nota_as2 | numeric | Yes | - | Avaliação Sistemática 2 |
| nota_as3 | numeric | Yes | - | Avaliação Sistemática 3 |
| media_as | numeric | Yes | - | Média das AS |
| nota_at | numeric | Yes | - | Avaliação Trimestral |
| media_trimestral | numeric | Yes | - | Média do Trimestre |
| observacoes | text | Yes | - | Observações |
| lancado_por | uuid | Yes | - | FK → profiles |
| lancado_em | timestamptz | Yes | now() | Data de lançamento |
| created_at | timestamptz | Yes | now() | Data de criação |

**Constraint Único**: (aluno_id, disciplina_id, trimestre, ano_lectivo_id)
**Check Constraints**: trimestre BETWEEN 1 AND 3, notas BETWEEN 0 AND 20

### matriculas
Matrículas por ano lectivo.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| aluno_id | uuid | No | - | FK → alunos |
| ano_lectivo_id | uuid | No | - | FK → anos_lectivos |
| turma_id | uuid | Yes | - | FK → turmas |
| data_matricula | date | No | CURRENT_DATE | Data da matrícula |
| status | text | Yes | 'pendente' | Status da matrícula |
| estado | text | Yes | 'activo' | Estado do registo |
| observacoes | text | Yes | - | Observações |
| created_at | timestamptz | Yes | now() | Data de criação |

**Constraint Único**: (aluno_id, ano_lectivo_id)

### exames
Exames nacionais/provinciais.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| aluno_id | uuid | No | - | FK → alunos |
| disciplina_id | uuid | No | - | FK → disciplinas |
| ano_lectivo_id | uuid | No | - | FK → anos_lectivos |
| classe | integer | No | - | Classe (9, 10, 12) |
| tipo_exame | text | No | - | Tipo do exame |
| nota_exame | numeric | Yes | - | Nota obtida |
| nota_final | numeric | Yes | - | Nota final |
| data_exame | date | Yes | - | Data do exame |
| local_exame | text | Yes | - | Local de realização |
| numero_pauta | text | Yes | - | Número da pauta |
| estado | text | Yes | 'agendado' | Estado do exame |
| observacoes | text | Yes | - | Observações |
| lancado_por | uuid | Yes | - | FK → profiles |
| lancado_em | timestamptz | Yes | now() | Data de lançamento |
| created_at | timestamptz | Yes | now() | Data de criação |

### financas
Transacções financeiras.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| tipo | tipo_transacao | No | - | Entrada ou Saída |
| categoria | categoria_financeira | No | - | Categoria |
| descricao | text | No | - | Descrição |
| valor | numeric | No | - | Valor em MZN |
| data_transacao | date | Yes | CURRENT_DATE | Data |
| aluno_id | uuid | Yes | - | FK → alunos (se propina) |
| registado_por | uuid | No | - | FK → profiles |
| comprovante | text | Yes | - | URL do comprovante |
| created_at | timestamptz | Yes | now() | Data de criação |

**Check Constraint**: valor > 0

### inventario
Gestão de inventário escolar.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| nome | text | No | - | Nome do item |
| categoria | text | No | - | Categoria |
| quantidade | integer | No | 0 | Quantidade em stock |
| estado | text | Yes | 'bom' | Estado de conservação |
| localizacao | text | Yes | - | Localização |
| valor_unitario | numeric | Yes | - | Valor unitário |
| data_aquisicao | date | Yes | - | Data de aquisição |
| responsavel_id | uuid | Yes | - | FK → profiles |
| descricao | text | Yes | - | Descrição |
| created_at | timestamptz | Yes | now() | Data de criação |
| updated_at | timestamptz | Yes | now() | Última actualização |

**Check Constraint**: quantidade >= 0

### documentos
Documentos gerados (boletins, declarações).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| titulo | text | No | - | Título do documento |
| tipo | text | No | - | Tipo de documento |
| descricao | text | Yes | - | Descrição |
| url_ficheiro | text | Yes | - | URL do ficheiro |
| aluno_id | uuid | Yes | - | FK → alunos |
| user_id | uuid | Yes | - | FK → profiles |
| gerado_por | uuid | Yes | - | FK → profiles |
| data_geracao | date | Yes | CURRENT_DATE | Data de geração |
| created_at | timestamptz | Yes | now() | Data de criação |

### notificacoes
Notificações em tempo real.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | No | - | FK → profiles |
| titulo | text | No | - | Título |
| mensagem | text | No | - | Mensagem |
| tipo | text | No | 'info' | Tipo (info, nota, erro) |
| link | text | Yes | - | Link de navegação |
| lida | boolean | No | false | Se foi lida |
| created_at | timestamptz | No | now() | Data de criação |

### audit_logs
Logs de auditoria para rastreabilidade.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| user_id | uuid | Yes | - | Utilizador que fez a acção |
| action | text | No | - | Acção (INSERT, UPDATE, DELETE) |
| table_name | text | No | - | Tabela afectada |
| record_id | text | Yes | - | ID do registo |
| old_values | jsonb | Yes | - | Valores anteriores |
| new_values | jsonb | Yes | - | Novos valores |
| ip_address | text | Yes | - | Endereço IP |
| user_agent | text | Yes | - | User Agent |
| timestamp | timestamptz | No | now() | Momento da acção |

### organograma
Estrutura organizacional da escola.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| id | uuid | No | gen_random_uuid() | PK |
| nome | text | No | - | Nome do membro |
| cargo | text | No | - | Cargo ocupado |
| foto_url | text | Yes | - | URL da foto |
| ordem | integer | No | 0 | Ordem de exibição |
| created_at | timestamptz | Yes | now() | Data de criação |
| updated_at | timestamptz | Yes | now() | Última actualização |

---

## Enumerações (Enums)

### app_role
Perfis de utilizador disponíveis.

```sql
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'professor',
  'aluno',
  'secretario',
  'tesoureiro',
  'funcionario'
);
```

### tipo_transacao
Tipos de transacção financeira.

```sql
CREATE TYPE public.tipo_transacao AS ENUM (
  'entrada',
  'saida'
);
```

### categoria_financeira
Categorias de transacções financeiras.

```sql
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

---

## Funções de Base de Dados

### has_role(user_id, role)
Verifica se um utilizador possui um determinado perfil.

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### gerar_numero_matricula()
Gera número de matrícula sequencial (M0001, M0002...).

```sql
CREATE FUNCTION public.gerar_numero_matricula()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public';
```

### calcular_media_anual(aluno_id, disciplina_id, ano_lectivo_id)
Calcula a média anual de um aluno numa disciplina.

```sql
CREATE FUNCTION public.calcular_media_anual(
  p_aluno_id uuid,
  p_disciplina_id uuid,
  p_ano_lectivo_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER;
```

### get_school_statistics()
Retorna estatísticas gerais da escola em formato JSON.

### get_financial_summary()
Retorna resumo financeiro (entradas, saídas, saldo).

### get_monthly_financial_evolution()
Retorna evolução financeira mensal dos últimos 12 meses.

---

## Políticas de Segurança (RLS)

### Princípios Gerais

1. **Autenticação Obrigatória**: Todas as tabelas sensíveis exigem `auth.uid() IS NOT NULL`
2. **Isolamento de Dados**: Utilizadores só acedem aos próprios dados
3. **Perfis Privilegiados**: Admin tem acesso total, outros perfis têm acesso restrito
4. **Security Definer**: Funções críticas executam com privilégios do owner

### Padrão de Políticas

```sql
-- Política base de autenticação
CREATE POLICY "Require authentication"
ON public.tabela
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Política de auto-acesso
CREATE POLICY "Users can view own data"
ON public.tabela
FOR SELECT
USING (auth.uid() = user_id);

-- Política de admin
CREATE POLICY "Admins can manage all"
ON public.tabela
FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

### Matriz de Permissões

| Tabela | Admin | Professor | Aluno | Funcionário | Secretário |
|--------|-------|-----------|-------|-------------|------------|
| profiles | CRUD | R (turmas) | R (próprio) | R (alunos) | R (operac.) |
| alunos | CRUD | R (turmas) | R (próprio) | R | CRUD |
| notas | CRUD | CRU (turmas) | R (próprio) | - | - |
| matriculas | CRUD | - | R (próprio) | CRUD | CRUD |
| financas | CRUD | - | - | - | - |
| turmas | CRUD | R | R | CRUD | CRUD |
| inventario | CRUD | R | R | CRUD | - |

---

## Edge Functions

### delete-user
Elimina utilizador da tabela auth.users usando service role key.

**Endpoint**: `/functions/v1/delete-user`
**Método**: POST
**Body**: `{ "userId": "uuid" }`

### send-grade-notification
Envia email de notificação quando notas são lançadas.

**Endpoint**: `/functions/v1/send-grade-notification`
**Trigger**: Automático via trigger `notify_student_grade_posted`

### send-enrollment-notification
Envia email quando status de matrícula é actualizado.

**Endpoint**: `/functions/v1/send-enrollment-notification`
**Trigger**: Automático via trigger `notify_student_enrollment_status`

---

## Padrões de Código

### Estrutura de Directórios

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── dashboards/      # Dashboards por perfil
│   └── ...              # Outros componentes
├── hooks/
│   ├── useAuth.tsx      # Autenticação e perfis
│   ├── useNotifications.tsx
│   └── ...
├── pages/
│   ├── administrativo/  # Páginas administrativas
│   ├── pedagogico/      # Páginas pedagógicas
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts    # Cliente Supabase (auto-gerado)
│       └── types.ts     # Tipos TypeScript (auto-gerado)
└── utils/
    ├── generateBoletimPDF.ts
    └── generateFinancialReportPDF.ts
```

### Padrão de Query Supabase

```typescript
// Sempre especificar foreign keys explicitamente
const { data, error } = await supabase
  .from('alunos')
  .select(`
    *,
    profiles!user_id (nome_completo, email),
    turmas!turma_id (nome, classe)
  `)
  .eq('estado', 'activo');

// Usar .maybeSingle() em vez de .single() quando o resultado pode ser nulo
const { data: aluno } = await supabase
  .from('alunos')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();
```

### Validação com Zod

```typescript
import { z } from 'zod';

const alunoSchema = z.object({
  nome_completo: z.string().min(3).max(100),
  email: z.string().email(),
  estado: z.enum(['activo', 'transferido', 'concluido', 'desistente']),
});

type AlunoFormData = z.infer<typeof alunoSchema>;
```

### Padrão de Componente de Página

```typescript
const MinhaPage = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin" />
    </div>;
  }

  // Verificação de role
  if (!['admin', 'funcionario'].includes(userRole || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>...</Layout>;
};
```

---

## Storage Buckets

| Bucket | Público | Descrição |
|--------|---------|-----------|
| organograma | Sim | Fotos do organograma |

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

---

## Contacto

Desenvolvido por [Clands](https://github.com/DaVitoria)
