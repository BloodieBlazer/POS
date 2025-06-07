import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Bundle, BundleProduct, BundleApplication } from '../models/Bundle';
import { SaleItem } from '../models/Sale';
import { ProductRepository } from './ProductRepository';

export class BundleRepository {
  // Create a new bundle
  static async create(bundle: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bundle> {
    const newBundle: Bundle = {
      ...bundle,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.bundles.add(newBundle);
    return newBundle;
  }
  
  // Get a bundle by ID
  static async findById(id: string): Promise<Bundle | null> {
    return await db.bundles.get(id) || null;
  }
  
  // Get all active bundles
  static async findActive(): Promise<Bundle[]> {
    const now = new Date();
    return await db.bundles
      .filter(bundle => 
        bundle.isActive && 
        (!bundle.validFrom || bundle.validFrom <= now) &&
        (!bundle.validTo || bundle.validTo >= now)
      )
      .toArray();
  }
  
  // Get all bundles
  static async findAll(): Promise<Bundle[]> {
    return await db.bundles.orderBy('name').toArray();
  }
  
  // Add a product to a bundle
  static async addProduct(bundleId: string, productId: string): Promise<BundleProduct> {
    const product = await ProductRepository.findById(productId);
    const bundleProduct: BundleProduct = {
      id: uuidv4(),
      bundleId,
      productId,
      productName: product?.name,
      createdAt: new Date()
    };
    
    await db.bundleProducts.add(bundleProduct);
    return bundleProduct;
  }
  
  // Remove a product from a bundle
  static async removeProduct(bundleId: string, productId: string): Promise<boolean> {
    try {
      await db.bundleProducts
        .where(['bundleId', 'productId'])
        .equals([bundleId, productId])
        .delete();
      return true;
    } catch {
      return false;
    }
  }
  
  // Get bundle products
  static async getBundleProducts(bundleId: string): Promise<BundleProduct[]> {
    return await db.bundleProducts
      .where('bundleId')
      .equals(bundleId)
      .toArray();
  }
  
  // Calculate applicable bundles for cart items
  static async calculateBundleApplications(cartItems: SaleItem[]): Promise<BundleApplication[]> {
    const activeBundles = await this.findActive();
    const applications: BundleApplication[] = [];
    
    for (const bundle of activeBundles) {
      const bundleProducts = await this.getBundleProducts(bundle.id);
      const bundleProductIds = bundleProducts.map(bp => bp.productId);
      
      // Find cart items that are part of this bundle
      const applicableItems = cartItems.filter(item => 
        bundleProductIds.includes(item.productId)
      );
      
      if (applicableItems.length === 0) continue;
      
      // Calculate total quantity of applicable items
      const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
      
      // Check if we meet minimum quantity
      if (totalQuantity < bundle.minimumQuantity) continue;
      
      // Calculate how many bundles we can apply
      const bundleQuantity = Math.floor(totalQuantity / bundle.minimumQuantity);
      
      if (bundleQuantity === 0) continue;
      
      // Calculate savings
      const originalTotal = applicableItems.reduce((sum, item) => sum + item.total, 0);
      const bundleTotal = bundleQuantity * bundle.bundlePrice;
      const savings = originalTotal - bundleTotal;
      
      if (savings > 0) {
        applications.push({
          bundleId: bundle.id,
          bundleName: bundle.name,
          applicableItems: applicableItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            originalPrice: item.price
          })),
          bundleQuantity,
          originalTotal,
          bundleTotal,
          savings
        });
      }
    }
    
    // Sort by savings (highest first)
    return applications.sort((a, b) => b.savings - a.savings);
  }
  
  // Update a bundle
  static async update(id: string, bundleData: Partial<Bundle>): Promise<Bundle | null> {
    const existingBundle = await this.findById(id);
    if (!existingBundle) return null;
    
    const updatedBundle: Bundle = {
      ...existingBundle,
      ...bundleData,
      updatedAt: new Date()
    };
    
    await db.bundles.put(updatedBundle);
    return updatedBundle;
  }
  
  // Delete a bundle
  static async delete(id: string): Promise<boolean> {
    try {
      await db.transaction('rw', [db.bundles, db.bundleProducts], async () => {
        await db.bundleProducts.where('bundleId').equals(id).delete();
        await db.bundles.delete(id);
      });
      return true;
    } catch {
      return false;
    }
  }
}