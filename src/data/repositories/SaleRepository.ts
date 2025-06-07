import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Sale, SaleItem } from '../models/Sale';
import { startOfDay, endOfDay } from 'date-fns';

export class SaleRepository {
  // Create a new sale with items
  static async create(sale: Omit<Sale, 'id' | 'date'>): Promise<Sale> {
    const newSale: Sale = {
      ...sale,
      id: uuidv4(),
      date: new Date()
    };
    
    await db.transaction('rw', [db.sales, db.saleItems], async () => {
      await db.sales.add(newSale);
      
      for (const item of newSale.items) {
        const saleItem: SaleItem = {
          ...item,
          id: item.id || uuidv4(),
          saleId: newSale.id
        };
        await db.saleItems.add(saleItem);
      }
    });
    
    return newSale;
  }
  
  // Get a sale by ID including items
  static async findById(id: string): Promise<Sale | null> {
    const sale = await db.sales.get(id);
    if (!sale) return null;
    
    const items = await db.saleItems
      .where('saleId')
      .equals(id)
      .toArray();
    
    return { ...sale, items };
  }
  
  // Get all sales with optional date filtering
  static async findAll(startDate?: Date, endDate?: Date): Promise<Sale[]> {
    let query = db.sales.orderBy('date').reverse();
    
    if (startDate && endDate) {
      query = query.filter(sale => 
        sale.date >= startDate && sale.date <= endDate
      );
    }
    
    const sales = await query.toArray();
    
    // Load items for each sale
    for (const sale of sales) {
      sale.items = await db.saleItems
        .where('saleId')
        .equals(sale.id)
        .toArray();
    }
    
    return sales;
  }
  
  // Get daily sales summary
  static async getDailySales(date: Date): Promise<{
    total: number;
    count: number;
    sales: Sale[];
  }> {
    const start = startOfDay(date);
    const end = endOfDay(date);
    
    const sales = await this.findAll(start, end);
    
    const completedSales = sales.filter(sale => sale.status === 'completed');
    
    return {
      total: completedSales.reduce((sum, sale) => sum + sale.total, 0),
      count: completedSales.length,
      sales: completedSales
    };
  }
  
  // Get best sellers for a date range
  static async getBestSellers(startDate: Date, endDate: Date, limit: number = 10): Promise<{
    productId: string;
    productName: string;
    quantity: number;
    totalSales: number;
  }[]> {
    const sales = await this.findAll(startDate, endDate);
    const completedSales = sales.filter(sale => sale.status === 'completed');
    
    const productSales = new Map<string, {
      productId: string;
      productName: string;
      quantity: number;
      totalSales: number;
    }>();
    
    for (const sale of completedSales) {
      for (const item of sale.items) {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          totalSales: 0
        };
        
        existing.quantity += item.quantity;
        existing.totalSales += item.total;
        
        productSales.set(item.productId, existing);
      }
    }
    
    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }
  
  // Get sales by payment method
  static async getSalesByPaymentMethod(startDate: Date, endDate: Date): Promise<{
    paymentMethod: string;
    count: number;
    total: number;
  }[]> {
    const sales = await this.findAll(startDate, endDate);
    const completedSales = sales.filter(sale => sale.status === 'completed');
    
    const methodSales = new Map<string, {
      paymentMethod: string;
      count: number;
      total: number;
    }>();
    
    for (const sale of completedSales) {
      const existing = methodSales.get(sale.paymentMethod) || {
        paymentMethod: sale.paymentMethod,
        count: 0,
        total: 0
      };
      
      existing.count++;
      existing.total += sale.total;
      
      methodSales.set(sale.paymentMethod, existing);
    }
    
    return Array.from(methodSales.values());
  }
}