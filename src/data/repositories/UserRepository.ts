import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { User, UserSession } from '../models/User';

export class UserRepository {
  // Create a new user
  static async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.users.add(newUser);
    return newUser;
  }
  
  // Get a user by ID
  static async findById(id: string): Promise<User | null> {
    return await db.users.get(id) || null;
  }
  
  // Get a user by email
  static async findByEmail(email: string): Promise<User | null> {
    return await db.users.where('email').equals(email).first() || null;
  }
  
  // Get all users
  static async findAll(): Promise<User[]> {
    return await db.users.orderBy('firstName').toArray();
  }
  
  // Get active users
  static async findActive(): Promise<User[]> {
    return await db.users
      .where('isActive')
      .equals(true)
      .toArray();
  }
  
  // Update a user
  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) return null;
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date()
    };
    
    await db.users.put(updatedUser);
    return updatedUser;
  }
  
  // Delete a user (soft delete by setting isActive to false)
  static async delete(id: string): Promise<boolean> {
    try {
      await this.update(id, { isActive: false });
      return true;
    } catch {
      return false;
    }
  }
  
  // Update last login
  static async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLogin: new Date() });
  }
  
  // Create user session
  static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const session: UserSession = {
      id: uuidv4(),
      userId,
      loginTime: new Date(),
      ipAddress,
      userAgent
    };
    
    await db.userSessions.add(session);
    await this.updateLastLogin(userId);
    
    return session;
  }
  
  // End user session
  static async endSession(sessionId: string): Promise<void> {
    await db.userSessions.update(sessionId, {
      logoutTime: new Date()
    });
  }
  
  // Get user sessions
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    return await db.userSessions
      .where('userId')
      .equals(userId)
      .orderBy('loginTime')
      .reverse()
      .toArray();
  }
  
  // Check if user has permission
  static hasPermission(user: User, permission: string): boolean {
    const permissions = {
      admin: ['*'], // Admin has all permissions
      manager: [
        'sales.create',
        'sales.refund',
        'products.view',
        'products.edit',
        'inventory.adjust',
        'reports.view',
        'shifts.manage',
        'customers.manage',
        'bundles.manage'
      ],
      cashier: [
        'sales.create',
        'products.view',
        'customers.view',
        'shifts.own'
      ]
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }
}