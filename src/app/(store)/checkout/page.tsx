'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Loader2, Lock, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/* ─── Types ─────────────────────────────────────────────────────────── */

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    imageUrl?: string | null;
  };
};

type CartData = {
  items: CartItem[];
  subtotal: string;
  discount: string;
  total: string;
  couponCode?: string | null;
};

const PAYMENT_METHODS = [
  {
    id: 'promptpay',
    label: 'PromptPay / QR Code',
    description: 'สแกน QR จ่ายผ่านแอปธนาคาร — รวดเร็ว ปลอดภัย',
    icon: <QrCode className="h-6 w-6 text-cyan-300" />,
  },
];

function formatBaht(value: string | number) {
  return Number(value).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  });
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [cart, setCart] = useState<CartData | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  /* ── Redirect unauthenticated ─────────────────────────────────────── */
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/checkout');
    }
  }, [authStatus, router]);

  /* ── Fetch cart ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    fetch('/api/store/cart')
      .then((r) => r.json())
      .then((data) => {
        // CartService returns { items, subtotal, discount, total, couponCode }
        // or an array — normalise both shapes
        if (Array.isArray(data)) {
          const subtotal = data.reduce(
            (sum: number, i: CartItem) => sum + Number(i.product.price) * i.quantity,
            0
          );
          setCart({ items: data, subtotal: String(subtotal), discount: '0', total: String(subtotal) });
        } else {
          setCart(data);
        }
      })
      .catch(() => setCartError('ไม่สามารถโหลดตะกร้าสินค้าได้'))
      .finally(() => setCartLoading(false));
  }, [authStatus]);

  /* ── Place order ──────────────────────────────────────────────────── */
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !cart || cart.items.length === 0) return;

    setIsLoading(true);
    setOrderError('');

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: couponCode.trim() || undefined, paymentMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOrderError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // Provider returns a checkoutUrl — follow it
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        router.push(`/account/orders/${data.orderId}`);
      }
    } catch {
      setOrderError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Loading / auth states ─────────────────────────────────────── */
  if (authStatus === 'loading' || (authStatus === 'authenticated' && cartLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030816]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (cartError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#030816] px-4 text-center">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <p className="text-white">{cartError}</p>
        <Link href="/cart" className="text-sm text-cyan-300 hover:underline">กลับไปยังตะกร้า</Link>
      </main>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  /* ─── Empty cart ─────────────────────────────────────────────────── */
  if (!cartLoading && isEmpty) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#030816] px-4 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="text-2xl font-bold text-white">ตะกร้าของคุณว่างอยู่</h1>
        <p className="text-slate-400">เพิ่มสินค้าก่อนชำระเงิน</p>
        <Link href="/store">
          <Button className="bg-cyan-500 text-black hover:bg-cyan-400">สำรวจร้านค้า</Button>
        </Link>
      </main>
    );
  }

  const subtotal = Number(cart?.subtotal ?? 0);
  const discount = Number(cart?.discount ?? 0);
  const total = Number(cart?.total ?? 0);

  /* ─── Main UI ────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[#030816] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.06),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Page title */}
        <div className="mb-10">
          <nav className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/cart" className="hover:text-white">ตะกร้า</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">ชำระเงิน</span>
          </nav>
          <h1 className="font-display text-3xl font-bold text-white">ชำระเงิน</h1>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Player info banner */}
            {session && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-lg font-bold text-cyan-300">
                  {session.user.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{session.user.username}</p>
                  <p className="text-xs text-slate-400">ไอเทมจะถูกส่งให้บัญชีนี้ในเกม</p>
                </div>
              </div>
            )}

            {/* Items in cart */}
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#081120]/70">
              <div className="border-b border-white/8 px-5 py-4">
                <h2 className="font-semibold text-white">สินค้าในตะกร้า ({cart?.items.length ?? 0} ชิ้น)</h2>
              </div>
              <ul className="divide-y divide-white/5">
                {cart?.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="h-12 w-12 flex-shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-2xl">
                        🎮
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.product.name}</p>
                      <p className="text-xs text-slate-400">จำนวน {item.quantity} ชิ้น</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatBaht(Number(item.product.price) * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment method */}
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#081120]/70">
              <div className="border-b border-white/8 px-5 py-4">
                <h2 className="font-semibold text-white">วิธีชำระเงิน</h2>
              </div>
              <div className="space-y-3 p-5">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                      paymentMethod === method.id
                        ? 'border-cyan-400/50 bg-cyan-400/[0.06]'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/14'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{method.label}</p>
                      <p className="text-sm text-slate-400">{method.description}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 transition-colors ${
                      paymentMethod === method.id
                        ? 'border-cyan-400 bg-cyan-400'
                        : 'border-slate-600'
                    }`} />
                  </label>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#081120]/70">
              <div className="border-b border-white/8 px-5 py-4">
                <h2 className="font-semibold text-white">รหัสคูปอง</h2>
              </div>
              <div className="flex gap-3 p-5">
                <input
                  type="text"
                  placeholder="ใส่รหัสคูปอง (ถ้ามี)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                >
                  ใช้โค้ด
                </Button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/8 bg-[#081120]/70 p-5">
              <div
                role="checkbox"
                aria-checked={termsAccepted}
                onClick={() => setTermsAccepted((v) => !v)}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  termsAccepted ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600 bg-transparent'
                }`}
              >
                {termsAccepted && (
                  <svg className="h-3 w-3 text-black" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-slate-300">
                ฉันยอมรับ{' '}
                <Link href="/legal/terms" className="text-cyan-400 hover:text-cyan-300">ข้อกำหนดการใช้งาน</Link>
                {', '}
                <Link href="/legal/refunds" className="text-cyan-400 hover:text-cyan-300">นโยบายการคืนสินค้า</Link>
                {' และ '}
                <Link href="/legal/privacy" className="text-cyan-400 hover:text-cyan-300">นโยบายความเป็นส่วนตัว</Link>
              </span>
            </label>
          </div>

          {/* ── Right column — Order summary ─────────────────────────── */}
          <div>
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/10 bg-[#081120]/80 shadow-[0_16px_60px_rgba(2,6,17,0.4)]">
              <div className="border-b border-white/8 px-6 py-5">
                <h2 className="font-semibold text-white">สรุปคำสั่งซื้อ</h2>
              </div>

              <div className="space-y-3 px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">ราคารวม</span>
                  <span className="text-white">{formatBaht(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">ส่วนลด</span>
                    <span className="text-emerald-400">−{formatBaht(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/8 pt-3 text-base font-bold">
                  <span className="text-white">ยอดรวมทั้งหมด</span>
                  <span className="text-cyan-300">{formatBaht(total)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-2.5 border-t border-white/8 px-6 py-4">
                {[
                  { icon: <Lock className="h-3.5 w-3.5 text-emerald-400" />, text: 'ปลอดภัยด้วยการเข้ารหัส SSL' },
                  { icon: <Zap className="h-3.5 w-3.5 text-amber-400" />, text: 'ส่งไอเทมทันทีหลังยืนยัน' },
                  { icon: <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />, text: 'รับประกันความพึงพอใจ' },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2.5 text-xs text-slate-400">
                    {b.icon}
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {orderError && (
                <div className="mx-6 mb-4 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] p-3 text-sm text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* CTA */}
              <div className="px-6 pb-6">
                <Button
                  type="submit"
                  disabled={isLoading || !termsAccepted || isEmpty}
                  className="w-full gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-6 text-base font-semibold text-black hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      กำลังดำเนินการ…
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      สั่งซื้อและรับ QR Code
                    </>
                  )}
                </Button>
                <p className="mt-3 text-center text-xs text-slate-500">
                  กดสั่งซื้อเพื่อรับ QR Code สำหรับชำระเงิน
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
