import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { transactionStore } from '../models/transactionStore.js';

const router = Router();

// Apply authentication middleware to all dashboard endpoints
router.use(authenticateToken);

/**
 * GET /api/dashboard/summary
 * Returns aggregated financial metrics and recent transactions for the authenticated user.
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User ID not found in session token'
      });
      return;
    }

    // Retrieve user-scoped transactions
    const transactions = await transactionStore.findByUserId(userId);

    // Totals calculations
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Trailing 6 months spending trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trailingMonths: Array<{ month: string; year: number; key: string; amount: number }> = [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentYearMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      trailingMonths.push({
        month: monthNames[m],
        year: y,
        key,
        amount: 0
      });
    }

    const isCurrentMonth = (dateStr: string): boolean => {
      if (!dateStr) return false;
      return dateStr.slice(0, 7) === currentYearMonthKey;
    };

    // Calculate amounts for trailing months
    for (const t of transactions) {
      if (t.type === 'expense' && t.date) {
        const tKey = t.date.slice(0, 7);
        const match = trailingMonths.find((tm) => tm.key === tKey);
        if (match) {
          match.amount += t.amount;
        }
      }
    }

    const currentMonthIncome = transactions
      .filter((t) => t.type === 'income' && isCurrentMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = transactions
      .filter((t) => t.type === 'expense' && isCurrentMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);

    // Expense grouped by category for donut/pie chart
    const categoryMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        const cat = t.category || 'Uncategorized';
        const curr = categoryMap.get(cat) || 0;
        categoryMap.set(cat, curr + t.amount);
      }
    }

    const expenseByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => {
        const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
        return {
          category,
          amount,
          percentage
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Recent 5 transactions (already sorted newest first by findByUserId)
    const recentTransactions = transactions.slice(0, 5);

    const summary = {
      totalIncome,
      totalExpenses,
      remainingBalance,
      savingsRate,
      currentMonthIncome,
      currentMonthExpenses,
      expenseByCategory,
      recentTransactions,
      monthlySpending: trailingMonths
    };

    res.status(200).json({
      success: true,
      summary,
      ...summary
    });
  } catch (err: any) {
    console.error('[Dashboard API Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while compiling dashboard summary'
    });
  }
});

export default router;
