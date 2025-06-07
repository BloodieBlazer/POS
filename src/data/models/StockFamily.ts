export interface StockFamily {
  id: string;
  name: string;
  baseProductId: string; // The main product that represents the base unit
  description?: string;
  category: string;
  totalStock: number; // Total stock in base units
  createdAt: Date;
  updatedAt: Date;
}

export interface StockFamilyMember {
  id: string;
  stockFamilyId: string;
  productId: string;
  unitsPerPack: number; // How many base units this product represents
  isBaseUnit: boolean;
  createdAt: Date;
}

// Helper functions
export function rowToStockFamily(row: any): StockFamily {
  return {
    id: row.id,
    name: row.name,
    baseProductId: row.base_product_id,
    description: row.description,
    category: row.category,
    totalStock: row.total_stock,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

export function stockFamilyToRow(stockFamily: StockFamily): any {
  return {
    id: stockFamily.id,
    name: stockFamily.name,
    base_product_id: stockFamily.baseProductId,
    description: stockFamily.description,
    category: stockFamily.category,
    total_stock: stockFamily.totalStock,
    updated_at: new Date().toISOString()
  };
}

export function rowToStockFamilyMember(row: any): StockFamilyMember {
  return {
    id: row.id,
    stockFamilyId: row.stock_family_id,
    productId: row.product_id,
    unitsPerPack: row.units_per_pack,
    isBaseUnit: row.is_base_unit,
    createdAt: new Date(row.created_at)
  };
}

export function stockFamilyMemberToRow(member: StockFamilyMember): any {
  return {
    id: member.id,
    stock_family_id: member.stockFamilyId,
    product_id: member.productId,
    units_per_pack: member.unitsPerPack,
    is_base_unit: member.isBaseUnit
  };
}