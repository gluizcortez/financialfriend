export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const PERIODICITY_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  yearly: 'Anual',
  custom: 'Personalizado',
}

export const BILL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
}

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  investments: 'Rendimentos',
  bonus: 'Bônus',
  other: 'Outros',
}

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  renda_fixa: 'Renda Fixa',
  acoes: 'Ações',
  fundo: 'Fundo de Investimento',
  cripto: 'Criptomoedas',
  outro: 'Outro',
}

export const WORKSPACE_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981',
  '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899',
  '#8b5cf6', '#a855f7',
]

export const DEFAULT_CATEGORY_SEEDS = [
  { name: 'Moradia', color: '#6366f1', type: 'bill' as const, sort_order: 0 },
  { name: 'Transporte', color: '#f59e0b', type: 'bill' as const, sort_order: 1 },
  { name: 'Alimentação', color: '#10b981', type: 'bill' as const, sort_order: 2 },
  { name: 'Saúde', color: '#ef4444', type: 'bill' as const, sort_order: 3 },
  { name: 'Educação', color: '#3b82f6', type: 'bill' as const, sort_order: 4 },
  { name: 'Lazer', color: '#8b5cf6', type: 'bill' as const, sort_order: 5 },
  { name: 'Serviços', color: '#06b6d4', type: 'bill' as const, sort_order: 6 },
  { name: 'Seguros', color: '#84cc16', type: 'bill' as const, sort_order: 7 },
  { name: 'Outros', color: '#737373', type: 'both' as const, sort_order: 8 },
  { name: 'Renda Fixa', color: '#0ea5e9', type: 'investment' as const, sort_order: 9 },
  { name: 'Renda Variável', color: '#f97316', type: 'investment' as const, sort_order: 10 },
  { name: 'Criptomoedas', color: '#a855f7', type: 'investment' as const, sort_order: 11 },
]
