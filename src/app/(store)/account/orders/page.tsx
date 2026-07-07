"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  QrCode,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
}

interface OrderPayment {
  status: string;
  provider: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number | string;
  items: OrderItem[];
  payments: OrderPayment[];
}

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING_PAYMENT:     { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   label: "รอชำระเงิน" },
  PAID:                { color: "bg-blue-500/20 text-blue-300 border-blue-500/30",          label: "ชำระแล้ว" },
  QUEUED_DELIVERY:     { color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",    label: "กำลังส่งไอเทม" },
  DELIVERED:           { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "ส่งแล้ว" },
  PARTIALLY_DELIVERED: { color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",          label: "ส่งบางส่วน" },
  FAILED_DELIVERY:     { color: "bg-red-500/20 text-red-300 border-red-500/30",             label: "ส่งล้มเหลว" },
  REFUNDED:            { color: "bg-purple-500/20 text-purple-300 border-purple-500/30",    label: "คืนเงินแล้ว" },
  CANCELED:            { color: "bg-gray-500/20 text-gray-300 border-gray-500/30",          label: "ยกเลิก" },
};

export default function OrdersPage() {
  const [result, setResult] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/orders?page=${p}&limit=10`);
      if (!res.ok) throw new Error("โหลดข้อมูลล้มเหลว");
      const data: OrdersResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  const orders = result?.data ?? [];
  const totalPages = result?.pages ?? 1;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Page Header */}
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-slate-100">ประวัติออเดอร์</h1>
          {result && (
            <p className="mt-2 text-slate-400">
              {result.total} ออเดอร์ทั้งหมด
            </p>
          )}
        </div>
      </section>

      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
              <p className="text-red-300">{error}</p>
              <Button
                onClick={() => fetchOrders(page)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                ลองใหม่
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && orders.length === 0 && (
            <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-12 text-center">
              <ShoppingBag className="mx-auto h-14 w-14 text-slate-600 mb-4" />
              <p className="text-lg text-slate-400">ยังไม่มีออเดอร์</p>
              <p className="mt-1 text-sm text-slate-500">เริ่มช้อปปิ้งเพื่อดูออเดอร์ของคุณที่นี่</p>
              <Link href="/store">
                <Button className="mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold">
                  ไปที่ร้านค้า
                </Button>
              </Link>
            </div>
          )}

          {/* Order list */}
          {!loading && !error && orders.length > 0 && (
            <>
              {orders.map((order) => {
                const cfg = statusConfig[order.status] ?? statusConfig.PENDING_PAYMENT;
                const isPending = order.status === "PENDING_PAYMENT";
                const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <Card
                    key={order.id}
                    className={`border bg-gradient-to-br from-slate-800 to-slate-900 p-5 transition-colors ${
                      isPending
                        ? "border-yellow-500/30 hover:border-yellow-400/50"
                        : "border-indigo-500/20 hover:border-indigo-400/40"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="font-semibold text-slate-100 hover:text-indigo-300 transition-colors"
                          >
                            {order.orderNumber}
                          </Link>
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>{itemCount} ชิ้น</span>
                          {order.items.length > 0 && (
                            <span className="truncate max-w-xs">
                              {order.items.slice(0, 2).map((i) => i.productName).join(", ")}
                              {order.items.length > 2 && " ..."}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <p className="text-xl font-bold text-amber-400">
                          ฿{Number(order.total).toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          {/* Pay button — shown only when pending */}
                          {isPending && (
                            <Link href={`/checkout/promptpay?order=${order.id}`}>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-bold gap-1.5 shadow-md shadow-yellow-500/20"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                ชำระเงิน
                              </Button>
                            </Link>
                          )}
                          <Link href={`/account/orders/${order.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                            >
                              ดูรายละเอียด
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ก่อนหน้า
                  </Button>
                  <span className="text-sm text-slate-400">
                    หน้า {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
                  >
                    ถัดไป
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
