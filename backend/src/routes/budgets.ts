import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { budgetStore } from '../models/budgetStore.js';
import { transactionStore } from '../models/transactionStore.js';
import { notificationStore } from '../models/notificationStore.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/budgets
 * Retrieves user budgets along with real-time actual spending progress from transactions.
 * Query params:
 * - period: 'YYYY-MM' (optional, defaults to current month)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const period = (req.query.period as string) || currentPeriod;

    const rawBudgets = await budgetStore.findByUserId(userId, period);
    const userTransactions = await transactionStore.findByUserId(userId);

    // Map each budget with real-time actual spending
    const budgets = rawBudgets.map((b) => {
      const spent = userTransactions
        .filter((t) => {
          if (t.type !== 'expense' || !t.date) return false;
          const matchesCategory = (t.category || '').toLowerCase() === b.category.toLowerCase();
          const matchesPeriod = period === 'all' ? true : t.date.slice(0, 7) === b.period;
          return matchesCategory && matchesPeriod;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const status: 'normal' | 'warning' | 'exceeded' =
        percentage >= 100 ? 'exceeded' : percentage >= 75 ? 'warning' : 'normal';

      return {
        ...b,
        spent,
        remaining,
        percentage,
        status
      };
    });

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remainingTotal = totalBudgeted - totalSpent;
    const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

    res.status(200).json({
      success: true,
      period,
      budgets,
      summary: {
        totalBudgeted,
        totalSpent,
        remainingTotal,
        overallPercentage
      }
    });
  } catch (error: any) {
    console.error('[Get Budgets Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching budgets'
    });
  }
});

/**
 * POST /api/budgets
 * Creates a new budget for the authenticated user.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { category, amount, period } = req.body;

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Category is required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number greater than 0' });
      return;
    }

    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetPeriod = period && typeof period === 'string' && period.trim() ? period.trim() : defaultPeriod;

    const newBudget = await budgetStore.create(userId, {
      category: category.trim(),
      amount: parsedAmount,
      period: budgetPeriod
    });

    // Step 11: Trigger notification for budget creation
    try {
      await notificationStore.create(userId, {
        title: `Budget Created: ${newBudget.category}`,
        message: `Monthly budget of ₹${newBudget.amount.toLocaleString('en-IN')} configured for ${newBudget.category} (${newBudget.period}).`,
        type: 'budget'
      });
    } catch (notifErr: any) {
      console.warn('[Notification Error]: Failed to trigger budget created notification:', notifErr?.message);
    }

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: newBudget
    });
  } catch (error: any) {
    console.error('[Create Budget Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating budget'
    });
  }
});

/**
 * PUT /api/budgets/:id
 * Updates an existing budget owned by the authenticated user.
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const id = req.params.id;
    const { category, amount, period } = req.body;
    const updates: any = {};

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        res.status(400).json({ success: false, message: 'Category cannot be empty' });
        return;
      }
      updates.category = category.trim();
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        return;
      }
      updates.amount = parsedAmount;
    }

    if (period !== undefined && typeof period === 'string') {
      updates.period = period.trim();
    }

    const updated = await budgetStore.update(id, userId, updates);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      budget: updated
    });
  } catch (error: any) {
    console.error('[Update Budget Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating budget'
    });
  }
});

/**
 * DELETE /api/budgets/:id
 * Deletes a budget owned by the authenticated user.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const id = req.params.id;
    const deleted = await budgetStore.delete(id, userId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error: any) {
    console.error('[Delete Budget Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting budget'
    });
  }
});

export default router;
