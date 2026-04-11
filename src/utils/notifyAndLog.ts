import { useNotificationStore } from '@/stores/useNotificationStore';
import { logActivity } from '@/api/logActivity';
import type { Json } from '@/types/database';

export async function notifyAndLog({
  title,
  message,
  type,
  link,
  action_type,
  entity,
  entity_id,
  user_id,
  meta
}: {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  link?: string;
  action_type: string;
  entity: string;
  entity_id?: string | number;
  user_id?: number;
  meta?: Json;
}) {
  // Add notification
  useNotificationStore.getState().addNotification({
    title,
    message,
    type,
    link
  });
  // Log activity
  await logActivity({
    action_type,
    entity,
    entity_id,
    description: message,
    user_id,
    meta
  });
}
