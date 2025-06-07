export interface Shift {
  id: string;
  userId: string;
  userName?: string;
  startTime: Date;
  endTime?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  variance?: number;
  notes?: string;
  status: 'active' | 'completed' | 'pending_approval';
  totalSales?: number;
  totalRefunds?: number;
  totalCreditIssued?: number;
  cashSales?: number;
  eftSales?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftSummary {
  totalSales: number;
  totalRefunds: number;
  totalCreditIssued: number;
  cashSales: number;
  eftSales: number;
  transactionCount: number;
  expectedCashBalance: number;
}

// Helper functions
export function rowToShift(row: any): Shift {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    openingBalance: row.opening_balance,
    closingBalance: row.closing_balance,
    expectedBalance: row.expected_balance,
    variance: row.variance,
    notes: row.notes,
    status: row.status as 'active' | 'completed' | 'pending_approval',
    totalSales: row.total_sales,
    totalRefunds: row.total_refunds,
    totalCreditIssued: row.total_credit_issued,
    cashSales: row.cash_sales,
    eftSales: row.eft_sales,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

export function shiftToRow(shift: Shift): any {
  return {
    id: shift.id,
    user_id: shift.userId,
    user_name: shift.userName,
    start_time: shift.startTime.toISOString(),
    end_time: shift.endTime?.toISOString(),
    opening_balance: shift.openingBalance,
    closing_balance: shift.closingBalance,
    expected_balance: shift.expectedBalance,
    variance: shift.variance,
    notes: shift.notes,
    status: shift.status,
    total_sales: shift.totalSales,
    total_refunds: shift.totalRefunds,
    total_credit_issued: shift.totalCreditIssued,
    cash_sales: shift.cashSales,
    eft_sales: shift.eftSales,
    updated_at: new Date().toISOString()
  };
}