"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const couponFormSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(50, "Code must be at most 50 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code can only contain uppercase letters, numbers, underscores, and hyphens"
    ),
  description: z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().positive("Discount value must be positive"),
  maxUsagePerUser: z.number().int("Must be a whole number").min(1, "Must be at least 1").nullable().optional(),
  maxTotalUsage: z.number().int("Must be a whole number").min(1, "Must be at least 1").nullable().optional(),
  minOrderAmount: z.number().min(0, "Cannot be negative").nullable().optional(),
  startsAt: z.union([z.string(), z.literal("")]).optional().nullable(),
  expiresAt: z.union([z.string(), z.literal("")]).optional().nullable(),
  isActive: z.boolean().default(true),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

interface CouponFormProps {
  initialData?: Partial<CouponFormData> & { id?: string };
  isEditMode?: boolean;
  couponId?: string;
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  return value == null || Number.isNaN(value) ? null : value;
}

function normalizeOptionalDate(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function CouponForm({
  initialData,
  isEditMode = false,
  couponId,
}: CouponFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: initialData?.code ?? "",
      description: initialData?.description ?? null,
      discountType: initialData?.discountType ?? "PERCENTAGE",
      discountValue: initialData?.discountValue ?? 0,
      maxUsagePerUser: initialData?.maxUsagePerUser ?? null,
      maxTotalUsage: initialData?.maxTotalUsage ?? null,
      minOrderAmount: initialData?.minOrderAmount ?? null,
      startsAt: initialData?.startsAt ?? "",
      expiresAt: initialData?.expiresAt ?? "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const discountType = watch("discountType");

  const onSubmit = async (data: CouponFormData) => {
    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/admin/coupons/${couponId}` : "/api/admin/coupons";
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        code: data.code,
        description: data.description ?? undefined,
        discountType: data.discountType === "FIXED_AMOUNT" ? "FIXED" : "PERCENTAGE",
        discountValue: data.discountValue,
        perUserLimit: normalizeOptionalNumber(data.maxUsagePerUser) ?? 1,
        maxUses: normalizeOptionalNumber(data.maxTotalUsage),
        minCartValue: normalizeOptionalNumber(data.minOrderAmount),
        startDate: normalizeOptionalDate(data.startsAt),
        endDate: normalizeOptionalDate(data.expiresAt),
        isActive: data.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save coupon");
      }

      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-gray-800/50 bg-gray-900/50 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Coupon Code *
              </label>
              <div className="flex gap-2">
                <Input
                  {...register("code")}
                  placeholder="SAVE20"
                  readOnly={isEditMode}
                  className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
                />
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setValue("code", generateRandomCode())}
                    className="border-gray-700 text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Discount Type *
              </label>
              <select
                {...register("discountType")}
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (THB)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Discount Value *
              </label>
              <Input
                type="number"
                {...register("discountValue", {
                  setValueAs: (value) => Number(value),
                })}
                placeholder={discountType === "PERCENTAGE" ? "20" : "100"}
                step="0.01"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                {discountType === "PERCENTAGE"
                  ? "Percentage value from 0 to 100"
                  : "Fixed discount amount in THB"}
              </p>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-500">{errors.discountValue.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Min Cart Value (THB)
              </label>
              <Input
                type="number"
                {...register("minOrderAmount", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="0"
                step="0.01"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
              />
              {errors.minOrderAmount && (
                <p className="mt-1 text-sm text-red-500">{errors.minOrderAmount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
            <Textarea
              {...register("description")}
              placeholder="Why use this coupon? Limited time offer?"
              rows={3}
              className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Max Uses Per User
              </label>
              <Input
                type="number"
                {...register("maxUsagePerUser", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="1"
                step="1"
                min="1"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
              />
              {errors.maxUsagePerUser && (
                <p className="mt-1 text-sm text-red-500">{errors.maxUsagePerUser.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Max Total Uses
              </label>
              <Input
                type="number"
                {...register("maxTotalUsage", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                placeholder="100"
                step="1"
                min="1"
                className="border-gray-700 bg-gray-900 text-white placeholder:text-gray-600"
              />
              {errors.maxTotalUsage && (
                <p className="mt-1 text-sm text-red-500">{errors.maxTotalUsage.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Start Date</label>
              <Input
                type="datetime-local"
                {...register("startsAt")}
                className="border-gray-700 bg-gray-900 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Expiry Date</label>
              <Input
                type="datetime-local"
                {...register("expiresAt")}
                className="border-gray-700 bg-gray-900 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-gray-700 pt-2">
            <input
              type="checkbox"
              {...register("isActive")}
              id="active"
              className="h-4 w-4 rounded border-gray-700 bg-gray-900"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-300">
              Active
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditMode ? (
            "Update Coupon"
          ) : (
            "Create Coupon"
          )}
        </Button>
      </div>
    </form>
  );
}
