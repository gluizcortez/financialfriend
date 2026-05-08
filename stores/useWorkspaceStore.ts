'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserWorkspace } from '@/types/models'

interface WorkspaceStore {
  workspaces: UserWorkspace[]
  activeWorkspaceId: string | null

  setWorkspaces: (ws: UserWorkspace[]) => void
  setActiveWorkspace: (id: string) => void

  readonly activeWorkspace: UserWorkspace | null
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,

      setWorkspaces(ws) {
        const state = get()
        const validId = state.activeWorkspaceId && ws.some(w => w.id === state.activeWorkspaceId)
          ? state.activeWorkspaceId
          : ws[0]?.id ?? null
        set({ workspaces: ws, activeWorkspaceId: validId })
      },

      setActiveWorkspace(id) {
        set({ activeWorkspaceId: id })
      },

      get activeWorkspace() {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find(w => w.id === activeWorkspaceId) ?? workspaces[0] ?? null
      },
    }),
    {
      name: 'ff-active-workspace',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    }
  )
)
