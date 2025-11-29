-- Create a function to get public school statistics (accessible by anyone)
CREATE OR REPLACE FUNCTION public.get_school_statistics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_alunos', (SELECT COUNT(*) FROM alunos WHERE estado = 'activo'),
    'total_professores', (SELECT COUNT(*) FROM professores),
    'total_funcionarios', (SELECT COUNT(*) FROM funcionarios),
    'total_turmas', (SELECT COUNT(*) FROM turmas t JOIN anos_lectivos a ON t.ano_lectivo_id = a.id WHERE a.activo = true),
    'total_disciplinas', (SELECT COUNT(DISTINCT id) FROM disciplinas)
  )
$$;

-- Create a function to get public financial summary (only totals, no sensitive data)
CREATE OR REPLACE FUNCTION public.get_financial_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_entradas', COALESCE((SELECT SUM(valor) FROM financas WHERE tipo = 'entrada'), 0),
    'total_saidas', COALESCE((SELECT SUM(valor) FROM financas WHERE tipo = 'saida'), 0),
    'saldo_actual', COALESCE((SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) FROM financas), 0),
    'entradas_mes_actual', COALESCE((
      SELECT SUM(valor) FROM financas 
      WHERE tipo = 'entrada' 
      AND data_transacao >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'saidas_mes_actual', COALESCE((
      SELECT SUM(valor) FROM financas 
      WHERE tipo = 'saida' 
      AND data_transacao >= date_trunc('month', CURRENT_DATE)
    ), 0)
  )
$$;

-- Create a function to get organizational structure (public info)
CREATE OR REPLACE FUNCTION public.get_organizational_structure()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'direcao', jsonb_build_array(
      jsonb_build_object('cargo', 'Director Geral', 'departamento', 'Direcção'),
      jsonb_build_object('cargo', 'Director Pedagógico', 'departamento', 'Pedagógico'),
      jsonb_build_object('cargo', 'Director Administrativo', 'departamento', 'Administrativo')
    ),
    'departamentos', jsonb_build_array(
      jsonb_build_object(
        'nome', 'Pedagógico',
        'descricao', 'Coordenação de turmas, disciplinas e avaliações',
        'total_membros', (SELECT COUNT(*) FROM professores)
      ),
      jsonb_build_object(
        'nome', 'Administrativo',
        'descricao', 'Gestão de matrículas, documentos e secretaria',
        'total_membros', (SELECT COUNT(*) FROM funcionarios WHERE departamento = 'Administrativo' OR cargo ILIKE '%secretar%')
      ),
      jsonb_build_object(
        'nome', 'Financeiro',
        'descricao', 'Gestão de finanças, propinas e pagamentos',
        'total_membros', (SELECT COUNT(*) FROM funcionarios WHERE departamento = 'Financeiro' OR cargo ILIKE '%tesour%')
      ),
      jsonb_build_object(
        'nome', 'Apoio',
        'descricao', 'Serviços gerais, manutenção e logística',
        'total_membros', (SELECT COUNT(*) FROM funcionarios WHERE departamento NOT IN ('Administrativo', 'Financeiro') OR departamento IS NULL)
      )
    ),
    'turmas_por_classe', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'classe', classe,
          'total_turmas', total
        )
      )
      FROM (
        SELECT t.classe, COUNT(*) as total
        FROM turmas t
        JOIN anos_lectivos a ON t.ano_lectivo_id = a.id
        WHERE a.activo = true
        GROUP BY t.classe
        ORDER BY t.classe
      ) sub
    )
  )
$$;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_school_statistics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizational_structure() TO anon, authenticated;