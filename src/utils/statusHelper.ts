// Classes com exame nacional: 9ª, 10ª e 12ª
export const CLASSES_COM_EXAME = [9, 10, 12];

export const hasExame = (classe: number): boolean => {
  return CLASSES_COM_EXAME.includes(classe);
};

/**
 * Determina o status do aluno baseado na média e na classe
 * @param media - Média do aluno
 * @param classe - Classe/série do aluno
 * @returns Status: 'aprovado', 'reprovado', 'exame', 'progride', 'retido'
 */
export const getAlunoStatus = (
  media: number,
  classe: number
): 'aprovado' | 'reprovado' | 'exame' | 'progride' | 'retido' => {
  if (media >= 10) return 'aprovado';
  if (media < 7) return 'reprovado';
  
  // Média entre 7 e 10 - depende se a classe tem exame
  if (hasExame(classe)) {
    return 'exame';
  } else {
    // Para classes sem exame, média >= 7 e < 10 pode significar "progride" ou "retido"
    // Geralmente >= 7 progride
    return media >= 7 ? 'progride' : 'retido';
  }
};

/**
 * Retorna o label do status para exibição
 */
export const getStatusLabel = (
  status: string,
  classe?: number
): string => {
  switch (status) {
    case 'aprovado':
      return 'Aprovado';
    case 'reprovado':
      return 'Reprovado';
    case 'exame':
      return 'Em Exame';
    case 'em_exame':
      return 'Em Exame';
    case 'progride':
      return 'Progride';
    case 'retido':
      return 'Retido';
    case 'pendente':
      return 'Pendente';
    case 'em_curso':
      return 'Em Curso';
    default:
      return status;
  }
};

/**
 * Retorna as cores associadas ao status
 */
export const getStatusColors = (status: string): { 
  text: string; 
  bg: string; 
  badge: string;
} => {
  switch (status) {
    case 'aprovado':
      return { text: 'text-green-600', bg: 'bg-green-100', badge: 'bg-green-600' };
    case 'reprovado':
    case 'retido':
      return { text: 'text-red-600', bg: 'bg-red-100', badge: 'bg-red-600' };
    case 'exame':
    case 'em_exame':
      return { text: 'text-amber-600', bg: 'bg-amber-100', badge: 'bg-amber-600' };
    case 'progride':
      return { text: 'text-blue-600', bg: 'bg-blue-100', badge: 'bg-blue-600' };
    case 'pendente':
    case 'em_curso':
      return { text: 'text-gray-600', bg: 'bg-gray-100', badge: 'bg-gray-600' };
    default:
      return { text: 'text-gray-600', bg: 'bg-gray-100', badge: 'bg-gray-600' };
  }
};
