# Sistema de Gestão Escolar - Moçambique

## Descrição do Projeto

Sistema de Gestão Escolar completo desenvolvido para escolas secundárias em Moçambique (7ª à 12ª classe), abrangendo a área administrativa e pedagógica.
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
| RNF09 | **Tratamento de Erros**: Mensagens de erro genéricas para utilizadores, sem expor detalhes internos |

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
- Função de Director de Turma (quando atribuído)

### 3. Aluno
- Visualização das próprias notas e situação pedagógica
- Submissão de matrícula online
- Acompanhamento do estado da matrícula
- Download de boletins e documentos
- Visualização e registo de pagamentos

### 4. Funcionário/Secretário
- Gestão de matrículas (aprovação/rejeição)
- Gestão de alunos e professores
- Gestão de turmas e horários
- Controlo financeiro e inventário
- Emissão de documentos

### 5. Tesoureiro
- Gestão financeira completa
- Registo de entradas e saídas
- Confirmação de pagamentos
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
- ✅ Confirmação de Pagamentos
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
- ✅ Gestão de Anos Lectivos
- ✅ Gestão de Trimestres
- ✅ Gestão de Disciplinas

### Portal do Aluno
- ✅ Dashboard Personalizado
- ✅ Visualização de Notas
- ✅ Situação Pedagógica
- ✅ Acompanhamento de Matrícula
- ✅ Download de Documentos
- ✅ Notificações em Tempo Real
- ✅ Registo de Pagamentos

### Director de Turma
- ✅ Painel Dedicado
- ✅ Visão Geral da Turma
- ✅ Relatórios de Aproveitamento

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Descrição |
|------------|-----------|
| React 18 | Biblioteca de UI |
| TypeScript | Tipagem estática |
| Vite | Build tool |
| Tailwind CSS | Estilização |
| shadcn/ui | Componentes UI |
| TanStack Query | Gestão de estado servidor |
| React Router | Navegação |
| Recharts | Gráficos e visualizações |
| jsPDF | Geração de PDFs |
| Zod | Validação de formulários |

### Backend (Lovable Cloud)
| Componente | Descrição |
|------------|-----------|
| PostgreSQL | Base de dados relacional |
| Auth (JWT) | Autenticação segura |
| Storage | Armazenamento de ficheiros |
| Edge Functions | Funções serverless |
| RLS | Políticas de segurança a nível de linha |
| Realtime | Subscrições em tempo real |

### Mobile (Capacitor)
| Tecnologia | Descrição |
|------------|-----------|
| Capacitor | Bridge nativo |
| Android | Plataforma móvel |
| Filesystem | Acesso a ficheiros |
| Share | Partilha de conteúdo |

---

## Arquitectura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + TypeScript + Vite + Tailwind CSS + shadcn/ui           │
│  Capacitor (Android/iOS)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOVABLE CLOUD                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PostgreSQL │  │   Storage   │  │    Edge Functions       │  │
│  │  Database   │  │   Buckets   │  │  (Deno/TypeScript)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │     Auth    │  │  Realtime   │  │      RLS Policies       │  │
│  │    (JWT)    │  │ Subscriptions│  │   (Row Level Security) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Segurança

### Autenticação e Autorização
- Autenticação via JWT com validação de email
- Roles armazenados em tabela separada (`user_roles`)
- Função `has_role()` com SECURITY DEFINER para evitar RLS recursivo

### Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado
- Políticas exigem autenticação explícita (`auth.uid() IS NOT NULL`)
- Professores só acedem a notas das turmas/disciplinas atribuídas
- Alunos só vêem os próprios dados

### Tratamento de Erros
- Sistema centralizado de mapeamento de erros (`src/utils/errorHandler.ts`)
- Erros técnicos mapeados para mensagens genéricas
- Códigos PostgreSQL não são expostos ao utilizador
- Logs detalhados apenas no console (desenvolvimento)

### Edge Functions
- Autenticação via header JWT
- Validação de permissões antes de executar operações
- Tratamento seguro de erros

---

## Como Executar o Projecto

### Pré-requisitos
- Node.js & npm instalados - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

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

### Build para Produção

```sh
# Criar build de produção
npm run build

# Preview local do build
npm run preview
```

### Build Android

```sh
# Sincronizar com Capacitor
npx cap sync android

# Abrir no Android Studio
npx cap open android
```

---

## Estrutura de Directórios

```
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── dashboards/      # Dashboards por role
│   │   ├── aluno/           # Componentes do portal aluno
│   │   ├── financeiro/      # Componentes financeiros
│   │   ├── Layout.tsx       # Layout principal
│   │   ├── Footer.tsx       # Rodapé
│   │   └── NotificationBell.tsx
│   ├── pages/
│   │   ├── administrativo/  # Páginas administrativas
│   │   ├── pedagogico/      # Páginas pedagógicas
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.tsx      # Autenticação e roles
│   │   ├── useNotifications.tsx
│   │   └── use-mobile.tsx
│   ├── utils/
│   │   ├── errorHandler.ts  # Tratamento de erros
│   │   ├── generateBoletimPDF.ts
│   │   ├── exportToExcel.ts
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Cliente (auto-gerado)
│   │       └── types.ts     # Tipos (auto-gerado)
│   └── lib/
│       └── utils.ts
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── delete-user/
│   │   ├── send-grade-notification/
│   │   └── send-enrollment-notification/
│   └── config.toml          # Configuração (auto-gerado)
├── android/                  # Projecto Android (Capacitor)
└── public/
    └── manifest.webmanifest  # PWA manifest
```

---

## Edge Functions

### delete-user
Elimina um utilizador do sistema (apenas admins).

### send-grade-notification
Envia notificação quando notas são lançadas ou actualizadas.
- Requer autenticação JWT
- Chamada automaticamente por triggers da base de dados

### send-enrollment-notification
Envia notificação sobre estado de matrícula.

---

## Arquivos Auto-Gerados (NÃO EDITAR)

| Arquivo | Descrição |
|---------|-----------|
| `src/integrations/supabase/client.ts` | Cliente Supabase |
| `src/integrations/supabase/types.ts` | Tipos TypeScript do schema |
| `supabase/config.toml` | Configuração Supabase |
| `.env` | Variáveis de ambiente |

---

## Variáveis de Ambiente

O ficheiro `.env` é gerido automaticamente pelo Lovable Cloud:

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

---

## Publicação

1. Aceda ao [Editor Lovable](https://lovable.dev/projects/0c5ea40d-018a-48c8-81ae-5f3fea4b0b0f)
2. Clique em **Share** → **Publish**
3. A aplicação será publicada em https://sgees.lovable.app

---

## Conectar Domínio Personalizado

1. Navegue até **Project** → **Settings** → **Domains**
2. Clique em **Connect Domain**
3. Siga as instruções para configurar DNS

---

## Autores

Desenvolvido por [Clands](https://github.com/DaVitoria)

---

## Licença

Este projecto é propriedade privada e destina-se a fins educacionais.
