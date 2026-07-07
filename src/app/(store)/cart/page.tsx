"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/shared/cart-context";
import {
  ShoppingCart, Trash2, Minus, Plus, Sparkles, ArrowRight,
  Tag, AlertCircle, ChevronRight, Loader2
} from "lucide-react";

function formatPrice(price: any): string {
  return `฿${Number(price).toLocaleString()}`;
}

export default function CartPage() {
  const router = useRouter();
  const { refresh: refreshCartBadge } = useCart();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const res = await fetch("/api/store/cart");
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch {
      setError("ไม่สามารถโหลดตะกร้าได้");
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    setUpdating(productId);
    try {
      if (quantity <= 0) {
        await fetch(`/api/store/cart/${productId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/store/cart/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
      }
      await fetchCart();
      await refreshCartBadge();
    } catch {
      setError("ไม่สามารถอัปเดตตะกร้าได้");
    } finally {
      setUpdating(null);
    }
  }

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponResult(null);

    try {
      const res = await fetch("/api/store/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, reason: "ไม่สามารถตรวจสอบคูปองได้" });
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponResult?.valid ? couponCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "การชำระเงินล้มเหลว");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/checkout/success?order=${data.orderNumber}`);
      }
    } catch {
      setError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-28 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-800/50">
          <ShoppingCart className="h-10 w-10 text-gray-500" />
        </div>
        <h1 className="font-outfit text-3xl font-bold text-white">ตะกร้าของคุณว่างอยู่</h1>
        <p className="mt-3 text-gray-400">
          ดูเหมือนว่าคุณยังไม่ได้เพิ่มสินค้าใดๆ
        </p>
        <Button
          asChild
          className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Link href="/store">
            ไปดูร้านค้า
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-outfit text-3xl font-bold text-white">
        ตะกร้าสินค้า
        <span className="ml-2 text-lg text-gray-500">({cart.itemCount} ชิ้น)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item: any) => (
            <Card key={item.productId} className="border-gray-800/50 bg-gray-900/30">
              <CardContent className="flex items-center gap-4 p-4">
                {/* Product Icon */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                  <Sparkles className="h-7 w-7 text-indigo-400/60" />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/store/${item.product?.slug || ""}`}
                    className="font-semibold text-white hover:text-indigo-300 transition-colors"
                  >
                    {item.product?.name || "สินค้า"}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.product?.price)} / ชิ้น
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800/50">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-2 py-1.5 text-gray-400 hover:text-white transition-colors"
                    disabled={updating === item.productId}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-white">
                    {updating === item.productId ? "..." : item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-2 py-1.5 text-gray-400 hover:text-white transition-colors"
                    disabled={updating === item.productId}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatPrice(Number(item.product?.price) * item.quantity)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => updateQuantity(item.productId, 0)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  disabled={updating === item.productId}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-gray-800/50 bg-gray-900/30">
            <CardHeader>
              <CardTitle className="text-lg text-white">สรุปคำสั่งซื้อ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="รหัสคูปอง"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="border-gray-700 bg-gray-800/50"
                  />
                  <Button
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode}
                    variant="outline"
                    className="border-gray-700 shrink-0"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                  </Button>
                </div>
                {couponResult && (
                  <p className={`text-xs ${couponResult.valid ? "text-emerald-400" : "text-red-400"}`}>
                    {couponResult.valid
                      ? `ส่วนลด: -${formatPrice(couponResult.discountAmount)}`
                      : couponResult.reason}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-gray-800/50 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ราคารวม</span>
                  <span className="text-white">{formatPrice(cart.subtotal)}</span>
                </div>

                {couponResult?.valid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400">ส่วนลด</span>
                    <span className="text-emerald-400">-{formatPrice(couponResult.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-800/50 pt-3">
                  <span className="text-lg font-semibold text-white">ยอดรวมทั้งหมด</span>
                  <span className="text-lg font-bold text-white">
                    {formatPrice(
                      couponResult?.valid
                        ? Number(cart.total) - Number(couponResult.discountAmount)
                        : cart.total
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold shadow-lg shadow-indigo-500/25"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    ชำระเงิน
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500">
                ต้องเชื่อมบัญชี Minecraft เพื่อรับไอเทม
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
