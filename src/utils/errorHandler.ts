/**
 * Error Handler Utility
 * Maps database and API errors to user-friendly messages
 * Prevents information leakage by not exposing technical details
 */

interface DatabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Maps database errors to user-friendly Portuguese messages.
 * Logs full error details for debugging but returns safe messages for UI.
 * 
 * @param error - The error object from Supabase/PostgreSQL
 * @returns A user-friendly error message
 */
export const mapDatabaseError = (error: DatabaseError | any): string => {
  if (!error) return 'Ocorreu um erro desconhecido';
  
  // Log full error to console for debugging (in development only)
  if (import.meta.env.DEV) {
    console.error('[DB Error]:', {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });
  }
  
  // PostgreSQL error codes mapping
  // See: https://www.postgresql.org/docs/current/errcodes-appendix.html
  
  // Class 23 — Integrity Constraint Violation
  if (error.code === '23505') {
    // Unique violation
    return 'Este registo já existe no sistema';
  }
  
  if (error.code === '23503') {
    // Foreign key violation
    return 'Não é possível eliminar devido a registos relacionados';
  }
  
  if (error.code === '23502') {
    // Not null violation
    return 'Campos obrigatórios não preenchidos';
  }
  
  if (error.code === '23514') {
    // Check constraint violation
    return 'Os dados fornecidos são inválidos';
  }
  
  // Class 42 — Syntax Error or Access Rule Violation
  if (error.code === '42501') {
    // Insufficient privilege
    return 'Não tem permissão para realizar esta operação';
  }
  
  if (error.code === '42P01') {
    // Undefined table
    return 'Erro de configuração do sistema';
  }
  
  // Class 22 — Data Exception
  if (error.code?.startsWith('22')) {
    return 'Formato de dados inválido';
  }
  
  // RLS policy violations (usually appear in message)
  if (error.message?.toLowerCase().includes('rls') || 
      error.message?.toLowerCase().includes('row-level security') ||
      error.message?.toLowerCase().includes('policy')) {
    return 'Acesso negado';
  }
  
  // Authentication/Authorization errors
  if (error.message?.toLowerCase().includes('jwt') ||
      error.message?.toLowerCase().includes('token') ||
      error.message?.toLowerCase().includes('unauthorized')) {
    return 'Sessão expirada. Por favor, faça login novamente';
  }
  
  // Email already registered
  if (error.message?.toLowerCase().includes('already registered')) {
    return 'Este email já está registado no sistema';
  }
  
  // Network/Connection errors
  if (error.message?.toLowerCase().includes('network') ||
      error.message?.toLowerCase().includes('fetch') ||
      error.message?.toLowerCase().includes('connection')) {
    return 'Erro de conexão. Verifique a sua ligação à internet';
  }
  
  // Generic fallback - never expose raw error message
  return 'Ocorreu um erro. Por favor, tente novamente';
};

/**
 * Maps storage errors to user-friendly messages
 */
export const mapStorageError = (error: any): string => {
  if (!error) return 'Ocorreu um erro no upload';
  
  if (import.meta.env.DEV) {
    console.error('[Storage Error]:', error);
  }
  
  if (error.message?.includes('size')) {
    return 'O ficheiro é demasiado grande';
  }
  
  if (error.message?.includes('type') || error.message?.includes('mime')) {
    return 'Tipo de ficheiro não permitido';
  }
  
  if (error.message?.includes('quota') || error.message?.includes('limit')) {
    return 'Limite de armazenamento atingido';
  }
  
  return 'Erro no upload do ficheiro. Por favor, tente novamente';
};

/**
 * Maps auth errors to user-friendly messages
 */
export const mapAuthError = (error: any): string => {
  if (!error) return 'Erro de autenticação';
  
  if (import.meta.env.DEV) {
    console.error('[Auth Error]:', error);
  }
  
  if (error.message?.toLowerCase().includes('invalid login')) {
    return 'Email ou senha incorretos';
  }
  
  if (error.message?.toLowerCase().includes('email not confirmed')) {
    return 'Por favor, confirme o seu email antes de fazer login';
  }
  
  if (error.message?.toLowerCase().includes('already registered')) {
    return 'Este email já está registado';
  }
  
  if (error.message?.toLowerCase().includes('password')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  
  if (error.message?.toLowerCase().includes('rate limit')) {
    return 'Demasiadas tentativas. Por favor, aguarde alguns minutos';
  }
  
  return 'Erro de autenticação. Por favor, tente novamente';
};
