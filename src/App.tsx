import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/sales/SalesPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductForm from './pages/products/ProductForm';
import ReportsPage from './pages/reports/ReportsPage';
import PaymentPage from './pages/payment/PaymentPage';
import CustomersPage from './pages/customers/CustomersPage';
import ShiftsPage from './pages/shifts/ShiftsPage';
import InventoryPage from './pages/inventory/InventoryPage';

console.log('App component rendering'); // Debug log

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ShiftProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </CartProvider>
    </ShiftProvider>
  );
}

function App() {
  return (
    <NotificationProvider>
      <DatabaseProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </DatabaseProvider>
    </NotificationProvider>
  );
}

export default App;