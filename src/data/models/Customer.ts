export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  creditBalance: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: 'purchase' | 'credit_add' | 'credit_deduct';
  amount: number;
  description: string;
  saleId?: string;
  createdAt: Date;
}

// Helper to convert database row to Customer object
export function rowToCustomer(row: any): Customer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    creditBalance: row.credit_balance,
    totalPurchases: row.total_purchases,
    lastPurchaseDate: row.last_purchase_date ? new Date(row.last_purchase_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

// Helper to convert Customer object to database row
export function customerToRow(customer: Customer): any {
  return {
    id: customer.id,
    first_name: customer.firstName,
    last_name: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    credit_balance: customer.creditBalance,
    total_purchases: customer.totalPurchases,
    last_purchase_date: customer.lastPurchaseDate?.toISOString(),
    updated_at: new Date().toISOString()
  };
}