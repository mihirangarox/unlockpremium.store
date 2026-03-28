import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product, ProductPricing } from '../admin/types/index';
import { useLocalization } from './LocalizationContext';

export interface CartItem extends Product {
  cartItemId: string; // Unique ID for the item in the cart
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userCurrency } = useLocalization();
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage if available
    const savedCart = localStorage.getItem('unlockpremium_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('unlockpremium_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    const newItem: CartItem = {
      ...product,
      cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setItems((prevItems) => [...prevItems, newItem]);
    setIsCartOpen(true); 
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate total based on current userCurrency price tiers
  const totalPrice = items.reduce((sum, item) => {
    const priceField = `price${userCurrency}` as keyof ProductPricing;
    // Find the tier that matches the item's duration
    const tier = item.pricing?.find(p => p.durationMonths === item.durationMonths);
    const price = tier ? ((tier as any)[priceField] || tier.priceUSD || 0) : (item.price || 0);
    return sum + price;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
