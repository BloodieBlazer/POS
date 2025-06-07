export interface Bundle {
  id: string;
  name: string;
  description?: string;
  minimumQuantity: number;
  bundlePrice: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleProduct {
  id: string;
  bundleId: string;
  productId: string;
  productName?: string; // For display
  createdAt: Date;
}

export interface BundleApplication {
  bundleId: string;
  bundleName: string;
  applicableItems: {
    productId: string;
    quantity: number;
    originalPrice: number;
  }[];
  bundleQuantity: number;
  originalTotal: number;
  bundleTotal: number;
  savings: number;
}

// Helper functions
export function rowToBundle(row: any): Bundle {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    minimumQuantity: row.minimum_quantity,
    bundlePrice: row.bundle_price,
    isActive: row.is_active,
    validFrom: row.valid_from ? new Date(row.valid_from) : undefined,
    validTo: row.valid_to ? new Date(row.valid_to) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

export function bundleToRow(bundle: Bundle): any {
  return {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    minimum_quantity: bundle.minimumQuantity,
    bundle_price: bundle.bundlePrice,
    is_active: bundle.isActive,
    valid_from: bundle.validFrom?.toISOString(),
    valid_to: bundle.validTo?.toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function rowToBundleProduct(row: any): BundleProduct {
  return {
    id: row.id,
    bundleId: row.bundle_id,
    productId: row.product_id,
    productName: row.product_name,
    createdAt: new Date(row.created_at)
  };
}

export function bundleProductToRow(bundleProduct: BundleProduct): any {
  return {
    id: bundleProduct.id,
    bundle_id: bundleProduct.bundleId,
    product_id: bundleProduct.productId
  };
}