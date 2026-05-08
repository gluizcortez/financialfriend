'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { UserWorkspace } from '@/types/models'

interface Props {
  workspaces: UserWorkspace[]
}

export function WorkspaceStoreInit({ workspaces }: Props) {
  const setWorkspaces = useWorkspaceStore(s => s.setWorkspaces)

  useEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  return null
}
