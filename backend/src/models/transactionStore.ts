export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
}

export interface CreateTransactionDTO {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  paymentMethod?: string;
  description?: string;
}

export interface UpdateTransactionDTO {
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  date?: string;
  paymentMethod?: string;
  description?: string;
}

class TransactionStore {
  private transactions: Map<string, Transaction> = new Map();

  constructor() {
    this.seedDemoTransactions();
  }

  private seedDemoTransactions() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dStr = (d: number) => `${yyyy}-${mm}-${String(Math.min(d, 28)).padStart(2, '0')}`;

    // Pre-seeded transactions for Individual demo user (usr_ind_alex01)
    const indTransactions: Transaction[] = [
      {
        id: 'tx_ind_01',
        userId: 'usr_ind_alex01',
        amount: 4500,
        type: 'expense',
        category: 'Food & Dining',
        date: dStr(24),
        paymentMethod: 'Credit Card',
        description: 'Whole Foods Market grocery run',
        createdAt: new Date(`${dStr(24)}T10:30:00Z`).toISOString()
      },
      {
        id: 'tx_ind_02',
        userId: 'usr_ind_alex01',
        amount: 649,
        type: 'expense',
        category: 'Entertainment',
        date: dStr(22),
        paymentMethod: 'UPI / Wallet',
        description: 'Netflix Monthly Premium',
        createdAt: new Date(`${dStr(22)}T08:15:00Z`).toISOString()
      },
      {
        id: 'tx_ind_03',
        userId: 'usr_ind_alex01',
        amount: 75000,
        type: 'income',
        category: 'Salary & Income',
        date: dStr(20),
        paymentMethod: 'Bank Transfer',
        description: 'Tech Corp Inc. Monthly Compensation',
        createdAt: new Date(`${dStr(20)}T09:00:00Z`).toISOString()
      },
      {
        id: 'tx_ind_04',
        userId: 'usr_ind_alex01',
        amount: 22000,
        type: 'expense',
        category: 'Housing & Rent',
        date: dStr(5),
        paymentMethod: 'Bank Transfer',
        description: 'Monthly Apartment Lease',
        createdAt: new Date(`${dStr(5)}T11:00:00Z`).toISOString()
      },
      {
        id: 'tx_ind_05',
        userId: 'usr_ind_alex01',
        amount: 3200,
        type: 'expense',
        category: 'Utilities & Bills',
        date: dStr(10),
        paymentMethod: 'UPI / Wallet',
        description: 'Electricity & High-speed Fiber Internet',
        createdAt: new Date(`${dStr(10)}T14:30:00Z`).toISOString()
      }
    ];

    // Pre-seeded transactions for Corporate demo user (usr_corp_apex01)
    const corpTransactions: Transaction[] = [
      {
        id: 'tx_corp_01',
        userId: 'usr_corp_apex01',
        amount: 250000,
        type: 'income',
        category: 'Client Retainers',
        date: dStr(25),
        paymentMethod: 'Bank Transfer',
        description: 'Acme Enterprise Q4 Strategy Retainer',
        createdAt: new Date(`${dStr(25)}T11:00:00Z`).toISOString()
      },
      {
        id: 'tx_corp_02',
        userId: 'usr_corp_apex01',
        amount: 34200,
        type: 'expense',
        category: 'Software & Cloud Infrastructure',
        date: dStr(23),
        paymentMethod: 'Credit Card',
        description: 'AWS Cloud Hosting & Cluster Usage',
        createdAt: new Date(`${dStr(23)}T14:20:00Z`).toISOString()
      },
      {
        id: 'tx_corp_03',
        userId: 'usr_corp_apex01',
        amount: 115000,
        type: 'expense',
        category: 'Office Lease & Facilities',
        date: dStr(15),
        paymentMethod: 'Bank Transfer',
        description: 'Downtown Apex Tower Office Space Lease',
        createdAt: new Date(`${dStr(15)}T09:30:00Z`).toISOString()
      },
      {
        id: 'tx_corp_04',
        userId: 'usr_corp_apex01',
        amount: 18500,
        type: 'expense',
        category: 'Marketing & Advertising',
        date: dStr(8),
        paymentMethod: 'Credit Card',
        description: 'Q3 Enterprise Demand Gen Ad Spend',
        createdAt: new Date(`${dStr(8)}T16:00:00Z`).toISOString()
      }
    ];

    for (const tx of indTransactions) {
      this.transactions.set(tx.id, tx);
    }
    for (const tx of corpTransactions) {
      this.transactions.set(tx.id, tx);
    }
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const list: Transaction[] = [];
    for (const tx of this.transactions.values()) {
      if (tx.userId === userId) {
        list.push({ ...tx });
      }
    }
    // Return newest transactions first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx || tx.userId !== userId) {
      return undefined;
    }
    return { ...tx };
  }

  async create(userId: string, data: CreateTransactionDTO): Promise<Transaction> {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      id,
      userId,
      amount: Math.abs(Number(data.amount)),
      type: data.type,
      category: data.category.trim(),
      date: data.date.trim(),
      paymentMethod: data.paymentMethod?.trim() || 'Other',
      description: data.description?.trim() || '',
      createdAt: new Date().toISOString()
    };

    this.transactions.set(newTx.id, newTx);
    return { ...newTx };
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTransactionDTO
  ): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx || tx.userId !== userId) {
      return undefined;
    }

    if (data.amount !== undefined) {
      tx.amount = Math.abs(Number(data.amount));
    }
    if (data.type !== undefined) {
      tx.type = data.type;
    }
    if (data.category !== undefined) {
      tx.category = data.category.trim();
    }
    if (data.date !== undefined) {
      tx.date = data.date.trim();
    }
    if (data.paymentMethod !== undefined) {
      tx.paymentMethod = data.paymentMethod.trim();
    }
    if (data.description !== undefined) {
      tx.description = data.description.trim();
    }

    return { ...tx };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const tx = this.transactions.get(id);
    if (!tx || tx.userId !== userId) {
      return false;
    }
    return this.transactions.delete(id);
  }
}

export const transactionStore = new TransactionStore();
