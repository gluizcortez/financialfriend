'use client'

import { create } from 'zustand'

export type AppSection =
  | 'bills' | 'investments' | 'goals' | 'dashboard'
  | 'fgts' | 'settings' | 'networth' | 'help' | 'income'

export type NotificationType = 'success' | 'error' | 'info'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration: number
  action?: { label: string; onClick: () => void }
}

interface UIState {
  sidebarCollapsed: boolean
  notifications: Notification[]
  activeModal: string | null
  modalData: unknown

  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void

  addNotification: (message: string, type?: NotificationType, action?: Notification['action']) => void
  removeNotification: (id: string) => void

  openModal: (modal: string, data?: unknown) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  notifications: [],
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  addNotification: (message, type = 'info', action) => {
    const id = `notif-${Date.now()}-${Math.random()}`
    const duration = type === 'success' ? 3000 : type === 'error' ? 5000 : 6000
    const notif: Notification = { id, message, type, duration, action }
    set(s => ({ notifications: [...s.notifications, notif] }))
    setTimeout(() => {
      set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
    }, duration)
  },

  removeNotification: (id) =>
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}))
