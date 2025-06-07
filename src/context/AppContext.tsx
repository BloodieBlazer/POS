import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentTitle: string;
  setTitle: (title: string) => void;
}

const AppContext = createContext<AppState>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  currentTitle: 'Dashboard',
  setTitle: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTitle, setCurrentTitle] = useState('Dashboard');

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const setTitle = useCallback((title: string) => {
    setCurrentTitle(title);
  }, []);

  // Detect window size for responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        currentTitle,
        setTitle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}