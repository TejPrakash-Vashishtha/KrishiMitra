import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

// ============================================================
// CartContext — customer shopping cart (Phase 2)
// Items persist in localStorage so a refresh keeps the cart.
// ============================================================

export interface CartItem {
  id: string; // unique per farmer+product combo
  productId: string;
  productName: string;
  farmerId: string;
  farmerName: string;
  pricePerKg: number;
  unit: string; // "kg" | "piece" etc.
  quantity: number; // in unit
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalAmount: 0,
});

const LS_KEY = "agn_customer_cart";

function readCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  // Persist on every change
  useEffect(() => {
    writeCart(items);
  }, [items]);

  const addItem = (item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === item.productId && x.farmerId === item.farmerId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, { ...item, id: `${item.productId}-${item.farmerId}-${Date.now()}` }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, quantity } : x))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, x) => s + x.quantity, 0);
  const totalAmount = items.reduce((s, x) => s + x.quantity * x.pricePerKg, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
export default CartContext;
