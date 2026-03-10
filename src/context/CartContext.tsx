import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Service } from '../data';

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  price: number;
}

export interface CartItem {
  cartId: string; // ID único para a combinação item + opções
  item: Product | Service;
  type: 'product' | 'service';
  quantity: number;
  selectedOptions: SelectedOption[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Product | Service, type: 'product' | 'service', quantity?: number, selectedOptions?: SelectedOption[]) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (
    item: Product | Service, 
    type: 'product' | 'service', 
    quantity = 1, 
    selectedOptions: SelectedOption[] = []
  ) => {
    // Gera um ID único baseado no item e nas opções selecionadas (sorteadas para garantir consistência)
    const optionsKey = selectedOptions
      .map(o => o.itemId)
      .sort()
      .join('-');
    const cartId = `${item.id}:${optionsKey}`;

    setItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { cartId, item, type, quantity, selectedOptions }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setItems(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  
  const totalPrice = items.reduce((sum, i) => {
    const basePrice = i.type === 'product' ? (i.item as Product).price : (i.item as Service).pricePerHour;
    const optionsPrice = i.selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
    return sum + ((basePrice + optionsPrice) * i.quantity);
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
