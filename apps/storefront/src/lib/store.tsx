'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api';

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  slug: string;
}

interface StoreState {
  user: any;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  cart: CartItem[];
  cartHydrated: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  setQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  toast: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreState>(null as any);
const CART_KEY = 'go_cart';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Restore session via refresh cookie
  useEffect(() => {
    (async () => {
      try {
        if (getToken()) {
          const me = await api('/auth/me');
          setUser(me);
        } else {
          const r = await api('/auth/refresh', { method: 'POST' });
          setToken(r.accessToken);
          setUser(r.user);
        }
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // Restore cart — wait for hydration before persisting to avoid wiping
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartHydrated]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const r = await api('/auth/register', { method: 'POST', body: { name, email, password, phone } });
    setToken(r.accessToken);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api('/auth/me');
      setUser(me);
    } catch {
      /* ignore */
    }
  }, []);

  const addToCart = useCallback(
    (item: CartItem) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === item.productId && (i.variantId ?? null) === (item.variantId ?? null),
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + item.quantity, 50) };
          return next;
        }
        return [...prev, item];
      });
      showToast(`${item.name} added to cart`);
    },
    [showToast],
  );

  const removeFromCart = useCallback((productId: string, variantId?: string | null) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && (i.variantId ?? null) === (variantId ?? null))));
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
            ? { ...i, quantity: Math.max(1, Math.min(50, quantity)) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);

  const value: StoreState = {
    user,
    authLoading,
    login,
    register,
    logout,
    refreshUser,
    cart,
    cartHydrated,
    addToCart,
    removeFromCart,
    setQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    toast,
    showToast,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-fade-up rounded-full bg-espresso px-6 py-3 text-sm font-medium text-ivory shadow-xl shadow-espresso/30">
          <span className="mr-2 text-goldlight">✦</span>
          {toast}
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
