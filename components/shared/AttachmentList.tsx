'use client'

import { FileText, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getSignedUrl } from '@/lib/supabase/queries/attachments'
import type { Attachment } from '@/types/models'

interface Props {
  attachments: Attachment[]
}

export function AttachmentList({ attachments }: Props) {
  if (attachments.length === 0) return null

  const supabase = createClient()

  async function handleOpen(att: Attachment) {
    try {
      const url = await getSignedUrl(supabase, att.storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // silently ignore — file may have been deleted
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Paperclip size={12} className="text-gray-400 shrink-0" />
      {attachments.map(att => (
        <button
          key={att.id}
          type="button"
          onClick={() => handleOpen(att)}
          className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          title={att.name}
        >
          <FileText size={10} />
          {att.name.length > 15 ? att.name.slice(0, 12) + '...' : att.name}
        </button>
      ))}
    </div>
  )
}
