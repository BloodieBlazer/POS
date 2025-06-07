export interface Sale {
  id: string;
  date: Date;
  total: number;
  subtotal: number;
  tax: number;
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
  status: 'pending' | 'completed' | 'cancelled';
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName?: string; // For display purposes
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentDetails {
  cashAmount?: number;
  eftAmount?: number;
  changeAmount?: number;
  eftReference?: string;
}

// Helper to convert database row to Sale object
export function rowToSale(row: any): Sale {
  return {
    id: row.id,
    date: new Date(row.date),
    total: row.total,
    subtotal: row.subtotal,
    tax: row.tax,
    paymentMethod: row.payment_method,
    paymentDetails: row.payment_details ? JSON.parse(row.payment_details) : undefined,
    status: row.status as 'pending' | 'completed' | 'cancelled',
    items: [] // Items are loaded separately
  };
}

// Helper to convert Sale object to database row
export function saleToRow(sale: Sale): any {
  return {
    id: sale.id,
    total: sale.total,
    subtotal: sale.subtotal,
    tax: sale.tax,
    payment_method: sale.paymentMethod,
    payment_details: sale.paymentDetails ? JSON.stringify(sale.paymentDetails) : null,
    status: sale.status
  };
}

// Helper to convert database row to SaleItem object
export function rowToSaleItem(row: any): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    price: row.price,
    total: row.total
  };
}

// Helper to convert SaleItem object to database row
export function saleItemToRow(item: SaleItem): any {
  return {
    id: item.id,
    sale_id: item.saleId,
    product_id: item.productId,
    quantity: item.quantity,
    price: item.price,
    total: item.total
  };
}