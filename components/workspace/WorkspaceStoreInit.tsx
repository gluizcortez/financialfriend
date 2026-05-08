'use client'

import { useLayoutEffect } from 'react'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import type { UserWorkspace } from '@/types/models'

interface Props {
  workspaces: UserWorkspace[]
}

export function WorkspaceStoreInit({ workspaces }: Props) {
  const setWorkspaces = useWorkspaceStore(s => s.setWorkspaces)

  // useLayoutEffect fires synchronously before browser paint, eliminating
  // the "Carregando workspace..." flash on first render.
  useLayoutEffect(() => {
    setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  return null
}
