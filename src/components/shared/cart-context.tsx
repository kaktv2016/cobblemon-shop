"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

type CartContextValue = {
  /** Total number of items in the cart */
  count: number;
  /** Re-fetch the cart count from the server */
  refresh: () => Promise<void>;
  /** Optimistically bump the count by `delta` (e.g. after add-to-cart) */
  bump: (delta?: number) => void;
};

const CartContext = createContext<CartContextValue>({
  count: 0,
  refresh: async () => {},
  bump: () => {},
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      setCount(0);
      return;
    }

    try {
      const res = await fetch("/api/store/cart", { cache: "no-store" });
      if (!res.ok) {
        setCount(0);
        return;
      }

      const data = await res.json();

      // data can be { items: [...] } or an array
      const items: { quantity: number }[] = Array.isArray(data)
        ? data
        : data.items ?? [];

      const total = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
      setCount(total);
    } catch {
      // Silently ignore — don't crash the app for a badge
    }
  }, [status]);

  const bump = useCallback((delta = 1) => {
    setCount((prev) => Math.max(0, prev + delta));
  }, []);

  // Fetch on mount and when auth status changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CartContext.Provider value={{ count, refresh, bump }}>
      {children}
    </CartContext.Provider>
  );
}
