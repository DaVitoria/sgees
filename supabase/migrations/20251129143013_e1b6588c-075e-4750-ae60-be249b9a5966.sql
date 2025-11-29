-- Create a function to get monthly financial evolution (last 12 months)
CREATE OR REPLACE FUNCTION public.get_monthly_financial_evolution()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'mes', TO_CHAR(mes, 'Mon'),
        'mes_ano', TO_CHAR(mes, 'MM/YYYY'),
        'entradas', COALESCE(entradas, 0),
        'saidas', COALESCE(saidas, 0),
        'saldo', COALESCE(entradas, 0) - COALESCE(saidas, 0)
      ) ORDER BY mes
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT 
      date_trunc('month', g.mes) as mes,
      (SELECT SUM(valor) FROM financas WHERE tipo = 'entrada' AND date_trunc('month', data_transacao) = date_trunc('month', g.mes)) as entradas,
      (SELECT SUM(valor) FROM financas WHERE tipo = 'saida' AND date_trunc('month', data_transacao) = date_trunc('month', g.mes)) as saidas
    FROM generate_series(
      date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
      date_trunc('month', CURRENT_DATE),
      '1 month'::interval
    ) as g(mes)
  ) sub
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_monthly_financial_evolution() TO anon, authenticated;