export type TabType = 'dashboard' | 'add-transaction' | 'expenses' | 'analytics' | 'budget' | 'ai-advisor' | 'support' | 'profile' | 'settings';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  categoryType: 'Groceries' | 'Entertainment' | 'Salary' | 'Utilities' | 'Transport' | 'Shopping' | 'Other';
  method: string;
  amount: number;
  type: 'expense' | 'income';
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  bullets?: string[];
  note?: string;
  timestamp: string;
}
