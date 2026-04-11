import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { demoNotifications } from '@/utils/demoNotifications'

export type Notification = {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
  type: 'info' | 'warning' | 'error' | 'success'
  link?: string
}

type NotificationStore = {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [...demoNotifications],
      unreadCount: demoNotifications.filter(n => !n.read).length, addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
          link: notification.link || notification.type === 'success' ? '/displays' : undefined
        }
        return {
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50 notifications
          unreadCount: state.unreadCount + 1,
        }
      }),

      markAsRead: (id) => set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
        }
      }),

      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      removeNotification: (id) => set((state) => {
        const notifications = state.notifications.filter(n => n.id !== id)
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length,
        }
      }),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'notification-store',
    }
  )
)