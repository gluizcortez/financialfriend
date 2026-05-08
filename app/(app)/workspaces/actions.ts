'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  createUserWorkspace,
  updateUserWorkspace,
  deleteUserWorkspace,
  sendInvitation,
  acceptInvitation,
  declineInvitation,
} from '@/lib/supabase/queries/workspaces'

export async function createWorkspaceAction(name: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    // Ensure profile exists — required by households.created_by FK
    await service.from('profiles').upsert(
      { id: user.id, full_name: user.user_metadata?.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    await createUserWorkspace(service, name.trim() || 'Novo Workspace', user.id)
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao criar workspace' }
  }
}

export async function updateWorkspaceAction(id: string, name: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    await updateUserWorkspace(service, id, name.trim())
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar workspace' }
  }
}

export async function deleteWorkspaceAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    await deleteUserWorkspace(service, id)
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao deletar workspace' }
  }
}

export async function inviteToWorkspaceAction(householdId: string, email: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    await sendInvitation(service, householdId, email.trim().toLowerCase(), user.id)
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao enviar convite' }
  }
}

export async function acceptInvitationAction(invitationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    await acceptInvitation(service, invitationId, user.id)
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao aceitar convite' }
  }
}

export async function declineInvitationAction(invitationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }
  try {
    const service = createServiceClient()
    await declineInvitation(service, invitationId)
    return { error: null }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao recusar convite' }
  }
}
