export type TabType = 'dashboard' | 'add-transaction' | 'expenses' | 'analytics' | 'budget' | 'ai-advisor' | 'support' | 'notifications' | 'profile' | 'settings';

export interface Transaction {
  id: string;
  userId?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  categoryType?: string;
  date: string;
  paymentMethod?: string;
  method?: string;
  description: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  bullets?: string[];
  note?: string;
  timestamp: string;
}

export interface Budget {
  id: string;
  userId?: string;
  category: string;
  amount: number;
  period: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: 'normal' | 'warning' | 'exceeded';
  createdAt?: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  key: string;
  income: number;
  expense: number;
  expenses?: number;
  net: number;
  label?: string;
}

export interface CategoryAnalytics {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsMetrics {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  discretionaryRatio: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  projectedAnnualNet: number;
  netInflowGrowth: number;
  topCategory: CategoryAnalytics;
}

export type TicketCategory =
  | 'Account'
  | 'Transaction'
  | 'Dashboard'
  | 'Payment'
  | 'Technical Issue'
  | 'Other';

export type TicketPriority = 'Low' | 'Medium' | 'High';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'transaction' | 'budget' | 'support' | 'system' | 'ai';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  notifications: Notification[];
  message?: string;
}

export interface NotificationResponse {
  success: boolean;
  notification?: Notification;
  unreadCount?: number;
  message?: string;
}

