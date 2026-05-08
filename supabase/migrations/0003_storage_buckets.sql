-- Migration 0003: Supabase Storage bucket for attachments
-- Files stored under: attachments/{household_id}/{entity_id}/{filename}

-- Create private bucket (not public — access via signed URLs only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  104857600, -- 100 MB
  ARRAY[
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HELPER: extract household_id from storage path
-- Path format: {household_id}/{entity_id}/{filename}
-- ============================================================

-- SELECT: members can view files from their household
CREATE POLICY "attachments_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'attachments' AND
    is_household_member((storage.foldername(name))[1]::uuid)
  );

-- INSERT: members can upload to their household folder
CREATE POLICY "attachments_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND
    is_household_member((storage.foldername(name))[1]::uuid)
  );

-- DELETE: members can delete from their household folder
CREATE POLICY "attachments_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments' AND
    is_household_member((storage.foldername(name))[1]::uuid)
  );
