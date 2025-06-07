import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';

function Layout() {
  const { sidebarOpen } = useApp();

  return (
    <div className="relative flex h-screen">
      {/* Sidebar (fixed position) */}
      <Sidebar />
      
      {/* Main Content (flexible width) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (fixed position) */}
        <Header />
        
        {/* Page Content (scrollable) */}
        <main className={`
          flex-1 overflow-auto p-4 md:p-6 transition-all duration-300
          ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'} /* Adjust margin based on state */
        `}>
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default Layout;