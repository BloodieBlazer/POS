import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { Shift, ShiftSummary } from '../models/Shift';
import { SaleRepository } from './SaleRepository';

export class ShiftRepository {
  // Start a new shift
  static async startShift(userId: string, userName: string, openingBalance: number): Promise<Shift> {
    // Check if user has an active shift
    const activeShift = await this.getActiveShift(userId);
    if (activeShift) {
      throw new Error('User already has an active shift');
    }
    
    const newShift: Shift = {
      id: uuidv4(),
      userId,
      userName,
      startTime: new Date(),
      openingBalance,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.shifts.add(newShift);
    return newShift;
  }
  
  // End a shift
  static async endShift(shiftId: string, closingBalance: number, notes?: string): Promise<Shift | null> {
    const shift = await this.findById(shiftId);
    if (!shift || shift.status !== 'active') return null;
    
    // Calculate shift summary
    const summary = await this.calculateShiftSummary(shiftId, shift.startTime, new Date());
    
    const expectedBalance = shift.openingBalance + summary.cashSales;
    const variance = closingBalance - expectedBalance;
    
    const updatedShift: Shift = {
      ...shift,
      endTime: new Date(),
      closingBalance,
      expectedBalance,
      variance,
      notes,
      status: Math.abs(variance) > 10 ? 'pending_approval' : 'completed', // Require approval for variance > $10
      totalSales: summary.totalSales,
      totalRefunds: summary.totalRefunds,
      totalCreditIssued: summary.totalCreditIssued,
      cashSales: summary.cashSales,
      eftSales: summary.eftSales,
      updatedAt: new Date()
    };
    
    await db.shifts.put(updatedShift);
    return updatedShift;
  }
  
  // Get shift by ID
  static async findById(id: string): Promise<Shift | null> {
    return await db.shifts.get(id) || null;
  }
  
  // Get active shift for a user
  static async getActiveShift(userId: string): Promise<Shift | null> {
    return await db.shifts
      .where('userId')
      .equals(userId)
      .and(shift => shift.status === 'active')
      .first() || null;
  }
  
  // Get all shifts
  static async findAll(startDate?: Date, endDate?: Date): Promise<Shift[]> {
    let query = db.shifts.orderBy('startTime').reverse();
    
    if (startDate && endDate) {
      query = query.filter(shift => 
        shift.startTime >= startDate && shift.startTime <= endDate
      );
    }
    
    return await query.toArray();
  }
  
  // Calculate shift summary
  static async calculateShiftSummary(shiftId: string, startTime: Date, endTime: Date): Promise<ShiftSummary> {
    const sales = await SaleRepository.findAll(startTime, endTime);
    const shiftSales = sales.filter(sale => sale.status === 'completed');
    
    let totalSales = 0;
    let totalRefunds = 0;
    let totalCreditIssued = 0;
    let cashSales = 0;
    let eftSales = 0;
    
    for (const sale of shiftSales) {
      if (sale.total > 0) {
        totalSales += sale.total;
        
        if (sale.paymentMethod === 'cash') {
          cashSales += sale.total;
        } else if (sale.paymentMethod === 'eft') {
          eftSales += sale.total;
        } else if (sale.paymentMethod === 'split' && sale.paymentDetails) {
          cashSales += sale.paymentDetails.cashAmount || 0;
          eftSales += sale.paymentDetails.eftAmount || 0;
        }
      } else {
        totalRefunds += Math.abs(sale.total);
      }
    }
    
    return {
      totalSales,
      totalRefunds,
      totalCreditIssued,
      cashSales,
      eftSales,
      transactionCount: shiftSales.length,
      expectedCashBalance: cashSales
    };
  }
  
  // Approve a shift (for manager/admin)
  static async approveShift(shiftId: string): Promise<boolean> {
    try {
      await db.shifts.update(shiftId, {
        status: 'completed',
        updatedAt: new Date()
      });
      return true;
    } catch {
      return false;
    }
  }
  
  // Get shifts requiring approval
  static async getPendingApproval(): Promise<Shift[]> {
    return await db.shifts
      .where('status')
      .equals('pending_approval')
      .toArray();
  }
}