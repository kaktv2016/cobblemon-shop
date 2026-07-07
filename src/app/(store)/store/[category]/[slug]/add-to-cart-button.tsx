"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/shared/cart-context";

interface Props {
  productId: string;
  available: number | null;
  productName: string;
}

export default function AddToCartButton({ productId, available, productName }: Props) {
  const router = useRouter();
  const { bump } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const soldOut = available !== null && available <= 0;
  const maxQty = available !== null ? Math.min(available, 10) : 10;

  async function handleAddToCart() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/store/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "ไม่สามารถเพิ่มไอเทมลงรถเข็นได้");
        return;
      }

      setAdded(true);
      bump(quantity);
      setTimeout(() => setAdded(false), 1800);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างเพิ่มไอเทมลงรถเข็น");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">จำนวนที่ต้องการ</p>
          <p className="mt-2 text-sm text-slate-300">{productName}</p>
        </div>

        <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03]">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-3 text-slate-400 transition-colors hover:text-white disabled:opacity-40"
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-sm font-medium text-white">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
            className="px-4 py-3 text-slate-400 transition-colors hover:text-white disabled:opacity-40"
            disabled={quantity >= maxQty}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={loading || soldOut}
        className={`h-12 w-full rounded-full border text-sm font-semibold shadow-none transition-all ${
          added
            ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-50 hover:bg-emerald-400/18"
            : soldOut
              ? "cursor-not-allowed border-white/10 bg-white/[0.05] text-slate-500"
              : "border-white/12 bg-white text-slate-950 hover:bg-slate-200"
        }`}
      >
        {added ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            เพิ่มลงรถเข็นแล้ว
          </>
        ) : soldOut ? (
          "รอบนี้จองครบแล้ว"
        ) : loading ? (
          "กำลังเพิ่มลงรถเข็น"
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            เพิ่มลงรถเข็น
          </>
        )}
      </Button>

      <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
        <span>หลังเพิ่มแล้ว คุณยังสามารถกลับมาเปรียบเทียบไอเทมอื่นก่อนได้</span>
        <Link href="/cart" className="whitespace-nowrap text-slate-200 transition-colors hover:text-white">
          ไปที่รถเข็น
        </Link>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
