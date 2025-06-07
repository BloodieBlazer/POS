export interface Product {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  price: number;
  costPrice: number;
  gst: number;
  category?: string;
  stock: number;
  priceBreaks?: PriceBreak[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceBreak {
  quantity: number;
  price: number;
}

// Helper to convert database row to Product object
export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    barcode: row.barcode,
    price: row.price,
    costPrice: row.cost_price,
    gst: row.gst,
    category: row.category,
    stock: row.stock,
    priceBreaks: row.price_breaks ? JSON.parse(row.price_breaks) : [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

// Helper to convert Product object to database row
export function productToRow(product: Product): any {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    barcode: product.barcode,
    price: product.price,
    cost_price: product.costPrice,
    gst: product.gst,
    category: product.category,
    stock: product.stock,
    price_breaks: product.priceBreaks ? JSON.stringify(product.priceBreaks) : null,
    updated_at: new Date().toISOString()
  };
}