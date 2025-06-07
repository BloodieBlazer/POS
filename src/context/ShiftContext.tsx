import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shift } from '../data/models/Shift';
import { ShiftRepository } from '../data/repositories/ShiftRepository';
import { useAuth } from './AuthContext';

interface ShiftContextType {
  currentShift: Shift | null;
  startShift: (openingBalance: number) => Promise<boolean>;
  endShift: (closingBalance: number, notes?: string) => Promise<boolean>;
  refreshShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType>({
  currentShift: null,
  startShift: async () => false,
  endShift: async () => false,
  refreshShift: async () => {},
});

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (user) {
      loadActiveShift();
    }
  }, [user]);

  const loadActiveShift = async () => {
    if (!user) return;
    
    try {
      const activeShift = await ShiftRepository.getActiveShift(user.id);
      setCurrentShift(activeShift);
    } catch (error) {
      console.error('Error loading active shift:', error);
    }
  };

  const startShift = async (openingBalance: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const shift = await ShiftRepository.startShift(
        user.id,
        `${user.firstName} ${user.lastName}`,
        openingBalance
      );
      setCurrentShift(shift);
      return true;
    } catch (error) {
      console.error('Error starting shift:', error);
      return false;
    }
  };

  const endShift = async (closingBalance: number, notes?: string): Promise<boolean> => {
    if (!currentShift) return false;
    
    try {
      const updatedShift = await ShiftRepository.endShift(
        currentShift.id,
        closingBalance,
        notes
      );
      setCurrentShift(updatedShift);
      return true;
    } catch (error) {
      console.error('Error ending shift:', error);
      return false;
    }
  };

  const refreshShift = async () => {
    await loadActiveShift();
  };

  return (
    <ShiftContext.Provider
      value={{
        currentShift,
        startShift,
        endShift,
        refreshShift,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  return useContext(ShiftContext);
}