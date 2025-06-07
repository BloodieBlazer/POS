import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Customer, CustomerTransaction } from '../models/Customer';

export class CustomerRepository {
  // Create a new customer
  static async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.customers.add(newCustomer);
    return newCustomer;
  }
  
  // Get a customer by ID
  static async findById(id: string): Promise<Customer | null> {
    return await db.customers.get(id) || null;
  }
  
  // Get a customer by email
  static async findByEmail(email: string): Promise<Customer | null> {
    return await db.customers.where('email').equals(email).first() || null;
  }
  
  // Get a customer by phone
  static async findByPhone(phone: string): Promise<Customer | null> {
    return await db.customers.where('phone').equals(phone).first() || null;
  }
  
  // Search customers by name, email, or phone
  static async search(query: string): Promise<Customer[]> {
    const searchQuery = query.toLowerCase();
    return await db.customers
      .filter(customer => 
        customer.firstName.toLowerCase().includes(searchQuery) ||
        customer.lastName.toLowerCase().includes(searchQuery) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery)) ||
        (customer.phone && customer.phone.includes(searchQuery))
      )
      .toArray();
  }
  
  // Get all customers
  static async findAll(): Promise<Customer[]> {
    return await db.customers.orderBy('firstName').toArray();
  }
  
  // Update a customer
  static async update(id: string, customerData: Partial<Customer>): Promise<Customer | null> {
    const existingCustomer = await this.findById(id);
    if (!existingCustomer) return null;
    
    const updatedCustomer: Customer = {
      ...existingCustomer,
      ...customerData,
      updatedAt: new Date()
    };
    
    await db.customers.put(updatedCustomer);
    return updatedCustomer;
  }
  
  // Delete a customer
  static async delete(id: string): Promise<boolean> {
    try {
      await db.customers.delete(id);
      return true;
    } catch {
      return false;
    }
  }
  
  // Update customer credit balance
  static async updateCreditBalance(id: string, amount: number, description: string, saleId?: string): Promise<boolean> {
    try {
      await db.transaction('rw', [db.customers, db.customerTransactions], async () => {
        const customer = await this.findById(id);
        if (!customer) throw new Error('Customer not found');
        
        const newBalance = customer.creditBalance + amount;
        
        // Update customer balance
        await db.customers.update(id, {
          creditBalance: newBalance,
          updatedAt: new Date()
        });
        
        // Record transaction
        const transaction: CustomerTransaction = {
          id: uuidv4(),
          customerId: id,
          type: amount > 0 ? 'credit_add' : 'credit_deduct',
          amount: Math.abs(amount),
          description,
          saleId,
          createdAt: new Date()
        };
        
        await db.customerTransactions.add(transaction);
      });
      
      return true;
    } catch (error) {
      console.error('Error updating customer credit balance:', error);
      return false;
    }
  }
  
  // Get customer transaction history
  static async getTransactionHistory(customerId: string): Promise<CustomerTransaction[]> {
    return await db.customerTransactions
      .where('customerId')
      .equals(customerId)
      .orderBy('createdAt')
      .reverse()
      .toArray();
  }
  
  // Update customer purchase stats
  static async updatePurchaseStats(customerId: string, purchaseAmount: number): Promise<void> {
    const customer = await this.findById(customerId);
    if (customer) {
      await this.update(customerId, {
        totalPurchases: customer.totalPurchases + purchaseAmount,
        lastPurchaseDate: new Date()
      });
    }
  }
}