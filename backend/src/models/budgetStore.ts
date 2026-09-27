export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: string; // 'YYYY-MM'
  createdAt: string;
}

export interface CreateBudgetDTO {
  category: string;
  amount: number;
  period?: string;
}

export interface UpdateBudgetDTO {
  category?: string;
  amount?: number;
  period?: string;
}

class BudgetStore {
  private budgets: Map<string, Budget> = new Map();

  constructor() {
    this.seedDemoBudgets();
  }

  private seedDemoBudgets() {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Seeded budgets for Individual demo user (usr_ind_alex01)
    const indBudgets: Budget[] = [
      {
        id: 'bg_ind_01',
        userId: 'usr_ind_alex01',
        category: 'Food & Dining',
        amount: 8000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_ind_02',
        userId: 'usr_ind_alex01',
        category: 'Housing & Rent',
        amount: 25000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_ind_03',
        userId: 'usr_ind_alex01',
        category: 'Entertainment',
        amount: 2000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_ind_04',
        userId: 'usr_ind_alex01',
        category: 'Utilities & Bills',
        amount: 5000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      }
    ];

    // Seeded budgets for Corporate demo user (usr_corp_apex01)
    const corpBudgets: Budget[] = [
      {
        id: 'bg_corp_01',
        userId: 'usr_corp_apex01',
        category: 'Software & Cloud Infrastructure',
        amount: 45000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_corp_02',
        userId: 'usr_corp_apex01',
        category: 'Office Lease & Facilities',
        amount: 120000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      },
      {
        id: 'bg_corp_03',
        userId: 'usr_corp_apex01',
        category: 'Marketing & Advertising',
        amount: 25000,
        period: currentPeriod,
        createdAt: new Date().toISOString()
      }
    ];

    for (const b of indBudgets) {
      this.budgets.set(b.id, b);
    }
    for (const b of corpBudgets) {
      this.budgets.set(b.id, b);
    }
  }

  async findByUserId(userId: string, period?: string): Promise<Budget[]> {
    const list: Budget[] = [];
    for (const b of this.budgets.values()) {
      if (b.userId === userId) {
        if (!period || period === 'all' || b.period === period) {
          list.push({ ...b });
        }
      }
    }
    return list.sort((a, b) => b.amount - a.amount);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Budget | undefined> {
    const b = this.budgets.get(id);
    if (!b || b.userId !== userId) {
      return undefined;
    }
    return { ...b };
  }

  async create(userId: string, data: CreateBudgetDTO): Promise<Budget> {
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const id = `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newBudget: Budget = {
      id,
      userId,
      category: data.category.trim(),
      amount: Math.abs(Number(data.amount)),
      period: data.period?.trim() || defaultPeriod,
      createdAt: new Date().toISOString()
    };

    this.budgets.set(newBudget.id, newBudget);
    return { ...newBudget };
  }

  async update(id: string, userId: string, data: UpdateBudgetDTO): Promise<Budget | undefined> {
    const b = this.budgets.get(id);
    if (!b || b.userId !== userId) {
      return undefined;
    }

    if (data.category !== undefined) {
      b.category = data.category.trim();
    }
    if (data.amount !== undefined) {
      b.amount = Math.abs(Number(data.amount));
    }
    if (data.period !== undefined) {
      b.period = data.period.trim();
    }

    return { ...b };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const b = this.budgets.get(id);
    if (!b || b.userId !== userId) {
      return false;
    }
    return this.budgets.delete(id);
  }
}

export const budgetStore = new BudgetStore();
