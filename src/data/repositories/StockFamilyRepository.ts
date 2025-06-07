import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { StockFamily, StockFamilyMember } from '../models/StockFamily';
import { ProductRepository } from './ProductRepository';

export class StockFamilyRepository {
  // Create a new stock family
  static async create(stockFamily: Omit<StockFamily, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockFamily> {
    const newStockFamily: StockFamily = {
      ...stockFamily,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.stockFamilies.add(newStockFamily);
    return newStockFamily;
  }
  
  // Get a stock family by ID
  static async findById(id: string): Promise<StockFamily | null> {
    return await db.stockFamilies.get(id) || null;
  }
  
  // Get all stock families
  static async findAll(): Promise<StockFamily[]> {
    return await db.stockFamilies.orderBy('name').toArray();
  }
  
  // Get stock family members
  static async getMembers(stockFamilyId: string): Promise<StockFamilyMember[]> {
    return await db.stockFamilyMembers
      .where('stockFamilyId')
      .equals(stockFamilyId)
      .toArray();
  }
  
  // Add a product to a stock family
  static async addMember(stockFamilyId: string, productId: string, unitsPerPack: number, isBaseUnit: boolean = false): Promise<StockFamilyMember> {
    const member: StockFamilyMember = {
      id: uuidv4(),
      stockFamilyId,
      productId,
      unitsPerPack,
      isBaseUnit,
      createdAt: new Date()
    };
    
    await db.stockFamilyMembers.add(member);
    
    // Update product to reference stock family
    await ProductRepository.update(productId, { stockFamilyId });
    
    return member;
  }
  
  // Remove a product from a stock family
  static async removeMember(stockFamilyId: string, productId: string): Promise<boolean> {
    try {
      await db.transaction('rw', [db.stockFamilyMembers, db.products], async () => {
        // Remove from stock family
        await db.stockFamilyMembers
          .where(['stockFamilyId', 'productId'])
          .equals([stockFamilyId, productId])
          .delete();
        
        // Remove stock family reference from product
        await ProductRepository.update(productId, { stockFamilyId: undefined });
      });
      
      return true;
    } catch {
      return false;
    }
  }
  
  // Update stock family total stock
  static async updateTotalStock(stockFamilyId: string, newTotalStock: number): Promise<boolean> {
    try {
      await db.stockFamilies.update(stockFamilyId, {
        totalStock: newTotalStock,
        updatedAt: new Date()
      });
      
      return true;
    } catch {
      return false;
    }
  }
  
  // Deduct stock from family (when a sale is made)
  static async deductStock(productId: string, quantity: number): Promise<boolean> {
    try {
      await db.transaction('rw', [db.stockFamilies, db.stockFamilyMembers, db.products], async () => {
        // Find the stock family member for this product
        const member = await db.stockFamilyMembers
          .where('productId')
          .equals(productId)
          .first();
        
        if (!member) {
          // Product is not part of a stock family, handle normally
          await ProductRepository.updateStock(productId, -quantity);
          return;
        }
        
        // Calculate base units to deduct
        const baseUnitsToDeduct = quantity * member.unitsPerPack;
        
        // Get stock family
        const stockFamily = await this.findById(member.stockFamilyId);
        if (!stockFamily) throw new Error('Stock family not found');
        
        // Check if we have enough stock
        if (stockFamily.totalStock < baseUnitsToDeduct) {
          throw new Error('Insufficient stock in family');
        }
        
        // Update stock family total
        await this.updateTotalStock(member.stockFamilyId, stockFamily.totalStock - baseUnitsToDeduct);
        
        // Update individual product stock for display purposes
        await ProductRepository.updateStock(productId, -quantity);
      });
      
      return true;
    } catch (error) {
      console.error('Error deducting stock from family:', error);
      return false;
    }
  }
  
  // Get stock family by product ID
  static async findByProductId(productId: string): Promise<StockFamily | null> {
    const member = await db.stockFamilyMembers
      .where('productId')
      .equals(productId)
      .first();
    
    if (!member) return null;
    
    return await this.findById(member.stockFamilyId);
  }
  
  // Calculate available stock for a product considering stock family
  static async getAvailableStock(productId: string): Promise<number> {
    const member = await db.stockFamilyMembers
      .where('productId')
      .equals(productId)
      .first();
    
    if (!member) {
      // Product is not part of a stock family
      const product = await ProductRepository.findById(productId);
      return product?.stock || 0;
    }
    
    const stockFamily = await this.findById(member.stockFamilyId);
    if (!stockFamily) return 0;
    
    // Calculate how many of this product can be made from available base units
    return Math.floor(stockFamily.totalStock / member.unitsPerPack);
  }
  
  // Delete a stock family
  static async delete(id: string): Promise<boolean> {
    try {
      await db.transaction('rw', [db.stockFamilies, db.stockFamilyMembers, db.products], async () => {
        // Remove all members
        const members = await this.getMembers(id);
        for (const member of members) {
          await ProductRepository.update(member.productId, { stockFamilyId: undefined });
        }
        
        await db.stockFamilyMembers.where('stockFamilyId').equals(id).delete();
        await db.stockFamilies.delete(id);
      });
      
      return true;
    } catch {
      return false;
    }
  }
}