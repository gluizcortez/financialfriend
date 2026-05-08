'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserWorkspace } from '@/types/models'

interface WorkspaceStore {
  workspaces: UserWorkspace[]
  activeWorkspaceId: string | null
  activeWorkspace: UserWorkspace | null

  setWorkspaces: (ws: UserWorkspace[]) => void
  setActiveWorkspace: (id: string) => void
}

function deriveActive(ws: UserWorkspace[], id: string | null): UserWorkspace | null {
  return ws.find(w => w.id === id) ?? ws[0] ?? null
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      activeWorkspace: null,

      setWorkspaces(ws) {
        const { activeWorkspaceId } = get()
        const validId = activeWorkspaceId && ws.some(w => w.id === activeWorkspaceId)
          ? activeWorkspaceId
          : ws[0]?.id ?? null
        set({
          workspaces: ws,
          activeWorkspaceId: validId,
          activeWorkspace: deriveActive(ws, validId),
        })
      },

      setActiveWorkspace(id) {
        const { workspaces } = get()
        set({ activeWorkspaceId: id, activeWorkspace: deriveActive(workspaces, id) })
      },
    }),
    {
      name: 'ff-active-workspace',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
)
