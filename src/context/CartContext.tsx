import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { Product } from '../data/models/Product';
import { SaleItem } from '../data/models/Sale';

interface CartContextType {
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  proceedToPayment: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  proceedToPayment: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  // Calculate totals when items change
  useEffect(() => {
    let newSubtotal = 0;
    
    items.forEach(item => {
      newSubtotal += item.total;
    });
    
    // Calculate included GST (assuming 10% rate)
    // Formula: total_inclusive * (rate / (1 + rate))
    const gstRate = 0.1; // TODO: Make this configurable if needed
    const includedTax = newSubtotal * (gstRate / (1 + gstRate));
    
    setSubtotal(newSubtotal);
    setTax(includedTax);
    setTotal(newSubtotal); // Total is the same as the GST-inclusive subtotal
  }, [items]);

  // Add item to cart
  const addItem = (product: Product, quantity = 1) => {
    // Check stock availability before adding
    if (quantity > product.stock) {
      alert(`Cannot add ${quantity} ${product.name}. Only ${product.stock} available in stock.`);
      return;
    }

    // Check if product already exists in cart
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const newItems = [...items];
      const newQuantity = newItems[existingItemIndex].quantity + quantity;
      
      // Check stock availability before increasing quantity
      if (newQuantity > product.stock) {
        alert(`Cannot increase quantity for ${product.name}. Only ${product.stock} available in stock.`);
        return;
      }

      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newQuantity,
        total: newQuantity * product.price
      };
      
      setItems(newItems);
    } else {
      // Add new item
      const newItem: SaleItem = {
        id: uuidv4(),
        saleId: '', // Will be set when the sale is created
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        total: quantity * product.price
      };
      
      setItems([...items, newItem]);
    }
  };

  // Update quantity of an item
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      removeItem(itemId);
      return;
    }
    
    const newItems = items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total: quantity * item.price
        };
      }
      return item;
    });
    
    setItems(newItems);
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Proceed to payment
  const proceedToPayment = () => {
    if (items.length > 0) {
      navigate('/payment');
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        tax,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        proceedToPayment,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}