import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../data/models/User';
import { UserRepository } from '../data/repositories/UserRepository';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('pos_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('pos_user');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would validate against a backend
      // For demo purposes, we'll use hardcoded credentials
      const demoUsers = [
        { email: 'admin@bottleshop.com', password: 'admin123', role: 'admin' as const },
        { email: 'manager@bottleshop.com', password: 'manager123', role: 'manager' as const },
        { email: 'cashier@bottleshop.com', password: 'cashier123', role: 'cashier' as const },
      ];

      const demoUser = demoUsers.find(u => u.email === email && u.password === password);
      
      if (demoUser) {
        // Check if user exists in database, create if not
        let dbUser = await UserRepository.findByEmail(email);
        
        if (!dbUser) {
          dbUser = await UserRepository.create({
            email: demoUser.email,
            firstName: demoUser.role.charAt(0).toUpperCase() + demoUser.role.slice(1),
            lastName: 'User',
            role: demoUser.role,
            isActive: true
          });
        }

        setUser(dbUser);
        setIsAuthenticated(true);
        localStorage.setItem('pos_user', JSON.stringify(dbUser));
        
        // Create session
        await UserRepository.createSession(dbUser.id);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pos_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return UserRepository.hasPermission(user, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}