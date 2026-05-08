'use client'

import { useRef, useState } from 'react'
import { Paperclip, X, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadAttachment, deleteAttachment, getAttachmentsForEntity, formatFileSize } from '@/lib/supabase/queries/attachments'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Attachment } from '@/types/models'

interface Props {
  entityType: 'bill_entry' | 'investment_transaction'
  entityId: string
  householdId: string
}

export function AttachmentInput({ entityType, entityId, householdId }: Props) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryKey = ['attachments', entityType, entityId]

  const { data: attachments = [] } = useQuery({
    queryKey,
    queryFn: () => getAttachmentsForEntity(supabase, entityId, entityType),
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadAttachment(supabase, file, householdId, entityType, entityId)
      queryClient.invalidateQueries({ queryKey })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(att: Attachment) {
    try {
      await deleteAttachment(supabase, att)
      queryClient.invalidateQueries({ queryKey })
    } catch {
      setError('Erro ao remover anexo')
    }
  }

  return (
    <div className="space-y-2">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
        {uploading ? 'Enviando...' : 'Anexar arquivo'}
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1">
              <FileText size={14} className="shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-xs text-gray-600">{att.name}</span>
              <span className="text-[10px] text-gray-400">{formatFileSize(att.sizeBytes)}</span>
              <button
                type="button"
                onClick={() => handleDelete(att)}
                className="rounded p-0.5 text-gray-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
