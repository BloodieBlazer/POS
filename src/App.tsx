import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { DatabaseProvider } from './context/DatabaseContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SalesPage from './pages/sales/SalesPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductForm from './pages/products/ProductForm';
import ReportsPage from './pages/reports/ReportsPage';
import PaymentPage from './pages/payment/PaymentPage';

console.log('App component rendering'); // Debug log

function App() {
  return (
    <NotificationProvider>
      <DatabaseProvider>
        <ThemeProvider>
          <AppProvider>
            <BrowserRouter>
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
                  </Route>
                </Routes>
              </CartProvider>
            </BrowserRouter>
          </AppProvider>
        </ThemeProvider>
      </DatabaseProvider>
    </NotificationProvider>
  );
}

export default App;