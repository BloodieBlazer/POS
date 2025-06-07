import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Product } from '../models/Product';

export class ProductRepository {
  // Create a new product
  static async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.products.add(newProduct);
    return newProduct;
  }
  
  // Get a product by ID
  static async findById(id: string): Promise<Product | null> {
    return await db.products.get(id) || null;
  }
  
  // Get a product by barcode
  static async findByBarcode(barcode: string): Promise<Product | null> {
    return await db.products.where('barcode').equals(barcode).first() || null;
  }
  
  // Get all products
  static async findAll(): Promise<Product[]> {
    return await db.products.orderBy('name').toArray();
  }
  
  // Update a product
  static async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    const existingProduct = await this.findById(id);
    if (!existingProduct) return null;
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...productData,
      updatedAt: new Date()
    };
    
    await db.products.put(updatedProduct);
    return updatedProduct;
  }
  
  // Delete a product
  static async delete(id: string): Promise<boolean> {
    try {
      await db.products.delete(id);
      return true;
    } catch {
      return false;
    }
  }
  
  // Update stock quantity
  static async updateStock(id: string, quantity: number): Promise<boolean> {
    try {
      await db.transaction('rw', db.products, async () => {
        const product = await this.findById(id);
        if (!product) throw new Error('Product not found');
        
        await db.products.update(id, {
          stock: (product.stock || 0) + quantity,
          updatedAt: new Date()
        });
      });
      return true;
    } catch {
      return false;
    }
  }
  
  // Search products by name or barcode
  static async search(query: string): Promise<Product[]> {
    const searchQuery = query.toLowerCase();
    return await db.products
      .filter(product => 
        product.name.toLowerCase().includes(searchQuery) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchQuery))
      )
      .toArray();
  }
  
  // Find products by category
  static async findByCategory(category: string): Promise<Product[]> {
    const results = await db.products.where('category').equalsIgnoreCase(category).toArray();
    return results || [];
  }
}