import { get, put, del } from '@/lib/api/client';

export type Notification = {
  id: string;
  type: 'newly_eligible' | 'missing_documents' | 'upcoming_eligibility' | 'ai_recommendation';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export const notificationService = {
  /** Fetch all database notifications for a citizen. */
  getNotifications: (citizenId: string) =>
    get<{ notifications: Notification[] }>(`/api/notifications/${citizenId}`),

  /** Mark a specific notification as read. */
  markAsRead: (notificationId: string) =>
    put<{ status: string; notification: Notification }>(`/api/notifications/${notificationId}/read`),

  /** Mark all notifications for a citizen as read. */
  markAllRead: (citizenId: string) =>
    put<{ status: string; message: string }>(`/api/notifications/read-all/${citizenId}`),

  /** Delete a notification permanently. */
  deleteNotification: (notificationId: string) =>
    del<{ status: string; message: string }>(`/api/notifications/${notificationId}`),
};
