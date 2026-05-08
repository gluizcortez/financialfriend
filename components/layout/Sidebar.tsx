'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Receipt, TrendingUp, Target, Wallet,
  DollarSign, PieChart, Settings, HelpCircle, ChevronLeft, ChevronRight, Layers,
} from 'lucide-react'
import { FinancialFriendLogo } from '@/components/logo/FinancialFriendLogo'
import { useUIStore } from '@/stores/useUIStore'
import { NotificationBell } from '@/components/notifications/NotificationBell'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão geral' },
  { href: '/bills', label: 'Contas Mensais', icon: Receipt, desc: 'Despesas mensais' },
  { href: '/income', label: 'Receitas', icon: DollarSign, desc: 'Entradas' },
  { href: '/investments', label: 'Investimentos', icon: TrendingUp, desc: 'Carteira' },
  { href: '/goals', label: 'Metas', icon: Target, desc: 'Objetivos financeiros' },
  { href: '/fgts', label: 'FGTS', icon: Wallet, desc: 'Fundo de garantia' },
  { href: '/networth', label: 'Patrimônio', icon: PieChart, desc: 'Ativos totais' },
  { href: '/workspaces', label: 'Workspaces', icon: Layers, desc: 'Seus espaços' },
  { href: '/settings', label: 'Configurações', icon: Settings, desc: 'Preferências' },
  { href: '/help', label: 'Como Ajudar', icon: HelpCircle, desc: 'Ajuda' },
]

interface Props {
  userId: string
}

export function Sidebar({ userId }: Props) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={`relative flex flex-col shrink-0 h-full bg-white border-r border-gray-200 transition-all duration-200 ${
        sidebarCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-5 border-b border-gray-100">
        <FinancialFriendLogo size={sidebarCollapsed ? 36 : 72} showText={false} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={`flex items-center gap-3 mx-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="truncate leading-tight">{label}</div>
                  <div className="text-xs text-gray-400 truncate leading-tight">{desc}</div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Notification bell + Collapse toggle */}
      <div className={`flex ${sidebarCollapsed ? 'flex-col items-center' : 'items-center justify-between px-3'} mb-3 gap-1`}>
        <NotificationBell userId={userId} collapsed={sidebarCollapsed} />
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
