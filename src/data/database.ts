import Dexie, { Table } from 'dexie';
import { Product } from './models/Product';
import { Sale, SaleItem } from './models/Sale';
import { Customer, CustomerTransaction } from './models/Customer';
import { StockFamily, StockFamilyMember } from './models/StockFamily';
import { Bundle, BundleProduct } from './models/Bundle';
import { Shift } from './models/Shift';
import { User, UserSession } from './models/User';
import { InventoryMovement, StockAdjustment } from './models/InventoryMovement';

export class RetailDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  customers!: Table<Customer>;
  customerTransactions!: Table<CustomerTransaction>;
  stockFamilies!: Table<StockFamily>;
  stockFamilyMembers!: Table<StockFamilyMember>;
  bundles!: Table<Bundle>;
  bundleProducts!: Table<BundleProduct>;
  shifts!: Table<Shift>;
  users!: Table<User>;
  userSessions!: Table<UserSession>;
  inventoryMovements!: Table<InventoryMovement>;
  stockAdjustments!: Table<StockAdjustment>;

  constructor() {
    super('RetailPOS');
    
    this.version(1).stores({
      products: 'id, barcode, name, category',
      sales: 'id, date, status, payment_method',
      saleItems: 'id, sale_id, product_id'
    });

    this.version(2).stores({
      products: 'id, barcode, name, category',
      sales: 'id, date, status, payment_method',
      saleItems: 'id, saleId, product_id'
    });

    this.version(3).stores({
      products: 'id, barcode, name, category, stockFamilyId',
      sales: 'id, date, status, payment_method, customerId, shiftId',
      saleItems: 'id, saleId, product_id',
      customers: 'id, email, phone, firstName, lastName',
      customerTransactions: 'id, customerId, type, createdAt',
      stockFamilies: 'id, name, category, baseProductId',
      stockFamilyMembers: 'id, stockFamilyId, productId',
      bundles: 'id, name, isActive, minimumQuantity',
      bundleProducts: 'id, bundleId, productId',
      shifts: 'id, userId, status, startTime',
      users: 'id, email, role, isActive',
      userSessions: 'id, userId, loginTime',
      inventoryMovements: 'id, productId, movementType, createdAt, userId',
      stockAdjustments: 'id, productId, adjustmentType, createdAt, userId'
    });
  }
}

export const db = new RetailDatabase();

export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}