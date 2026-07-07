"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number | string;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number;
  minCartValue: number | string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  _count: {
    orders: number;
  };
}

function formatMoney(value: number | string | null) {
  if (value === null) {
    return "-";
  }

  return `THB ${Number(value).toLocaleString()}`;
}

function getStatusBadge(coupon: Coupon) {
  const now = new Date();
  const startDate = coupon.startDate ? new Date(coupon.startDate) : null;
  const endDate = coupon.endDate ? new Date(coupon.endDate) : null;

  if (!coupon.isActive) {
    return {
      label: "Inactive",
      color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };
  }

  if (endDate && now > endDate) {
    return {
      label: "Expired",
      color: "bg-red-500/20 text-red-300 border-red-500/30",
    };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return {
      label: "Depleted",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
  }

  if (startDate && now < startDate) {
    return {
      label: "Pending",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
  }

  return {
    label: "Active",
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  async function fetchCoupons() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      const res = await fetch(`/api/admin/coupons?${params}`);

      if (res.ok) {
        const data = await res.json();
        setCoupons(data.data as Coupon[]);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCouponActive(couponId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteCoupon(couponId: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">Coupons</h1>
          <p className="mt-1 text-gray-400">{total} total coupons</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Link href="/admin/coupons/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Coupon
          </Link>
        </Button>
      </div>

      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : coupons.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No coupons found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Uses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Per-User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Min Cart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {coupons.map((coupon) => {
                    const status = getStatusBadge(coupon);

                    return (
                      <tr key={coupon.id} className="transition-colors hover:bg-gray-800/20">
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{coupon.code}</p>
                          {coupon.description && (
                            <p className="mt-1 text-xs text-gray-500">{coupon.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="border-gray-500/30 bg-gray-500/10 text-gray-300">
                            {coupon.discountType === "FIXED" ? "Fixed" : "Percent"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {coupon.discountType === "FIXED"
                            ? formatMoney(coupon.discountValue)
                            : `${coupon.discountValue}%`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {coupon.usedCount || coupon._count.orders}
                          {coupon.maxUses ? `/${coupon.maxUses}` : ""}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {coupon.perUserLimit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatMoney(coupon.minCartValue)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`border ${status.color}`}>{status.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <div>
                            {coupon.startDate && (
                              <p>{new Date(coupon.startDate).toLocaleDateString()}</p>
                            )}
                            {coupon.endDate && (
                              <p className="text-xs">
                                to {new Date(coupon.endDate).toLocaleDateString()}
                              </p>
                            )}
                            {!coupon.startDate && !coupon.endDate && <p>-</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-gray-700 bg-gray-800">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/coupons/${coupon.id}`}>Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleCouponActive(coupon.id, coupon.isActive)}
                              >
                                {coupon.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteCoupon(coupon.id)}
                                className="text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 20)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-gray-700"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(page + 1)}
              className="border-gray-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
