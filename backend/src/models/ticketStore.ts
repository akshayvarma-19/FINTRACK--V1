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

export interface CreateTicketDTO {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface UpdateTicketDTO {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
}

class TicketStore {
  private tickets: Map<string, Ticket> = new Map();

  constructor() {
    this.seedDemoTickets();
  }

  private seedDemoTickets() {
    const now = new Date();
    const dStr = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString();
    };

    // Pre-seeded demo tickets for Individual user (usr_ind_alex01)
    const indTicket1: Ticket = {
      id: 'tkt_ind_01',
      userId: 'usr_ind_alex01',
      subject: 'Clarification on multi-currency foreign exchange tracking',
      description: 'Could you explain how international transactions in USD are converted into INR when imported into the expense ledger?',
      category: 'Transaction',
      priority: 'Medium',
      status: 'Open',
      createdAt: dStr(3),
      updatedAt: dStr(3)
    };

    const indTicket2: Ticket = {
      id: 'tkt_ind_02',
      userId: 'usr_ind_alex01',
      subject: 'Custom budget cycle configuration',
      description: 'Is it possible to set customized budget cycles that start on the 10th of every month rather than the 1st?',
      category: 'Dashboard',
      priority: 'Low',
      status: 'Resolved',
      createdAt: dStr(12),
      updatedAt: dStr(8)
    };

    // Pre-seeded demo ticket for Corporate user (usr_corp_apex01)
    const corpTicket1: Ticket = {
      id: 'tkt_corp_01',
      userId: 'usr_corp_apex01',
      subject: 'Enterprise departmental ledger export and audit trails',
      description: 'Requesting assistance with automated scheduled PDF exports of monthly executive payroll and cloud infrastructure expenses for compliance audits.',
      category: 'Technical Issue',
      priority: 'High',
      status: 'In Progress',
      createdAt: dStr(2),
      updatedAt: dStr(1)
    };

    this.tickets.set(indTicket1.id, indTicket1);
    this.tickets.set(indTicket2.id, indTicket2);
    this.tickets.set(corpTicket1.id, corpTicket1);
  }

  async findByUserId(userId: string): Promise<Ticket[]> {
    const userTickets: Ticket[] = [];
    for (const ticket of this.tickets.values()) {
      if (ticket.userId === userId) {
        userTickets.push({ ...ticket });
      }
    }
    // Return newest first by createdAt
    return userTickets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string, userId: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket || ticket.userId !== userId) {
      return undefined;
    }
    return { ...ticket };
  }

  async create(userId: string, data: CreateTicketDTO): Promise<Ticket> {
    const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newTicket: Ticket = {
      id,
      userId,
      subject: data.subject.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      status: 'Open',
      createdAt: now,
      updatedAt: now
    };

    this.tickets.set(id, newTicket);
    return { ...newTicket };
  }

  async update(
    id: string,
    userId: string,
    updates: UpdateTicketDTO
  ): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket || ticket.userId !== userId) {
      return undefined;
    }

    if (updates.subject !== undefined) {
      ticket.subject = updates.subject.trim();
    }
    if (updates.description !== undefined) {
      ticket.description = updates.description.trim();
    }
    if (updates.category !== undefined) {
      ticket.category = updates.category;
    }
    if (updates.priority !== undefined) {
      ticket.priority = updates.priority;
    }
    if (updates.status !== undefined) {
      ticket.status = updates.status;
    }

    ticket.updatedAt = new Date().toISOString();
    return { ...ticket };
  }
}

export const ticketStore = new TicketStore();
