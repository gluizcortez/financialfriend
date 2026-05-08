// Domain types for FinancialFriend - Gestão Financeira
// All monetary values in centavos (cents as bigint-compatible numbers)

export type EntityId = string
export type MonthKey = string // "YYYY-MM"

// ── Workspace (maps to `households` table) ───────────────────────────────

export interface UserWorkspace {
  id: EntityId
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  userId: string
  fullName: string | null
  role: string
  joinedAt: string
}

export interface WorkspaceInvitation {
  id: EntityId
  householdId: EntityId
  invitedEmail: string
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined'
  token: string
  createdAt: string
  expiresAt: string
}

export interface AppNotification {
  id: EntityId
  userId: string
  type: 'workspace_invite'
  title: string
  body: string
  data: Record<string, unknown>
  isRead: boolean
  householdId: EntityId | null
  createdAt: string
}

// ── Bills ─────────────────────────────────────────────────────────────────

export interface Bill {
  id: EntityId
  householdId: EntityId
  name: string
  valueCents: number
  dueDay: number
  categoryId: EntityId | null
  notes: string
  isRecurring: boolean
  customFields: Record<string, string>
  createdAt: string
  updatedAt: string
}

export type BillStatus = 'pending' | 'paid' | 'overdue'

export interface Attachment {
  id: EntityId
  householdId: EntityId
  entityType: 'bill_entry' | 'investment_transaction'
  entityId: EntityId
  storagePath: string
  name: string
  sizeBytes: number
  uploadedAt: string
}

export interface BillEntry {
  id: EntityId
  monthlyRecordId: EntityId
  billId: EntityId | null
  householdId: EntityId
  name: string
  valueCents: number
  dueDate: string
  status: BillStatus
  paidDate?: string | null
  notes: string
  categoryId: EntityId | null
  customFields: Record<string, string>
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface MonthlyBillRecord {
  id: EntityId
  householdId: EntityId
  monthKey: MonthKey
  entries?: BillEntry[]
  createdAt: string
}

// ── Investments ───────────────────────────────────────────────────────────

export type InvestmentType = 'renda_fixa' | 'acoes' | 'fundo' | 'cripto' | 'outro'

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  renda_fixa: 'Renda Fixa',
  acoes: 'Ações',
  fundo: 'Fundo de Investimento',
  cripto: 'Criptomoedas',
  outro: 'Outro',
}

export interface Investment {
  id: EntityId
  householdId: EntityId
  name: string
  type: InvestmentType
  currentBalanceCents: number
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TransactionType = 'contribution' | 'withdrawal' | 'yield'

export interface InvestmentTransaction {
  id: EntityId
  investmentId: EntityId
  householdId: EntityId
  type: TransactionType
  amountCents: number
  monthKey: MonthKey
  date: string
  notes: string
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

// ── FGTS ──────────────────────────────────────────────────────────────────

export interface FGTSRecord {
  id: EntityId
  householdId: EntityId
  monthKey: MonthKey
  balanceCents: number
  notes: string
  date: string
  createdAt: string
  updatedAt: string
}

// ── Goals ─────────────────────────────────────────────────────────────────

export type Periodicity = 'monthly' | 'quarterly' | 'semiannual' | 'yearly' | 'custom'

export interface GoalContribution {
  id: EntityId
  goalId: EntityId
  householdId: EntityId
  periodKey: string
  targetAmountCents: number
  actualAmountCents: number
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type GoalType = 'manual' | 'investment_linked'

export interface Goal {
  id: EntityId
  householdId: EntityId
  name: string
  description: string
  goalType: GoalType
  targetAmountCents: number
  periodicity: Periodicity
  customPeriodDays?: number | null
  startDate: string
  endDate?: string | null
  linkedInvestmentIds: EntityId[]
  contributions?: GoalContribution[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ── Income ────────────────────────────────────────────────────────────────

export type IncomeCategory = 'salary' | 'freelance' | 'investments' | 'bonus' | 'other'

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  investments: 'Rendimentos',
  bonus: 'Bônus',
  other: 'Outros',
}

export interface IncomeEntry {
  id: EntityId
  householdId: EntityId
  monthKey: MonthKey
  name: string
  amountCents: number
  category: IncomeCategory
  date: string
  notes: string
  isRecurring: boolean
  createdAt: string
  updatedAt: string
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface Category {
  id: EntityId
  householdId: EntityId
  name: string
  color: string
  icon?: string | null
  type: 'bill' | 'investment' | 'both'
  isDefault: boolean
  sortOrder: number
  budgetCents?: number | null
  createdAt: string
  updatedAt: string
}

export interface CustomField {
  id: EntityId
  householdId: EntityId
  name: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[] | null
  appliesTo: 'bills' | 'investments' | 'both'
  createdAt: string
}

export type AppTheme = 'light' | 'dark'
