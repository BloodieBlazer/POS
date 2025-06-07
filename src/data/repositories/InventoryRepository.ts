import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { InventoryMovement, StockAdjustment } from '../models/InventoryMovement';
import { ProductRepository } from './ProductRepository';
import { StockFamilyRepository } from './StockFamilyRepository';

export class InventoryRepository {
  // Record inventory movement
  static async recordMovement(movement: Omit<InventoryMovement, 'id' | 'createdAt'>): Promise<InventoryMovement> {
    const newMovement: InventoryMovement = {
      ...movement,
      id: uuidv4(),
      createdAt: new Date()
    };
    
    await db.inventoryMovements.add(newMovement);
    return newMovement;
  }
  
  // Create stock adjustment
  static async createStockAdjustment(
    productId: string,
    adjustmentType: 'increase' | 'decrease' | 'set',
    quantity: number,
    reason: string,
    userId: string,
    userName: string
  ): Promise<boolean> {
    try {
      await db.transaction('rw', [db.products, db.stockAdjustments, db.inventoryMovements], async () => {
        const product = await ProductRepository.findById(productId);
        if (!product) throw new Error('Product not found');
        
        const previousStock = product.stock;
        let newStock: number;
        
        switch (adjustmentType) {
          case 'increase':
            newStock = previousStock + quantity;
            break;
          case 'decrease':
            newStock = Math.max(0, previousStock - quantity);
            break;
          case 'set':
            newStock = quantity;
            break;
          default:
            throw new Error('Invalid adjustment type');
        }
        
        // Update product stock
        await ProductRepository.update(productId, { stock: newStock });
        
        // Update stock family if applicable
        const stockFamily = await StockFamilyRepository.findByProductId(productId);
        if (stockFamily) {
          const stockChange = newStock - previousStock;
          await StockFamilyRepository.updateTotalStock(
            stockFamily.id,
            stockFamily.totalStock + stockChange
          );
        }
        
        // Record adjustment
        const adjustment: StockAdjustment = {
          id: uuidv4(),
          productId,
          adjustmentType,
          quantity,
          reason,
          userId,
          userName,
          createdAt: new Date()
        };
        
        await db.stockAdjustments.add(adjustment);
        
        // Record movement
        await this.recordMovement({
          productId,
          productName: product.name,
          movementType: 'adjustment',
          quantity: newStock - previousStock,
          previousStock,
          newStock,
          reason,
          referenceId: adjustment.id,
          userId,
          userName
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      return false;
    }
  }
  
  // Get inventory movements for a product
  static async getProductMovements(productId: string, limit?: number): Promise<InventoryMovement[]> {
    let query = db.inventoryMovements
      .where('productId')
      .equals(productId)
      .orderBy('createdAt')
      .reverse();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query.toArray();
  }
  
  // Get all inventory movements
  static async getAllMovements(startDate?: Date, endDate?: Date): Promise<InventoryMovement[]> {
    let query = db.inventoryMovements.orderBy('createdAt').reverse();
    
    if (startDate && endDate) {
      query = query.filter(movement => 
        movement.createdAt >= startDate && movement.createdAt <= endDate
      );
    }
    
    return await query.toArray();
  }
  
  // Get stock adjustments
  static async getStockAdjustments(startDate?: Date, endDate?: Date): Promise<StockAdjustment[]> {
    let query = db.stockAdjustments.orderBy('createdAt').reverse();
    
    if (startDate && endDate) {
      query = query.filter(adjustment => 
        adjustment.createdAt >= startDate && adjustment.createdAt <= endDate
      );
    }
    
    return await query.toArray();
  }
  
  // Record sale movement
  static async recordSaleMovement(
    productId: string,
    productName: string,
    quantity: number,
    saleId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const product = await ProductRepository.findById(productId);
    if (!product) return;
    
    await this.recordMovement({
      productId,
      productName,
      movementType: 'sale',
      quantity: -quantity,
      previousStock: product.stock + quantity,
      newStock: product.stock,
      referenceId: saleId,
      userId,
      userName
    });
  }
  
  // Get low stock products
  static async getLowStockProducts(threshold: number = 5): Promise<any[]> {
    const products = await ProductRepository.findAll();
    return products.filter(product => product.stock <= threshold);
  }
  
  // Get stock value report
  static async getStockValueReport(): Promise<{
    totalProducts: number;
    totalStockValue: number;
    totalCostValue: number;
    categories: { [category: string]: { count: number; value: number; cost: number } };
  }> {
    const products = await ProductRepository.findAll();
    
    let totalStockValue = 0;
    let totalCostValue = 0;
    const categories: { [category: string]: { count: number; value: number; cost: number } } = {};
    
    for (const product of products) {
      const stockValue = product.stock * product.price;
      const costValue = product.stock * product.costPrice;
      
      totalStockValue += stockValue;
      totalCostValue += costValue;
      
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { count: 0, value: 0, cost: 0 };
      }
      
      categories[category].count += product.stock;
      categories[category].value += stockValue;
      categories[category].cost += costValue;
    }
    
    return {
      totalProducts: products.length,
      totalStockValue,
      totalCostValue,
      categories
    };
  }
}