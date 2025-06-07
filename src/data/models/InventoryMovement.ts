export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  movementType: 'sale' | 'adjustment' | 'restock' | 'return' | 'damage' | 'transfer';
  quantity: number; // Positive for additions, negative for deductions
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceId?: string; // Sale ID, adjustment ID, etc.
  userId: string;
  userName?: string;
  createdAt: Date;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  adjustmentType: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

// Helper functions
export function rowToInventoryMovement(row: any): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    movementType: row.movement_type as 'sale' | 'adjustment' | 'restock' | 'return' | 'damage' | 'transfer',
    quantity: row.quantity,
    previousStock: row.previous_stock,
    newStock: row.new_stock,
    reason: row.reason,
    referenceId: row.reference_id,
    userId: row.user_id,
    userName: row.user_name,
    createdAt: new Date(row.created_at)
  };
}

export function inventoryMovementToRow(movement: InventoryMovement): any {
  return {
    id: movement.id,
    product_id: movement.productId,
    product_name: movement.productName,
    movement_type: movement.movementType,
    quantity: movement.quantity,
    previous_stock: movement.previousStock,
    new_stock: movement.newStock,
    reason: movement.reason,
    reference_id: movement.referenceId,
    user_id: movement.userId,
    user_name: movement.userName,
    created_at: movement.createdAt.toISOString()
  };
}

export function rowToStockAdjustment(row: any): StockAdjustment {
  return {
    id: row.id,
    productId: row.product_id,
    adjustmentType: row.adjustment_type as 'increase' | 'decrease' | 'set',
    quantity: row.quantity,
    reason: row.reason,
    userId: row.user_id,
    userName: row.user_name,
    createdAt: new Date(row.created_at)
  };
}

export function stockAdjustmentToRow(adjustment: StockAdjustment): any {
  return {
    id: adjustment.id,
    product_id: adjustment.productId,
    adjustment_type: adjustment.adjustmentType,
    quantity: adjustment.quantity,
    reason: adjustment.reason,
    user_id: adjustment.userId,
    user_name: adjustment.userName,
    created_at: adjustment.createdAt.toISOString()
  };
}