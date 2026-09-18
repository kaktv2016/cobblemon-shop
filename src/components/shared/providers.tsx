'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/shared/cart-context';
import { ToastProvider } from '@/components/ui/toast';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}

export default Providers;
