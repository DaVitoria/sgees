-- Adicionar novos roles ao enum existente (deve ser feito em transação separada)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'funcionario') THEN
    ALTER TYPE app_role ADD VALUE 'funcionario';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'tesoureiro') THEN
    ALTER TYPE app_role ADD VALUE 'tesoureiro';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'secretario') THEN
    ALTER TYPE app_role ADD VALUE 'secretario';
  END IF;
END $$;