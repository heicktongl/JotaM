import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Service } from '../data';

export interface CartItem {
  item: Product | Service;
  type: 'product' | 'service';
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Product | Service, type: 'product' | 'service', quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: Product | Service, type: 'product' | 'service', quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { item, type, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems(prev => prev.map(i => i.item.id === itemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  
  const totalPrice = items.reduce((sum, i) => {
    const price = i.type === 'product' ? (i.item as Product).price : (i.item as Service).pricePerHour;
    return sum + (price * i.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
