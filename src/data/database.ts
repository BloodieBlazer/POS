import Dexie, { Table } from 'dexie';
import { Product } from './models/Product';
import { Sale, SaleItem } from './models/Sale';

export class RetailDatabase extends Dexie {
  products!: Table<Product>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;

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