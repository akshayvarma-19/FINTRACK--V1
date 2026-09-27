import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { notificationStore } from '../models/notificationStore.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated user with unread count.
 * Query params:
 * - type: 'transaction' | 'budget' | 'support' | 'system' | 'ai' | 'all'
 * - isRead: 'true' | 'false'
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { type, isRead } = req.query;

    const filter: { type?: string; isRead?: boolean } = {};
    if (type && typeof type === 'string' && type !== 'all') {
      filter.type = type;
    }
    if (isRead !== undefined) {
      if (isRead === 'true') filter.isRead = true;
      else if (isRead === 'false') filter.isRead = false;
    }

    const notifications = await notificationStore.findByUserId(userId, filter);
    const unreadCount = await notificationStore.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error: any) {
    console.error('[Get Notifications Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching notifications'
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marks all notifications for the authenticated user as read.
 * (Placed before /:id routes to prevent route collision)
 */
router.put('/read-all', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const updatedCount = await notificationStore.markAllAsRead(userId);
    const unreadCount = await notificationStore.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount,
      unreadCount
    });
  } catch (error: any) {
    console.error('[Mark All Read Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking all notifications as read'
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marks a specific notification as read.
 */
router.put('/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const notification = await notificationStore.markAsRead(id, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    const unreadCount = await notificationStore.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount
    });
  } catch (error: any) {
    console.error('[Mark Notification Read Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking notification as read'
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Deletes a notification owned by the authenticated user.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const deleted = await notificationStore.delete(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    const unreadCount = await notificationStore.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      unreadCount
    });
  } catch (error: any) {
    console.error('[Delete Notification Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting notification'
    });
  }
});

export default router;
