import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinancialFriend - Gestão Financeira',
  description: 'Gerencie suas finanças pessoais com inteligência',
  icons: { icon: '/financialfriendbycortexlogo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
