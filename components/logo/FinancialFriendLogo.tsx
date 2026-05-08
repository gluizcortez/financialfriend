'use client'

import Image from 'next/image'

interface FinancialFriendLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function FinancialFriendLogo({ size = 32, showText = true, className = '' }: FinancialFriendLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/financialfriendbycortexlogo.png"
        alt="FinancialFriend"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        priority
      />
      {showText && (
        <span className="text-lg font-bold text-primary-600">FinancialFriend</span>
      )}
    </div>
  )
}

