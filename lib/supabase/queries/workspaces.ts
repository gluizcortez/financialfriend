import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { UserWorkspace, WorkspaceInvitation, AppNotification } from '@/types/models'

type Client = SupabaseClient<Database>

function mapWorkspace(row: Database['public']['Tables']['households']['Row']): UserWorkspace {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapInvitation(row: Database['public']['Tables']['workspace_invitations']['Row']): WorkspaceInvitation {
  return {
    id: row.id,
    householdId: row.household_id,
    invitedEmail: row.invited_email,
    invitedBy: row.invited_by,
    status: row.status as WorkspaceInvitation['status'],
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

function mapNotification(row: Database['public']['Tables']['notifications']['Row']): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as AppNotification['type'],
    title: row.title,
    body: row.body,
    data: (row.data ?? {}) as Record<string, unknown>,
    isRead: row.is_read,
    householdId: row.household_id,
    createdAt: row.created_at,
  }
}

// ── Workspace CRUD ────────────────────────────────────────

export async function getUserWorkspaces(client: Client, userId: string): Promise<UserWorkspace[]> {
  const { data: members, error: membErr } = await client
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)

  if (membErr || !members?.length) return []

  const householdIds = members.map(m => m.household_id)
  const { data: households, error } = await client
    .from('households')
    .select('*')
    .in('id', householdIds)
    .order('created_at')

  if (error || !households) return []
  return households.map(mapWorkspace)
}

export async function createUserWorkspace(
  client: Client,
  name: string,
  userId: string
): Promise<UserWorkspace> {
  const { data: household, error } = await client
    .from('households')
    .insert({ name: name || 'Novo Workspace', created_by: userId })
    .select()
    .single()

  if (error || !household) throw new Error(error?.message ?? 'Failed to create workspace')

  await client.from('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
  })

  return mapWorkspace(household)
}

export async function updateUserWorkspace(
  client: Client,
  id: string,
  name: string
): Promise<UserWorkspace> {
  const { data, error } = await client
    .from('households')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update workspace')
  return mapWorkspace(data)
}

export async function deleteUserWorkspace(client: Client, id: string): Promise<void> {
  const { error } = await client.from('households').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Invitations ───────────────────────────────────────────

export async function sendInvitation(
  client: Client,
  householdId: string,
  invitedEmail: string,
  invitedBy: string
): Promise<void> {
  const { error } = await client.from('workspace_invitations').insert({
    household_id: householdId,
    invited_email: invitedEmail.toLowerCase(),
    invited_by: invitedBy,
  })
  if (error) throw new Error(error.message)
}

export async function getPendingInvitations(
  client: Client,
  householdId: string
): Promise<WorkspaceInvitation[]> {
  const { data, error } = await client
    .from('workspace_invitations')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapInvitation)
}

export async function acceptInvitation(
  client: Client,
  invitationId: string,
  userId: string
): Promise<void> {
  const { data: inv, error: fetchErr } = await client
    .from('workspace_invitations')
    .select('household_id')
    .eq('id', invitationId)
    .single()

  if (fetchErr || !inv) throw new Error('Invitation not found')

  // Add as member
  await client.from('household_members').insert({
    household_id: inv.household_id,
    user_id: userId,
    role: 'member',
  })

  // Mark invitation accepted
  await client.from('workspace_invitations').update({ status: 'accepted' }).eq('id', invitationId)

  // Mark related notification as read
  await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .contains('data', { invitation_id: invitationId })
}

export async function declineInvitation(client: Client, invitationId: string): Promise<void> {
  await client.from('workspace_invitations').update({ status: 'declined' }).eq('id', invitationId)
}

// ── Notifications ─────────────────────────────────────────

export async function checkAndCreateInviteNotifications(
  client: Client,
  userId: string,
  email: string
): Promise<void> {
  try {
    await client.rpc('create_pending_invite_notifications', {
      p_user_id: userId,
      p_email: email,
    })
  } catch {
    // Non-critical — don't fail the page load
  }
}

export async function getNotifications(client: Client, userId: string): Promise<AppNotification[]> {
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapNotification)
}

export async function markNotificationRead(client: Client, notificationId: string): Promise<void> {
  await client.from('notifications').update({ is_read: true }).eq('id', notificationId)
}

export async function markAllNotificationsRead(client: Client, userId: string): Promise<void> {
  await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

export async function getUnreadNotificationCount(client: Client, userId: string): Promise<number> {
  const { count, error } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}
