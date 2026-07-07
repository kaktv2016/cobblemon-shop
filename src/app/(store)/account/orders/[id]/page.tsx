"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronRight, Copy, Check, QrCode } from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryStatus: string;
  productType: string;
}

interface PaymentTransaction {
  id: string;
  provider: string;
  providerTransactionId: string | null;
  status: string;
  amount: number;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  playerName: string | null;
  playerUuid: string | null;
  items: OrderItem[];
  payments: PaymentTransaction[];
  user: {
    username: string;
    email: string;
  };
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING_PAYMENT:      { color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   label: "รอชำระเงิน" },
  PAID:                 { color: "bg-blue-500/20 text-blue-300 border-blue-500/30",          label: "ชำระแล้ว" },
  QUEUED_DELIVERY:      { color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",    label: "กำลังส่งไอเทม" },
  DELIVERED:            { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", label: "ส่งแล้ว" },
  PARTIALLY_DELIVERED:  { color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",          label: "ส่งบางส่วน" },
  FAILED_DELIVERY:      { color: "bg-red-500/20 text-red-300 border-red-500/30",             label: "ส่งล้มเหลว" },
  REFUNDED:             { color: "bg-purple-500/20 text-purple-300 border-purple-500/30",    label: "คืนเงินแล้ว" },
  CANCELED:             { color: "bg-gray-500/20 text-gray-300 border-gray-500/30",          label: "ยกเลิก" },
};

const timelineSteps = [
  { key: "PENDING_PAYMENT", label: "สั่งซื้อแล้ว",    icon: "📋" },
  { key: "PAID",            label: "ชำระเงินแล้ว",    icon: "✓" },
  { key: "QUEUED_DELIVERY", label: "กำลังส่ง",        icon: "📦" },
  { key: "DELIVERED",       label: "ส่งแล้ว",          icon: "✓" },
];

const deliveryStatusLabels: Record<string, string> = {
  PENDING:   "รอดำเนินการ",
  QUEUED:    "รอส่ง",
  DELIVERED: "ส่งแล้ว",
  FAILED:    "ล้มเหลว",
};

const deliveryStatusColors: Record<string, string> = {
  PENDING:   "bg-gray-500/20 text-gray-300",
  QUEUED:    "bg-indigo-500/20 text-indigo-300",
  DELIVERED: "bg-emerald-500/20 text-emerald-300",
  FAILED:    "bg-red-500/20 text-red-300",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-gray-200 transition-colors"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/store/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("ไม่พบข้อมูลออเดอร์");
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-700" />
            <div className="h-32 animate-pulse rounded bg-slate-700" />
            <div className="h-64 animate-pulse rounded bg-slate-700" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-lg text-red-300">{error || "ไม่พบออเดอร์"}</p>
            <Link href="/account/orders">
              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">
                กลับไปรายการออเดอร์
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const config = statusConfig[order.status] || statusConfig.PENDING_PAYMENT;
  const currentStepIndex = timelineSteps.findIndex((step) => step.key === order.status);
  const isPendingPayment = order.status === "PENDING_PAYMENT";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">ออเดอร์ {order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-400">
              สั่งซื้อเมื่อ {new Date(order.createdAt).toLocaleDateString("th-TH", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        {/* ─── QR Payment Banner (only when PENDING_PAYMENT) ─────────────── */}
        {isPendingPayment && (
          <div className="rounded-xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                  <QrCode className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-300 text-lg">รอการชำระเงิน</p>
                  <p className="mt-0.5 text-sm text-yellow-200/70">
                    ออเดอร์นี้ยังรอการชำระเงิน กรุณาสแกน QR Code เพื่อชำระเงิน
                  </p>
                </div>
              </div>
              <Link href={`/checkout/promptpay?order=${order.id}`} className="flex-shrink-0 w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-bold shadow-lg shadow-yellow-500/20 gap-2">
                  <QrCode className="h-4 w-4" />
                  ชำระเงิน / สแกน QR
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Timeline */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">สถานะออเดอร์</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex items-center justify-between">
              {timelineSteps.map((step, index) => {
                const isPast  = index < currentStepIndex;
                const isNow   = index === currentStepIndex;
                const isFuture= index > currentStepIndex;
                return (
                  <div key={step.key} className="relative flex flex-1 flex-col items-center">
                    {/* Connector line */}
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`absolute left-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${
                          isPast || isNow ? "bg-indigo-500" : "bg-slate-700"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 mb-2 flex h-10 w-10 items-center justify-center rounded-full transition-all text-sm ${
                        isPast  ? "bg-indigo-500 text-white" :
                        isNow   ? "bg-indigo-500 text-white ring-4 ring-indigo-500/30" :
                                  "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <p className={`text-xs text-center ${isFuture ? "text-slate-500" : "text-slate-300"}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">รายการสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">สินค้า</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">จำนวน</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">ราคา/ชิ้น</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">รวม</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">สถานะส่ง</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-3 text-slate-200">{item.productName}</td>
                      <td className="px-4 py-3 text-slate-200">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-200">
                        ฿{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-semibold">
                        ฿{Number(item.totalPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={deliveryStatusColors[item.deliveryStatus] || "bg-slate-700 text-slate-300"}>
                          {deliveryStatusLabels[item.deliveryStatus] ?? item.deliveryStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">สรุปราคา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">ราคาสินค้า</span>
              <span className="text-slate-200">฿{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">
                  ส่วนลด {order.couponCode && `(${order.couponCode})`}
                </span>
                <span className="text-emerald-400">-฿{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
              <span className="text-slate-100">ยอดรวม</span>
              <span className="text-amber-400 text-lg">฿{Number(order.total).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        {order.payments.length > 0 && (
          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">ข้อมูลการชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.payments.map((payment) => (
                <div key={payment.id} className="space-y-3 pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ช่องทาง</span>
                    <span className="text-slate-200 capitalize">{payment.provider}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">สถานะ</span>
                    <Badge
                      className={
                        payment.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : payment.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }
                    >
                      {payment.status === "COMPLETED" ? "สำเร็จ"
                        : payment.status === "PENDING" ? "รอดำเนินการ"
                        : payment.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">จำนวนเงิน</span>
                    <span className="text-amber-400 font-semibold">
                      ฿{Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                  {payment.providerTransactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">รหัสธุรกรรม</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                          {payment.providerTransactionId}
                        </code>
                        <CopyButton text={payment.providerTransactionId} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Minecraft Account */}
        {(order.playerName || order.playerUuid) && (
          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">บัญชี Minecraft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.playerName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ชื่อผู้เล่น</span>
                  <span className="text-slate-200">{order.playerName}</span>
                </div>
              )}
              {order.playerUuid && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400">UUID</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                      {order.playerUuid}
                    </code>
                    <CopyButton text={order.playerUuid} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap pt-2 pb-8">
          <Link href="/account/orders">
            <Button variant="outline" className="border-slate-600 text-slate-400 hover:text-slate-200">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              กลับรายการออเดอร์
            </Button>
          </Link>
          {isPendingPayment && (
            <Link href={`/checkout/promptpay?order=${order.id}`}>
              <Button className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-bold gap-2">
                <QrCode className="h-4 w-4" />
                ชำระเงิน / สแกน QR
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
