import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import {
  ticketStore,
  TicketCategory,
  TicketPriority,
  TicketStatus
} from '../models/ticketStore.js';
import { notificationStore } from '../models/notificationStore.js';

const router = Router();

// Enforce authentication across all support routes
router.use(authenticateToken);

const VALID_CATEGORIES: TicketCategory[] = [
  'Account',
  'Transaction',
  'Dashboard',
  'Payment',
  'Technical Issue',
  'Other'
];

const VALID_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High'];

const VALID_STATUSES: TicketStatus[] = [
  'Open',
  'In Progress',
  'Resolved',
  'Closed'
];

/**
 * GET /api/support/tickets
 * Lists all support tickets belonging strictly to the authenticated user.
 */
router.get('/tickets', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let tickets = await ticketStore.findByUserId(userId);

    // Optional query filtering
    const { status, category, search } = req.query;

    if (status && typeof status === 'string' && status !== 'all') {
      tickets = tickets.filter(
        (t) => t.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (category && typeof category === 'string' && category !== 'all') {
      tickets = tickets.filter(
        (t) => t.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error: any) {
    console.error('[Get Tickets Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching support tickets'
    });
  }
});

/**
 * GET /api/support/tickets/:id
 * Retrieves a single ticket by ID, ensuring user ownership.
 */
router.get('/tickets/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const ticket = await ticketStore.findById(id, userId);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error: any) {
    console.error('[Get Ticket By ID Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching ticket details'
    });
  }
});

/**
 * POST /api/support/tickets
 * Creates a new support ticket for the authenticated user.
 */
router.post('/tickets', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { subject, description, category, priority } = req.body;

    // Validation
    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Subject is required and must be at least 3 characters long'
      });
      return;
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length < 5
    ) {
      res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 5 characters long'
      });
      return;
    }

    if (!category || !VALID_CATEGORIES.includes(category as TicketCategory)) {
      res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
      return;
    }

    if (!priority || !VALID_PRIORITIES.includes(priority as TicketPriority)) {
      res.status(400).json({
        success: false,
        message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`
      });
      return;
    }

    // Create ticket - strictly binds authenticated user ID
    const newTicket = await ticketStore.create(userId, {
      subject: subject.trim(),
      description: description.trim(),
      category: category as TicketCategory,
      priority: priority as TicketPriority
    });

    // Step 11: Trigger notification for ticket creation
    try {
      await notificationStore.create(userId, {
        title: `Support Ticket Created: #${newTicket.id}`,
        message: `Your ticket "${newTicket.subject}" has been submitted (${newTicket.category} • ${newTicket.priority} Priority).`,
        type: 'support'
      });
    } catch (notifErr: any) {
      console.warn('[Notification Error]: Failed to trigger ticket created notification:', notifErr?.message);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: newTicket
    });
  } catch (error: any) {
    console.error('[Create Ticket Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating support ticket'
    });
  }
});

/**
 * PUT /api/support/tickets/:id
 * Updates allowed fields on a ticket owned by the authenticated user.
 */
router.put('/tickets/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { subject, description, category, priority, status } = req.body;

    // Verify ownership and existence
    const existing = await ticketStore.findById(id, userId);
    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
      return;
    }

    const updates: any = {};

    if (subject !== undefined) {
      if (typeof subject !== 'string' || subject.trim().length < 3) {
        res.status(400).json({
          success: false,
          message: 'Subject must be at least 3 characters long'
        });
        return;
      }
      updates.subject = subject.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length < 5) {
        res.status(400).json({
          success: false,
          message: 'Description must be at least 5 characters long'
        });
        return;
      }
      updates.description = description.trim();
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category as TicketCategory)) {
        res.status(400).json({
          success: false,
          message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
        return;
      }
      updates.category = category as TicketCategory;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority as TicketPriority)) {
        res.status(400).json({
          success: false,
          message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`
        });
        return;
      }
      updates.priority = priority as TicketPriority;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as TicketStatus)) {
        res.status(400).json({
          success: false,
          message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
        });
        return;
      }
      updates.status = status as TicketStatus;
    }

    const updated = await ticketStore.update(id, userId, updates);

    // Step 11: Trigger notification if ticket status was updated
    if (updates.status && updates.status !== existing.status) {
      try {
        await notificationStore.create(userId, {
          title: `Ticket Status Updated: #${id}`,
          message: `Ticket "${existing.subject}" status changed to ${updates.status}.`,
          type: 'support'
        });
      } catch (notifErr: any) {
        console.warn('[Notification Error]: Failed to trigger ticket updated notification:', notifErr?.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      ticket: updated
    });
  } catch (error: any) {
    console.error('[Update Ticket Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating support ticket'
    });
  }
});

export default router;
