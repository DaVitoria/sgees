export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          created_at: string | null
          data_matricula: string | null
          encarregado_nome: string
          encarregado_parentesco: string | null
          encarregado_telefone: string
          estado: string | null
          id: string
          numero_matricula: string
          turma_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_matricula?: string | null
          encarregado_nome: string
          encarregado_parentesco?: string | null
          encarregado_telefone: string
          estado?: string | null
          id?: string
          numero_matricula: string
          turma_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_matricula?: string | null
          encarregado_nome?: string
          encarregado_parentesco?: string | null
          encarregado_telefone?: string
          estado?: string | null
          id?: string
          numero_matricula?: string
          turma_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_alunos_turma"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alunos_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anos_lectivos: {
        Row: {
          activo: boolean | null
          ano: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
        }
        Insert: {
          activo?: boolean | null
          ano: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
        }
        Update: {
          activo?: boolean | null
          ano?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      disciplinas: {
        Row: {
          carga_horaria: number | null
          classe: number
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          carga_horaria?: number | null
          classe: number
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          carga_horaria?: number | null
          classe?: number
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          aluno_id: string | null
          created_at: string | null
          data_geracao: string | null
          descricao: string | null
          gerado_por: string | null
          id: string
          tipo: string
          titulo: string
          url_ficheiro: string | null
          user_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          created_at?: string | null
          data_geracao?: string | null
          descricao?: string | null
          gerado_por?: string | null
          id?: string
          tipo: string
          titulo: string
          url_ficheiro?: string | null
          user_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          created_at?: string | null
          data_geracao?: string | null
          descricao?: string | null
          gerado_por?: string | null
          id?: string
          tipo?: string
          titulo?: string
          url_ficheiro?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_aluno_id"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_gerado_por"
            columns: ["gerado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financas: {
        Row: {
          aluno_id: string | null
          categoria: Database["public"]["Enums"]["categoria_financeira"]
          comprovante: string | null
          created_at: string | null
          data_transacao: string | null
          descricao: string
          id: string
          registado_por: string
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
        }
        Insert: {
          aluno_id?: string | null
          categoria: Database["public"]["Enums"]["categoria_financeira"]
          comprovante?: string | null
          created_at?: string | null
          data_transacao?: string | null
          descricao: string
          id?: string
          registado_por: string
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          valor: number
        }
        Update: {
          aluno_id?: string | null
          categoria?: Database["public"]["Enums"]["categoria_financeira"]
          comprovante?: string | null
          created_at?: string | null
          data_transacao?: string | null
          descricao?: string
          id?: string
          registado_por?: string
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financas_aluno_id"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financas_registado_por"
            columns: ["registado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          cargo: string
          created_at: string | null
          data_admissao: string | null
          departamento: string | null
          id: string
          numero_funcionario: string
          user_id: string
        }
        Insert: {
          cargo: string
          created_at?: string | null
          data_admissao?: string | null
          departamento?: string | null
          id?: string
          numero_funcionario: string
          user_id: string
        }
        Update: {
          cargo?: string
          created_at?: string | null
          data_admissao?: string | null
          departamento?: string | null
          id?: string
          numero_funcionario?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_funcionarios_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          categoria: string
          created_at: string | null
          data_aquisicao: string | null
          descricao: string | null
          estado: string | null
          id: string
          localizacao: string | null
          nome: string
          quantidade: number
          responsavel_id: string | null
          updated_at: string | null
          valor_unitario: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          quantidade?: number
          responsavel_id?: string | null
          updated_at?: string | null
          valor_unitario?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          quantidade?: number
          responsavel_id?: string | null
          updated_at?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventario_responsavel_id"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string
          ano_lectivo_id: string
          created_at: string | null
          data_matricula: string
          estado: string | null
          id: string
          observacoes: string | null
          turma_id: string | null
        }
        Insert: {
          aluno_id: string
          ano_lectivo_id: string
          created_at?: string | null
          data_matricula?: string
          estado?: string | null
          id?: string
          observacoes?: string | null
          turma_id?: string | null
        }
        Update: {
          aluno_id?: string
          ano_lectivo_id?: string
          created_at?: string | null
          data_matricula?: string
          estado?: string | null
          id?: string
          observacoes?: string | null
          turma_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_matriculas_aluno_id"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_matriculas_ano_lectivo_id"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_matriculas_turma_id"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_ano_lectivo_id_fkey"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          aluno_id: string
          ano_lectivo_id: string
          created_at: string | null
          disciplina_id: string
          id: string
          lancado_em: string | null
          lancado_por: string | null
          media_as: number | null
          media_trimestral: number | null
          nota_as1: number | null
          nota_as2: number | null
          nota_as3: number | null
          nota_at: number | null
          observacoes: string | null
          trimestre: number
        }
        Insert: {
          aluno_id: string
          ano_lectivo_id: string
          created_at?: string | null
          disciplina_id: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          media_as?: number | null
          media_trimestral?: number | null
          nota_as1?: number | null
          nota_as2?: number | null
          nota_as3?: number | null
          nota_at?: number | null
          observacoes?: string | null
          trimestre: number
        }
        Update: {
          aluno_id?: string
          ano_lectivo_id?: string
          created_at?: string | null
          disciplina_id?: string
          id?: string
          lancado_em?: string | null
          lancado_por?: string | null
          media_as?: number | null
          media_trimestral?: number | null
          nota_as1?: number | null
          nota_as2?: number | null
          nota_as3?: number | null
          nota_at?: number | null
          observacoes?: string | null
          trimestre?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_notas_aluno"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notas_ano_lectivo"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notas_disciplina"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notas_lancado_por"
            columns: ["lancado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string | null
          data_publicacao: string | null
          id: string
          imagem_url: string | null
          publicado: boolean | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string | null
          data_publicacao?: string | null
          id?: string
          imagem_url?: string | null
          publicado?: boolean | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_noticias_autor_id"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      organograma: {
        Row: {
          cargo: string
          created_at: string | null
          foto_url: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string | null
        }
        Insert: {
          cargo: string
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      professor_disciplinas: {
        Row: {
          ano_lectivo_id: string
          created_at: string | null
          disciplina_id: string
          id: string
          professor_id: string
          turma_id: string
        }
        Insert: {
          ano_lectivo_id: string
          created_at?: string | null
          disciplina_id: string
          id?: string
          professor_id: string
          turma_id: string
        }
        Update: {
          ano_lectivo_id?: string
          created_at?: string | null
          disciplina_id?: string
          id?: string
          professor_id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_professor_disciplinas_ano_lectivo"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professor_disciplinas_disciplina"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professor_disciplinas_professor"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professor_disciplinas_turma"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_disciplinas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_admissao: string | null
          especialidade: string | null
          habilitacao: string
          id: string
          numero_funcionario: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_admissao?: string | null
          especialidade?: string | null
          habilitacao: string
          id?: string
          numero_funcionario: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_admissao?: string | null
          especialidade?: string | null
          habilitacao?: string
          id?: string
          numero_funcionario?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_professores_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bi: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bi?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bi?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relatorios: {
        Row: {
          conteudo: Json | null
          created_at: string | null
          descricao: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          conteudo?: Json | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          conteudo?: Json | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_relatorios_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ano_lectivo_id: string
          capacidade: number | null
          classe: number
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          ano_lectivo_id: string
          capacidade?: number | null
          classe: number
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          ano_lectivo_id?: string
          capacidade?: number | null
          classe?: number
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_turmas_ano_lectivo_id"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_ano_lectivo_id_fkey"
            columns: ["ano_lectivo_id"]
            isOneToOne: false
            referencedRelation: "anos_lectivos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_role: {
        Args: {
          target_email: string
          target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      assign_admin_role_by_email: {
        Args: { admin_email: string }
        Returns: undefined
      }
      calcular_media_anual: {
        Args: {
          p_aluno_id: string
          p_ano_lectivo_id: string
          p_disciplina_id: string
        }
        Returns: number
      }
      get_financial_summary: { Args: never; Returns: Json }
      get_monthly_financial_evolution: { Args: never; Returns: Json }
      get_organizational_structure: { Args: never; Returns: Json }
      get_profiles_with_audit: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          bi: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_school_statistics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "professor"
        | "aluno"
        | "secretario"
        | "tesoureiro"
        | "funcionario"
      categoria_financeira:
        | "matricula"
        | "mensalidade"
        | "contribuicao"
        | "servicos"
        | "producao_escolar"
        | "manutencao"
        | "materiais"
        | "eventos"
        | "pagamentos"
        | "outros"
      tipo_transacao: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "professor",
        "aluno",
        "secretario",
        "tesoureiro",
        "funcionario",
      ],
      categoria_financeira: [
        "matricula",
        "mensalidade",
        "contribuicao",
        "servicos",
        "producao_escolar",
        "manutencao",
        "materiais",
        "eventos",
        "pagamentos",
        "outros",
      ],
      tipo_transacao: ["entrada", "saida"],
    },
  },
} as const
