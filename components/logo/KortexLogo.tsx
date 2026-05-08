'use client'

import Image from 'next/image'

interface KortexLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function KortexLogo({ size = 32, showText = true, className = '' }: KortexLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/kortex_logo.png"
        alt="Kortex"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        priority
      />
      {showText && (
        <span className="text-lg font-bold text-primary-600">Kortex</span>
      )}
    </div>
  )
}
