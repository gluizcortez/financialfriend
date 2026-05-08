import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Attachment } from '@/types/models'

type Client = SupabaseClient<Database>

function mapAttachment(row: Database['public']['Tables']['attachments']['Row']): Attachment {
  return {
    id: row.id,
    householdId: row.household_id,
    entityType: row.entity_type as Attachment['entityType'],
    entityId: row.entity_id,
    storagePath: row.storage_path,
    name: row.name,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
  }
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

export async function uploadAttachment(
  client: Client,
  file: File,
  householdId: string,
  entityType: 'bill_entry' | 'investment_transaction',
  entityId: string
): Promise<Attachment> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo excede o limite de 100 MB')
  }

  const ext = file.name.split('.').pop() ?? ''
  const storagePath = `${householdId}/${entityId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await client.storage
    .from('attachments')
    .upload(storagePath, file, { upsert: false })

  if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`)

  const { data, error } = await client
    .from('attachments')
    .insert({
      household_id: householdId,
      entity_type: entityType,
      entity_id: entityId,
      storage_path: storagePath,
      name: file.name,
      size_bytes: file.size,
    })
    .select()
    .single()

  if (error || !data) {
    // Cleanup storage on DB failure
    await client.storage.from('attachments').remove([storagePath])
    throw new Error(error?.message)
  }

  return mapAttachment(data)
}

export async function deleteAttachment(client: Client, attachment: Attachment): Promise<void> {
  await client.storage.from('attachments').remove([attachment.storagePath])
  await client.from('attachments').delete().eq('id', attachment.id)
}

export async function getSignedUrl(client: Client, storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await client.storage
    .from('attachments')
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) throw new Error(`Failed to get signed URL: ${error?.message}`)
  return data.signedUrl
}

export async function getAttachmentsForEntity(
  client: Client,
  entityId: string,
  entityType: 'bill_entry' | 'investment_transaction'
): Promise<Attachment[]> {
  const { data, error } = await client
    .from('attachments')
    .select('*')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .order('uploaded_at')

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapAttachment)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
