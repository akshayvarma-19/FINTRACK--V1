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

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type: NotificationType;
}

class NotificationStore {
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    this.seedDemoNotifications();
  }

  private seedDemoNotifications() {
    const now = new Date();
    const dStr = (minutesAgo: number) => {
      const d = new Date(now.getTime() - minutesAgo * 60 * 1000);
      return d.toISOString();
    };

    // Pre-seeded demo notifications for Individual user (usr_ind_alex01)
    const indNotifications: Notification[] = [
      {
        id: 'ntf_ind_01',
        userId: 'usr_ind_alex01',
        title: 'Welcome to FINTRACK v1',
        message: 'Your account is secured with JWT authentication and financial encryption protocols.',
        type: 'system',
        isRead: false,
        createdAt: dStr(120)
      },
      {
        id: 'ntf_ind_02',
        userId: 'usr_ind_alex01',
        title: 'Salary Deposit Credited',
        message: '₹85,000.00 credited to your primary account from TechCorp Solutions.',
        type: 'transaction',
        isRead: false,
        createdAt: dStr(90)
      },
      {
        id: 'ntf_ind_03',
        userId: 'usr_ind_alex01',
        title: 'Budget Warning: Food & Dining',
        message: 'You have utilized 85% of your ₹5,000 monthly food allowance.',
        type: 'budget',
        isRead: true,
        createdAt: dStr(45)
      },
      {
        id: 'ntf_ind_04',
        userId: 'usr_ind_alex01',
        title: 'AI Financial Advice Ready',
        message: 'Your financial health score was updated with 3 personalized savings recommendations.',
        type: 'ai',
        isRead: false,
        createdAt: dStr(20)
      },
      {
        id: 'ntf_ind_05',
        userId: 'usr_ind_alex01',
        title: 'Support Ticket #tkt_ind_01 Updated',
        message: 'Support desk has marked your FX conversion query as In Progress.',
        type: 'support',
        isRead: true,
        createdAt: dStr(10)
      }
    ];

    // Pre-seeded demo notifications for Corporate user (usr_corp_apex01)
    const corpNotifications: Notification[] = [
      {
        id: 'ntf_corp_01',
        userId: 'usr_corp_apex01',
        title: 'Enterprise Workspace Active',
        message: 'Apex Global Holdings multi-entity treasury tier active.',
        type: 'system',
        isRead: false,
        createdAt: dStr(180)
      },
      {
        id: 'ntf_corp_02',
        userId: 'usr_corp_apex01',
        title: 'Client Retainer Received',
        message: '₹4,50,000.00 received for enterprise cloud consulting invoice.',
        type: 'transaction',
        isRead: false,
        createdAt: dStr(110)
      },
      {
        id: 'ntf_corp_03',
        userId: 'usr_corp_apex01',
        title: 'Corporate SLA Ticket #tkt_corp_01',
        message: 'Tier-1 specialist assigned to your GST invoice reconciliation request.',
        type: 'support',
        isRead: true,
        createdAt: dStr(60)
      },
      {
        id: 'ntf_corp_04',
        userId: 'usr_corp_apex01',
        title: 'Budget Alert: Marketing & Growth',
        message: 'Quarterly ad spending has reached 88% of threshold allocation.',
        type: 'budget',
        isRead: false,
        createdAt: dStr(15)
      }
    ];

    for (const n of indNotifications) {
      this.notifications.set(n.id, n);
    }
    for (const n of corpNotifications) {
      this.notifications.set(n.id, n);
    }
  }

  async findByUserId(
    userId: string,
    filter?: { type?: string; isRead?: boolean }
  ): Promise<Notification[]> {
    const list: Notification[] = [];
    for (const n of this.notifications.values()) {
      if (n.userId !== userId) continue;
      if (filter?.type && filter.type !== 'all' && n.type !== filter.type) continue;
      if (filter?.isRead !== undefined && n.isRead !== filter.isRead) continue;
      list.push({ ...n });
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  async findById(id: string, userId: string): Promise<Notification | undefined> {
    const n = this.notifications.get(id);
    if (!n || n.userId !== userId) return undefined;
    return { ...n };
  }

  async create(userId: string, data: CreateNotificationDTO): Promise<Notification> {
    const id = `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNotif: Notification = {
      id,
      userId,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.set(id, newNotif);
    return { ...newNotif };
  }

  async markAsRead(id: string, userId: string): Promise<Notification | undefined> {
    const n = this.notifications.get(id);
    if (!n || n.userId !== userId) return undefined;
    n.isRead = true;
    return { ...n };
  }

  async markAllAsRead(userId: string): Promise<number> {
    let updatedCount = 0;
    for (const n of this.notifications.values()) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updatedCount++;
      }
    }
    return updatedCount;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const n = this.notifications.get(id);
    if (!n || n.userId !== userId) return false;
    return this.notifications.delete(id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    let count = 0;
    for (const n of this.notifications.values()) {
      if (n.userId === userId && !n.isRead) {
        count++;
      }
    }
    return count;
  }
}

export const notificationStore = new NotificationStore();
