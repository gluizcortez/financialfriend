'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Layers } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

interface Props {
  title: string
}

export function WorkspaceHero({ title }: Props) {
  const router = useRouter()
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!activeWorkspace) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
      <div className="flex items-center gap-3">
        <Layers size={18} className="text-gray-400" />
        <span className="text-sm text-gray-500">{title}</span>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <span className="max-w-40 truncate">{activeWorkspace.name}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => { setActiveWorkspace(ws.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  ws.id === activeWorkspace.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === activeWorkspace.id && <span className="text-primary-500 text-xs">ativo</span>}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { router.push('/workspaces'); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Plus size={14} />
                Gerenciar workspaces
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
