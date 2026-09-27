import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { transactionStore } from '../models/transactionStore.js';
import { budgetStore } from '../models/budgetStore.js';
import { notificationStore } from '../models/notificationStore.js';
import Groq from 'groq-sdk';

const router = Router();

// Require authentication on all /api/ai routes
router.use(authenticateToken);

export interface AiAdviceData {
  summary: string;
  spendingInsights: string[];
  savingsSuggestions: string[];
  budgetSuggestions: string[];
  alerts: string[];
  actionItems: string[];
}

export interface AiAdviceResponse {
  success: boolean;
  data: AiAdviceData;
  isFallback: boolean;
  provider: string;
  message?: string;
}

/**
 * Helper to compute an intelligent, accurate, data-driven fallback
 * when no AI API key is configured or when the AI provider fails.
 */
function generateFallbackAdvice(financials: {
  hasTransactions: boolean;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  savingsRate: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  expenseByCategory: Array<{ category: string; amount: number; percentage: number }>;
  budgets: Array<{ category: string; amount: number; spent: number; remaining: number; percentage: number; status: string }>;
}): AiAdviceData {
  if (!financials.hasTransactions) {
    return {
      summary: "No financial transactions recorded yet. Add your income and expenses to unlock personalized AI financial intelligence.",
      spendingInsights: [
        "No spending recorded across any category.",
        "Add transactions to see category distribution and monthly trends."
      ],
      savingsSuggestions: [
        "Begin by logging your regular monthly income source.",
        "Record daily recurring expenses to track where your money goes."
      ],
      budgetSuggestions: [
        "Create initial budget targets for essentials like Food, Housing, and Utilities once transactions are logged."
      ],
      alerts: [
        "No transaction activity detected. Start recording transactions to activate intelligent monitoring."
      ],
      actionItems: [
        "Add your first income or expense transaction to receive customized insights."
      ]
    };
  }

  const {
    totalIncome,
    totalExpenses,
    netBalance,
    savingsRate,
    currentMonthIncome,
    currentMonthExpenses,
    expenseByCategory,
    budgets
  } = financials;

  const topCategory = expenseByCategory[0];
  const secondCategory = expenseByCategory[1];

  // 1. Summary
  let summary = `Based on your recorded transactions, your net balance is ₹${netBalance.toLocaleString('en-IN')} with an overall savings rate of ${savingsRate}%. `;
  if (savingsRate >= 30) {
    summary += "You maintain a robust savings cushion well above the conventional 20% benchmark.";
  } else if (savingsRate >= 10) {
    summary += "Your finances are balanced, though targeted reductions in top discretionary categories could accelerate wealth accumulation.";
  } else if (netBalance >= 0) {
    summary += "Your net savings margin is slim; establishing tighter category limits will protect against unexpected expenses.";
  } else {
    summary += "Your total expenses exceed recorded income. An immediate spending audit is advised to prevent capital erosion.";
  }

  // 2. Spending Insights
  const spendingInsights: string[] = [];
  if (topCategory) {
    spendingInsights.push(
      `${topCategory.category} represents your largest expense at ₹${topCategory.amount.toLocaleString('en-IN')} (${topCategory.percentage}% of total expenses).`
    );
  }
  if (secondCategory) {
    spendingInsights.push(
      `${secondCategory.category} is your second highest outflow, accounting for ₹${secondCategory.amount.toLocaleString('en-IN')} (${secondCategory.percentage}%).`
    );
  }
  spendingInsights.push(
    `Current month outflows stand at ₹${currentMonthExpenses.toLocaleString('en-IN')} against ₹${currentMonthIncome.toLocaleString('en-IN')} in recorded income.`
  );
  if (expenseByCategory.length > 2) {
    spendingInsights.push(
      `Spending is distributed across ${expenseByCategory.length} active categories, reflecting diverse operational needs.`
    );
  }

  // 3. Savings Suggestions
  const savingsSuggestions: string[] = [];
  if (topCategory) {
    savingsSuggestions.push(
      `Consider setting a 10% reduction target for ${topCategory.category}, which could free up ₹${Math.round(topCategory.amount * 0.1).toLocaleString('en-IN')} each month.`
    );
  }
  savingsSuggestions.push(
    "Implement the 50/30/20 guideline: 50% for core needs, 30% for flexible lifestyle/operations, and 20% dedicated to emergency savings."
  );
  savingsSuggestions.push(
    "Automate a fixed transfer to your savings or investment reserve immediately upon salary or revenue deposit."
  );

  // 4. Budget Suggestions
  const budgetSuggestions: string[] = [];
  if (budgets.length > 0) {
    budgets.forEach((b) => {
      if (b.status === 'exceeded') {
        budgetSuggestions.push(
          `Review ${b.category}: currently at ${b.percentage}% (₹${b.spent.toLocaleString('en-IN')} of ₹${b.amount.toLocaleString('en-IN')}). Limit has been exceeded.`
        );
      } else if (b.status === 'warning') {
        budgetSuggestions.push(
          `${b.category} is at ${b.percentage}% of budget. You have ₹${Math.max(0, b.remaining).toLocaleString('en-IN')} remaining this cycle.`
        );
      } else {
        budgetSuggestions.push(
          `${b.category} is well controlled at ${b.percentage}% utilized (₹${b.remaining.toLocaleString('en-IN')} remaining).`
        );
      }
    });
  } else {
    budgetSuggestions.push(
      "You have not set any active budget limits yet. Establish monthly caps for your primary expense categories."
    );
    if (topCategory) {
      budgetSuggestions.push(
        `Recommended initial budget: Set a monthly cap of ₹${Math.round(topCategory.amount * 0.9).toLocaleString('en-IN')} for ${topCategory.category}.`
      );
    }
  }

  // 5. Alerts
  const alerts: string[] = [];
  const exceededBudgets = budgets.filter((b) => b.status === 'exceeded');
  const warningBudgets = budgets.filter((b) => b.status === 'warning');

  if (exceededBudgets.length > 0) {
    alerts.push(`Budget limit exceeded in ${exceededBudgets.map((b) => b.category).join(', ')}.`);
  }
  if (warningBudgets.length > 0) {
    alerts.push(`Approaching budget threshold in ${warningBudgets.map((b) => b.category).join(', ')}.`);
  }
  if (totalExpenses > totalIncome) {
    alerts.push("Total recorded expenditure exceeds total income.");
  } else if (savingsRate < 15 && totalIncome > 0) {
    alerts.push(`Savings rate (${savingsRate}%) is currently below the recommended 20% baseline.`);
  }
  if (alerts.length === 0) {
    alerts.push("All monitored spending categories and budgets are currently operating within target limits.");
  }

  // 6. Action Items
  const actionItems: string[] = [];
  if (topCategory) {
    actionItems.push(`Audit individual transactions in "${topCategory.category}" for non-essential or recurring subscriptions.`);
  }
  if (budgets.length === 0) {
    actionItems.push("Establish at least two monthly category budgets under the Budget tab.");
  } else if (exceededBudgets.length > 0) {
    actionItems.push("Adjust spending limits or pause non-critical expenses for over-budget categories.");
  }
  actionItems.push("Review recent payment methods to consolidate loyalty points and optimize cashback rewards.");
  actionItems.push("Set up recurring monthly savings allocation to build an emergency fund covering 3-6 months of expenses.");

  return {
    summary,
    spendingInsights,
    savingsSuggestions,
    budgetSuggestions,
    alerts,
    actionItems
  };
}

/**
 * POST /api/ai/advice
 * Analyzes the authenticated user's financial data and returns structured financial advice.
 */
router.post('/advice', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 1. Authenticated User verification
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required'
      });
      return;
    }

    // 2. Fetch user's financial data strictly using authenticated user's ID
    const transactions = await transactionStore.findByUserId(userId);
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rawBudgets = await budgetStore.findByUserId(userId, currentPeriod);

    // 3. Aggregate financial figures
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    const currentYearMonthKey = currentPeriod;
    const currentMonthIncome = transactions
      .filter((t) => t.type === 'income' && t.date?.startsWith(currentYearMonthKey))
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date?.startsWith(currentYearMonthKey))
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense') {
        const cat = t.category || 'Others';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
      }
    }

    const expenseByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Budget tracking
    const budgets = rawBudgets.map((b) => {
      const spent = transactions
        .filter((t) => {
          if (t.type !== 'expense' || !t.date) return false;
          const matchCat = (t.category || '').toLowerCase() === b.category.toLowerCase();
          const matchPeriod = t.date.slice(0, 7) === b.period;
          return matchCat && matchPeriod;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const status = percentage >= 100 ? 'exceeded' : percentage >= 75 ? 'warning' : 'normal';

      return {
        category: b.category,
        amount: b.amount,
        spent,
        remaining,
        percentage,
        status
      };
    });

    const recentTx = transactions.slice(0, 8).map((t) => ({
      date: t.date,
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description || ''
    }));

    const financials = {
      hasTransactions: transactions.length > 0,
      totalIncome,
      totalExpenses,
      netBalance,
      savingsRate,
      currentMonthIncome,
      currentMonthExpenses,
      expenseByCategory,
      budgets
    };

    // If user has no transactions, return clean empty advice immediately
    if (transactions.length === 0) {
      const emptyAdvice = generateFallbackAdvice(financials);
      res.status(200).json({
        success: true,
        data: emptyAdvice,
        isFallback: true,
        provider: 'fallback',
        message: 'No transaction data found. Please add transactions to generate personalized advice.'
      });
      return;
    }

    // 4. Attempt AI Generation (Groq / OpenAI)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    let aiAdvice: AiAdviceData | null = null;
    let usedProvider = 'fallback';

    const systemPrompt = `You are FINTRACK AI, an intelligent, educational financial companion.
Analyze the user's financial profile and return structured advice strictly in valid JSON matching this schema:
{
  "summary": "2-3 concise sentences summarizing financial health, net balance, and savings rate",
  "spendingInsights": ["3-4 clear observations highlighting actual spending patterns, top categories, and percentages"],
  "savingsSuggestions": ["2-3 practical, realistic suggestions to optimize savings based on their actual expenses"],
  "budgetSuggestions": ["2-3 suggestions on their current budgets or recommended limits"],
  "alerts": ["1-3 urgent alerts or positive confirmations regarding budget limits and spending spikes"],
  "actionItems": ["3-4 specific, actionable steps the user should take right now"]
}

FINANCIAL SAFETY & COMPLIANCE RULES:
1. You provide general financial education and budgeting guidance ONLY.
2. NEVER present yourself as a licensed financial advisor.
3. NEVER provide guaranteed investment returns.
4. NEVER make high-risk investment or speculative recommendations.
5. Base all advice strictly on the provided financial numbers. Do not invent transactions, amounts, or financial facts.
6. Return valid JSON only, without markdown formatting or code fences.`;

    const userFinancialsPrompt = `User Financial Snapshot:
- Net Balance: ₹${netBalance}
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpenses}
- Savings Rate: ${savingsRate}%
- Current Month Income: ₹${currentMonthIncome}
- Current Month Expenses: ₹${currentMonthExpenses}
- Top Expense Categories: ${JSON.stringify(expenseByCategory)}
- Active Budgets: ${JSON.stringify(budgets)}
- Recent Transactions: ${JSON.stringify(recentTx)}`;

    // Helper to safely parse JSON response
    const parseSafeJson = (text: string): AiAdviceData | null => {
      try {
        const cleaned = text.replace(/```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (
          parsed &&
          typeof parsed.summary === 'string' &&
          Array.isArray(parsed.spendingInsights) &&
          Array.isArray(parsed.savingsSuggestions) &&
          Array.isArray(parsed.budgetSuggestions) &&
          Array.isArray(parsed.alerts) &&
          Array.isArray(parsed.actionItems)
        ) {
          return parsed;
        }
      } catch (err) {
        console.warn('[AI Parse Warning] Failed to parse JSON from AI completion:', err);
      }
      return null;
    };

    // Attempt OpenAI if configured
    if (OPENAI_KEY && OPENAI_KEY.trim() !== '' && OPENAI_KEY !== 'MY_OPENAI_API_KEY') {
      try {
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY.trim()}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userFinancialsPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
          })
        });

        if (openAiRes.ok) {
          const json = await openAiRes.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            aiAdvice = parseSafeJson(content);
            if (aiAdvice) {
              usedProvider = 'openai';
            }
          }
        } else {
          console.warn(`[AI Warning] OpenAI returned status ${openAiRes.status}`);
        }
      } catch (err: any) {
        console.warn('[AI Warning] OpenAI request failed:', err?.message || err);
      }
    }

    // Attempt Groq if OpenAI was not used or failed
    if (!aiAdvice && GROQ_KEY && GROQ_KEY.trim() !== '' && GROQ_KEY !== 'MY_GROQ_API_KEY') {
      try {
        const groq = new Groq({ apiKey: GROQ_KEY.trim() });
        const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        const candidateModels = [
          groqModel,
          'llama-3.3-70b-versatile',
          'llama-3.1-8b-instant',
          'openai/gpt-oss-120b'
        ].filter((v, i, a) => a.indexOf(v) === i);

        for (const m of candidateModels) {
          try {
            const completion = await groq.chat.completions.create({
              model: m,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userFinancialsPrompt }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3
            });

            const content = completion.choices[0]?.message?.content;
            if (content) {
              aiAdvice = parseSafeJson(content);
              if (aiAdvice) {
                usedProvider = 'groq';
                break;
              }
            }
          } catch (modelErr: any) {
            console.warn(`[Groq Warning] Model ${m} call failed:`, modelErr?.message);
          }
        }
      } catch (groqErr: any) {
        console.warn('[AI Warning] Groq request failed:', groqErr?.message || groqErr);
      }
    }

    // Fallback if AI provider is not configured or failed
    const isFallback = !aiAdvice;
    if (!aiAdvice) {
      aiAdvice = generateFallbackAdvice(financials);
      usedProvider = 'fallback';
    }

    // Step 11: Trigger in-app notification when AI advice is generated
    try {
      await notificationStore.create(userId, {
        title: 'AI Financial Advisory Updated',
        message: `Personalized wealth & budget recommendations generated via ${usedProvider.toUpperCase()}.`,
        type: 'ai'
      });
    } catch (notifErr: any) {
      console.warn('[Notification Error]: Failed to trigger AI advice notification:', notifErr?.message);
    }

    res.status(200).json({
      success: true,
      data: aiAdvice,
      isFallback,
      provider: usedProvider
    });
  } catch (error: any) {
    console.error('[AI Advice API Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while generating financial advice'
    });
  }
});

export default router;
