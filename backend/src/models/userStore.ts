import bcrypt from 'bcryptjs';

export type AccountType = 'individual' | 'corporate';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  accountType: AccountType;
  phone?: string;
  createdAt: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  phone?: string;
  createdAt?: string;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  phone: string;
  createdAt: string;
}

// In-memory prototype store with pre-seeded demo accounts
class UserStore {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedDemoUsers();
  }

  private seedDemoUsers() {
    // Hash for default dev password: "fintrack2026"
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('fintrack2026', salt);

    const individualUser: User = {
      id: 'usr_ind_alex01',
      name: 'Alex Morgan',
      email: 'alex.morgan@fintrack.io',
      passwordHash: demoPasswordHash,
      accountType: 'individual',
      phone: '+91 98765 43210',
      createdAt: new Date().toISOString()
    };

    const corporateUser: User = {
      id: 'usr_corp_apex01',
      name: 'Apex Global Enterprises',
      email: 'admin@apexglobal.io',
      passwordHash: demoPasswordHash,
      accountType: 'corporate',
      phone: '+91 80 4123 4567',
      createdAt: new Date().toISOString()
    };

    this.users.set(individualUser.email.toLowerCase(), individualUser);
    this.users.set(corporateUser.email.toLowerCase(), corporateUser);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.get(email.toLowerCase().trim());
  }

  async findById(id: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return undefined;
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    accountType: AccountType;
    phone?: string;
  }): Promise<User> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: User = {
      id,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      accountType: data.accountType,
      phone: data.phone?.trim() || '',
      createdAt: new Date().toISOString()
    };

    this.users.set(newUser.email, newUser);
    return newUser;
  }

  async updateProfile(
    id: string,
    updates: { name?: string; phone?: string }
  ): Promise<User | undefined> {
    const user = await this.findById(id);
    if (!user) {
      return undefined;
    }
    if (updates.name !== undefined) {
      user.name = updates.name.trim();
    }
    if (updates.phone !== undefined) {
      user.phone = updates.phone.trim();
    }
    return user;
  }

  toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      phone: user.phone || '',
      createdAt: user.createdAt
    };
  }

  toUserProfile(user: User): UserProfileResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      phone: user.phone || '',
      createdAt: user.createdAt
    };
  }
}

export const userStore = new UserStore();
