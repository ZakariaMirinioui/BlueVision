import { Notification } from '@/stores/useNotificationStore'

export const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'Welcome to Blue Vision',
    message: 'Thank you for using Blue Vision! Check out our quick start guide.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    type: 'info',
    link: '/guide'
  },
  {
    id: '2',
    title: 'Display Offline',
    message: 'Display "Lobby Screen" is currently offline.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    type: 'error',
    link: '/displays'
  },
  {
    id: '3',
    title: 'Schedule Updated',
    message: 'The schedule for "Main Campaign" has been updated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
    type: 'success',
    link: '/schedules'
  }
]