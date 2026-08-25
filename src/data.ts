import { Transaction, ChatMessage } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: 'Oct 24, 2023',
    description: 'Whole Foods Market',
    category: 'Groceries',
    categoryType: 'Groceries',
    method: 'CC ending 4242',
    amount: 4500,
    type: 'expense',
  },
  {
    id: 'tx-2',
    date: 'Oct 22, 2023',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    categoryType: 'Entertainment',
    method: 'Bank Transfer',
    amount: 649,
    type: 'expense',
  },
  {
    id: 'tx-3',
    date: 'Oct 20, 2023',
    description: 'Tech Corp Inc.',
    category: 'Salary',
    categoryType: 'Salary',
    method: 'Bank Transfer',
    amount: 75000,
    type: 'income',
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: 'Hello! I noticed a few trends in your spending this month. Your entertainment expenses increased by 27% compared to last month. Would you like to dive deeper into this?',
    timestamp: '10:14 AM',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'Why did my expenses increase?',
    timestamp: '10:15 AM',
  },
  {
    id: 'msg-3',
    sender: 'ai',
    text: 'The primary drivers for the increase in entertainment spending are:',
    bullets: [
      'Concert tickets on the 12th (₹12,400 / $150)',
      'Multiple streaming service subscriptions (₹3,700 / $45 total)',
      'Dining out over the weekend (₹9,900 / $120)',
    ],
    note: 'Your food expenses are also 18% higher than average. Consider reviewing your dining out budget.',
    timestamp: '10:15 AM',
  },
];
