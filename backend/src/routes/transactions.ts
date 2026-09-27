import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { transactionStore } from '../models/transactionStore.js';
import { notificationStore } from '../models/notificationStore.js';
import { budgetStore } from '../models/budgetStore.js';

const router = Router();

// Validation helper for transaction date
function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * GET /api/transactions
 * Returns transactions belonging to the authenticated user, with optional query filters:
 * - type: 'income' | 'expense'
 * - category: string
 * - month: 'YYYY-MM'
 * - startDate: 'YYYY-MM-DD'
 * - endDate: 'YYYY-MM-DD'
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let transactions = await transactionStore.findByUserId(userId);

    const { type, category, month, startDate, endDate } = req.query;

    if (type && (type === 'income' || type === 'expense')) {
      transactions = transactions.filter((t) => t.type === type);
    }

    if (category && typeof category === 'string' && category.trim() !== '' && category !== 'all') {
      const catLower = category.toLowerCase().trim();
      transactions = transactions.filter((t) => (t.category || '').toLowerCase() === catLower);
    }

    if (month && typeof month === 'string' && month.trim() !== '' && month !== 'all') {
      const monthPrefix = month.trim();
      transactions = transactions.filter((t) => t.date && t.date.slice(0, 7) === monthPrefix);
    }

    if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
      transactions = transactions.filter((t) => t.date && t.date >= startDate.trim());
    }

    if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
      transactions = transactions.filter((t) => t.date && t.date <= endDate.trim());
    }

    const incomeTotal = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseTotal = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return res.status(200).json({
      success: true,
      transactions,
      count: transactions.length,
      incomeTotal,
      expenseTotal,
      netTotal: incomeTotal - expenseTotal
    });
  } catch (error: any) {
    console.error('[Get Transactions Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching transactions'
    });
  }
});

/**
 * POST /api/transactions
 * Creates a new transaction for the authenticated user.
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { amount, type, category, date, paymentMethod, description } = req.body;

    // Validate Amount
    const parsedAmount = Number(amount);
    if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number greater than 0'
      });
    }

    // Validate Type
    if (!type || (type !== 'income' && type !== 'expense')) {
      return res.status(400).json({
        success: false,
        message: 'Type is required and must be either "income" or "expense"'
      });
    }

    // Validate Category
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category is required and cannot be empty'
      });
    }

    // Validate Date
    if (!date || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'A valid transaction date is required'
      });
    }

    const newTransaction = await transactionStore.create(userId, {
      amount: parsedAmount,
      type,
      category: category.trim(),
      date: date.trim(),
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'Other',
      description: description ? String(description).trim() : ''
    });

    // Step 11: Trigger in-app notification for new transaction
    try {
      await notificationStore.create(userId, {
        title: `New ${type === 'income' ? 'Income' : 'Expense'} Recorded`,
        message: `₹${parsedAmount.toLocaleString('en-IN')} added under ${category.trim()}${description ? ` (${description.trim()})` : ''}.`,
        type: 'transaction'
      });

      // If it's an expense, check if it triggers a budget alert
      if (type === 'expense') {
        const periodStr = date.trim().slice(0, 7);
        const budgets = await budgetStore.findByUserId(userId, periodStr);
        const matchedBudget = budgets.find(
          b => b.category.toLowerCase() === category.trim().toLowerCase()
        );
        if (matchedBudget && matchedBudget.amount > 0) {
          const userTransactions = await transactionStore.findByUserId(userId);
          const totalSpent = userTransactions
            .filter(t => t.type === 'expense' && t.category.toLowerCase() === matchedBudget.category.toLowerCase() && t.date.slice(0, 7) === periodStr)
            .reduce((sum, t) => sum + t.amount, 0);

          const pct = Math.round((totalSpent / matchedBudget.amount) * 100);
          if (pct >= 100) {
            await notificationStore.create(userId, {
              title: `Budget Exceeded: ${matchedBudget.category}`,
              message: `Total spending reached ₹${totalSpent.toLocaleString('en-IN')} (${pct}% of ₹${matchedBudget.amount.toLocaleString('en-IN')} limit).`,
              type: 'budget'
            });
          } else if (pct >= 80) {
            await notificationStore.create(userId, {
              title: `Budget Warning: ${matchedBudget.category}`,
              message: `You have reached ${pct}% of your ₹${matchedBudget.amount.toLocaleString('en-IN')} budget (₹${totalSpent.toLocaleString('en-IN')} spent).`,
              type: 'budget'
            });
          }
        }
      }
    } catch (notifErr: any) {
      console.warn('[Notification Error]: Failed to trigger transaction notification:', notifErr?.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: newTransaction
    });
  } catch (error: any) {
    console.error('[Create Transaction Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating transaction'
    });
  }
});

/**
 * GET /api/transactions/:id
 * Retrieves a single transaction owned by the authenticated user.
 */
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const txId = req.params.id;
    const transaction = await transactionStore.findByIdAndUserId(txId, userId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      transaction
    });
  } catch (error: any) {
    console.error('[Get Transaction By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching transaction'
    });
  }
});

/**
 * PUT /api/transactions/:id
 * Updates an existing transaction owned by the authenticated user.
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const txId = req.params.id;
    const existing = await transactionStore.findByIdAndUserId(txId, userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const { amount, type, category, date, paymentMethod, description } = req.body;
    const updates: any = {};

    // Validate Amount if provided
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number greater than 0'
        });
      }
      updates.amount = parsedAmount;
    }

    // Validate Type if provided
    if (type !== undefined) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "income" or "expense"'
        });
      }
      updates.type = type;
    }

    // Validate Category if provided
    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be empty'
        });
      }
      updates.category = category.trim();
    }

    // Validate Date if provided
    if (date !== undefined) {
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: 'A valid date is required'
        });
      }
      updates.date = date.trim();
    }

    if (paymentMethod !== undefined) {
      updates.paymentMethod = String(paymentMethod).trim();
    }

    if (description !== undefined) {
      updates.description = String(description).trim();
    }

    const updated = await transactionStore.update(txId, userId, updates);

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated
    });
  } catch (error: any) {
    console.error('[Update Transaction Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating transaction'
    });
  }
});

/**
 * DELETE /api/transactions/:id
 * Deletes a transaction owned by the authenticated user.
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const txId = req.params.id;
    const deleted = await transactionStore.delete(txId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error: any) {
    console.error('[Delete Transaction Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting transaction'
    });
  }
});

export default router;
