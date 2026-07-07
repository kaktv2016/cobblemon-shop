"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/coupon-form";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number | string;
  maxUses: number | null;
  perUserLimit: number;
  minCartValue: number | string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

function toDateTimeLocal(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : null;
}

export default function EditCouponPage() {
  const params = useParams();
  const couponId = params.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupon();
  }, [couponId]);

  async function fetchCoupon() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`);

      if (res.ok) {
        const data = (await res.json()) as Coupon;
        setCoupon(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/coupons"
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </Link>
        <p className="text-gray-400">Coupon not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/coupons"
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">Edit Coupon</h1>
        <p className="mt-1 text-gray-400">Update coupon details</p>
      </div>

      <CouponForm
        initialData={{
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType === "FIXED" ? "FIXED_AMOUNT" : "PERCENTAGE",
          discountValue: Number(coupon.discountValue),
          maxUsagePerUser: coupon.perUserLimit,
          maxTotalUsage: coupon.maxUses,
          minOrderAmount:
            coupon.minCartValue === null ? null : Number(coupon.minCartValue),
          startsAt: toDateTimeLocal(coupon.startDate),
          expiresAt: toDateTimeLocal(coupon.endDate),
          isActive: coupon.isActive,
        }}
        isEditMode={true}
        couponId={couponId}
      />
    </div>
  );
}
