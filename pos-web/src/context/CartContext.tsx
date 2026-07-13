import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartLine, Product } from "../types";

interface CartState {
  lines: CartLine[];
  addProduct: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeProduct: (productId: number) => void;
  clear: () => void;
  subtotal: number;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.productId === product.productId);
      if (existing) {
        return prev.map((l) =>
          l.product.productId === product.productId
            ? { ...l, quantity: l.quantity + quantity }
            : l,
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.product.productId !== productId)
        : prev.map((l) =>
            l.product.productId === productId ? { ...l, quantity } : l,
          ),
    );
  }, []);

  const removeProduct = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.product.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0),
    [lines],
  );

  return (
    <CartContext.Provider value={{ lines, addProduct, setQuantity, removeProduct, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
