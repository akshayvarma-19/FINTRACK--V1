import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { transactionStore } from '../models/transactionStore.js';

const router = Router();
router.use(authenticateToken);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GET /api/analytics
 * Returns comprehensive analytics, trends, category distributions, and financial projections.
 * Query params:
 * - period: '3M' | '6M' | '1Y' | 'ALL' (default: '6M')
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const allTransactions = await transactionStore.findByUserId(userId);

    // Determine number of trailing months
    const period = (req.query.period as string) || '6M';
    let monthCount = 6;
    if (period === '3M') monthCount = 3;
    else if (period === '1Y') monthCount = 12;
    else if (period === 'ALL') monthCount = 24;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Generate chronological trailing months
    const trailingMonths: Array<{
      month: string;
      year: number;
      key: string;
      income: number;
      expense: number;
      net: number;
    }> = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      trailingMonths.push({
        month: MONTH_NAMES[m],
        year: y,
        key,
        income: 0,
        expense: 0,
        net: 0
      });
    }

    const earliestKey = trailingMonths[0].key;

    // Filter transactions within period
    const periodTransactions = allTransactions.filter((t) => {
      if (!t.date) return false;
      const key = t.date.slice(0, 7);
      return period === 'ALL' || key >= earliestKey;
    });

    // Populate monthly trends
    for (const t of periodTransactions) {
      const key = t.date?.slice(0, 7);
      const targetMonth = trailingMonths.find((m) => m.key === key);
      if (targetMonth) {
        if (t.type === 'income') {
          targetMonth.income += t.amount;
        } else if (t.type === 'expense') {
          targetMonth.expense += t.amount;
        }
      }
    }

    // Calculate net for each month
    for (const m of trailingMonths) {
      m.net = m.income - m.expense;
    }

    // Totals across the period
    const totalIncome = periodTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Category breakdown for expenses
    const categoryMap = new Map<string, number>();
    for (const t of periodTransactions) {
      if (t.type === 'expense') {
        const cat = t.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
      }
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Discretionary ratio (Dining, Entertainment, Shopping, Travel)
    const discretionaryKeywords = [
      'dining', 'food', 'restaurant', 'entertainment', 'leisure', 'shopping', 'travel', 'marketing'
    ];
    const discretionaryExpense = periodTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const catLower = (t.category || '').toLowerCase();
        return discretionaryKeywords.some((k) => catLower.includes(k));
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const discretionaryRatio = totalExpense > 0 ? Math.round((discretionaryExpense / totalExpense) * 100) : 0;

    // Annualized projection
    const activeMonthsCount = Math.max(1, Math.min(monthCount, 12));
    const averageMonthlyExpense = Math.round(totalExpense / activeMonthsCount);
    const averageMonthlyIncome = Math.round(totalIncome / activeMonthsCount);
    const projectedAnnualNet = Math.round((netSavings / activeMonthsCount) * 12);

    // Net growth rate between first active month with data and latest month
    const latestMonth = trailingMonths[trailingMonths.length - 1];
    const prevMonth = trailingMonths[trailingMonths.length - 2];
    let netInflowGrowth = 0;
    if (prevMonth && prevMonth.income > 0) {
      netInflowGrowth = Math.round(((latestMonth.income - prevMonth.income) / prevMonth.income) * 100);
    } else if (latestMonth.income > 0) {
      netInflowGrowth = 15; // default benchmark if initial month
    }

    res.status(200).json({
      success: true,
      period,
      metrics: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        discretionaryRatio,
        averageMonthlyIncome,
        averageMonthlyExpense,
        projectedAnnualNet,
        netInflowGrowth,
        topCategory: categoryBreakdown[0] || { category: 'None', amount: 0, percentage: 0 }
      },
      monthlyTrends: trailingMonths,
      categoryBreakdown
    });
  } catch (error: any) {
    console.error('[Analytics Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while compiling financial analytics'
    });
  }
});

export default router;
