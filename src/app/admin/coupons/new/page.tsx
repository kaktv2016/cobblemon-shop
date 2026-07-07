import { CouponForm } from "@/components/admin/coupon-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create Coupon — Admin",
};

export default function CreateCouponPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/coupons" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">Create Coupon</h1>
        <p className="mt-1 text-gray-400">Add a new discount coupon</p>
      </div>

      <CouponForm isEditMode={false} />
    </div>
  );
}
