'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

interface ReleaseNote {
  version: string
  title: string
  content: string
  published_at: string
}

export function ReleaseNotes({ onClose }: Props) {
  const [note, setNote] = useState<ReleaseNote | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('release_notes')
      .select('version, title, content, published_at')
      .eq('is_latest', true)
      .single()
      .then(({ data }) => {
        setNote(data)
        setLoading(false)
      })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">O que há de novo</h2>
            {note && <p className="text-xs text-gray-400 mt-0.5">{note.version}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="text-sm text-gray-400">Carregando...</p>}
          {!loading && !note && <p className="text-sm text-gray-400">Nenhuma nota de versão disponível.</p>}
          {note && (
            <div className="prose prose-sm max-w-none">
              <h3 className="text-base font-semibold text-gray-900 mb-3">{note.title}</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                {note.content}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary-600 text-white py-2 text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
