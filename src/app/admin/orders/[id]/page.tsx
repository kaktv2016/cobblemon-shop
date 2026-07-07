"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  CheckCircle2,
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryStatus: string;
  productType: string;
}

interface DeliveryLog {
  id: string;
  attempt: number;
  status: string;
  command: string;
  response: string | null;
  error: string | null;
  executedAt: string;
}

interface DeliveryJob {
  id: string;
  status: string;
  renderedCommand: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  response: string | null;
  error: string | null;
  logs: DeliveryLog[];
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
  updatedAt: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  playerName: string | null;
  playerUuid: string | null;
  notes: string | null;
  items: OrderItem[];
  payments: PaymentTransaction[];
  deliveryJobs: DeliveryJob[];
  user: {
    id: string;
    username: string;
    email: string;
  };
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING_PAYMENT: { color: "bg-yellow-500/20 text-yellow-300", label: "Awaiting Payment" },
  PAID: { color: "bg-blue-500/20 text-blue-300", label: "Payment Confirmed" },
  QUEUED_DELIVERY: { color: "bg-indigo-500/20 text-indigo-300", label: "In Delivery" },
  DELIVERED: { color: "bg-emerald-500/20 text-emerald-300", label: "Delivered" },
  PARTIALLY_DELIVERED: { color: "bg-cyan-500/20 text-cyan-300", label: "Partially Delivered" },
  FAILED_DELIVERY: { color: "bg-red-500/20 text-red-300", label: "Delivery Failed" },
  REFUNDED: { color: "bg-purple-500/20 text-purple-300", label: "Refunded" },
  CANCELED: { color: "bg-gray-500/20 text-gray-300", label: "Canceled" },
};

const deliveryStatusColors: Record<string, string> = {
  PENDING: "bg-gray-500/20 text-gray-300",
  QUEUED: "bg-indigo-500/20 text-indigo-300",
  DELIVERED: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-red-500/20 text-red-300",
};

const jobStatusColors: Record<string, string> = {
  PENDING: "bg-gray-500/20 text-gray-300",
  PROCESSING: "bg-yellow-500/20 text-yellow-300",
  SUCCESS: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-red-500/20 text-red-300",
  SKIPPED: "bg-slate-500/20 text-slate-300",
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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  async function fetchOrder() {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      const data = await response.json();
      setOrder(data);
      setNotes(data.notes || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!confirm(`Change order status to ${newStatus}?`)) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update order");
      await fetchOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQueueDelivery() {
    if (!confirm("Queue delivery for this order?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_delivery_jobs" }),
      });

      if (!response.ok) throw new Error("Failed to queue delivery");
      await fetchOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to queue delivery");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!confirm("ยืนยันว่าลูกค้าชำระเงินผ่าน PromptPay แล้ว?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to confirm payment");
      await fetchOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRetryDelivery(jobId: string) {
    if (!confirm("Retry delivery for this job?")) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) throw new Error("Failed to retry delivery");
      await fetchOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to retry delivery");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-700" />
        <div className="h-32 animate-pulse rounded bg-slate-700" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <p className="text-lg text-red-300">{error || "Order not found"}</p>
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig.PENDING_PAYMENT;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Created {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={config.color}>{config.label}</Badge>
      </div>

      {/* Customer Info */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Username</span>
            <span className="text-slate-200">{order.user.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-200">{order.user.email}</span>
          </div>
          {order.playerName && (
            <div className="flex justify-between">
              <span className="text-slate-400">Minecraft Player</span>
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

      {/* Items Table */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                    Delivery
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/20"
                  >
                    <td className="px-4 py-3 text-slate-200">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">
                      <Badge variant="secondary">
                        {item.productType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      ฿{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-semibold">
                      ฿{Number(item.totalPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          deliveryStatusColors[item.deliveryStatus] ||
                          "bg-slate-700 text-slate-300"
                        }
                      >
                        {item.deliveryStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      {order.payments.length > 0 && (
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="space-y-3 pb-4 border-b border-slate-700 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Provider</span>
                  <span className="text-slate-200 capitalize">
                    {payment.provider}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <Badge
                    className={
                      payment.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : payment.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-amber-400 font-semibold">
                    ฿{Number(payment.amount).toFixed(2)}
                  </span>
                </div>
                {payment.providerTransactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Transaction ID</span>
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

      {/* Delivery Jobs */}
      {order.deliveryJobs.length > 0 && (
        <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100">
              Delivery Jobs ({order.deliveryJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.deliveryJobs.map((job) => (
              <div
                key={job.id}
                className="border border-slate-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={
                          jobStatusColors[job.status] ||
                          "bg-slate-700 text-slate-300"
                        }
                      >
                        {job.status}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        Attempt {job.attempts}/{job.maxAttempts}
                      </span>
                    </div>
                    <code className="text-xs text-slate-300 bg-slate-700/50 px-2 py-1 rounded block mt-2 break-all">
                      {job.renderedCommand}
                    </code>
                  </div>
                  {job.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => handleRetryDelivery(job.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Retry
                    </Button>
                  )}
                </div>

                {job.lastAttemptAt && (
                  <div className="text-xs text-slate-400">
                    Last attempt: {new Date(job.lastAttemptAt).toLocaleString()}
                  </div>
                )}

                {job.error && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                    {job.error}
                  </div>
                )}

                {job.logs.length > 0 && (
                  <button
                    onClick={() =>
                      setExpandedLogs(expandedLogs === job.id ? null : job.id)
                    }
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {expandedLogs === job.id ? "Hide" : "Show"} logs (
                    {job.logs.length})
                  </button>
                )}

                {expandedLogs === job.id && job.logs.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                    {job.logs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs bg-slate-700/30 rounded p-2 space-y-1"
                      >
                        <div className="flex justify-between text-slate-400">
                          <span>Attempt {log.attempt}</span>
                          <span>{new Date(log.executedAt).toLocaleTimeString()}</span>
                        </div>
                        {log.response && (
                          <p className="text-slate-300">
                            Response: {log.response}
                          </p>
                        )}
                        {log.error && (
                          <p className="text-red-300">Error: {log.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-slate-200">
              ฿{Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">
                Discount {order.couponCode && `(${order.couponCode})`}
              </span>
              <span className="text-emerald-400">
                -฿{Number(order.discount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
            <span className="text-slate-100">Total</span>
            <span className="text-amber-400 text-lg">
              ฿{Number(order.total).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this order..."
            className="border-slate-600 bg-slate-700/50 text-slate-100"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {order.status === "PENDING_PAYMENT" && (
            <>
              {/* PromptPay confirm button — shown when payment provider is promptpay */}
              {order.payments.some((p) => p.provider === "promptpay") && (
                <Button
                  onClick={handleConfirmPayment}
                  disabled={actionLoading}
                  className="gap-2 bg-cyan-500 text-black hover:bg-cyan-400"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  ยืนยันการชำระเงิน PromptPay
                </Button>
              )}

              {/* Generic mark-as-paid (fallback for other providers) */}
              {!order.payments.some((p) => p.provider === "promptpay") && (
                <Button
                  onClick={() => handleStatusUpdate("PAID")}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Mark as Paid
                </Button>
              )}

              {/* View QR for reference */}
              {order.payments.some((p) => p.provider === "promptpay") && (
                <a
                  href={`/checkout/promptpay?order=${orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10">
                    <QrCode className="h-4 w-4" />
                    ดู QR Code
                  </Button>
                </a>
              )}

              <Button
                onClick={() => handleStatusUpdate("CANCELED")}
                disabled={actionLoading}
                variant="destructive"
              >
                ยกเลิกคำสั่งซื้อ
              </Button>
            </>
          )}

          {order.status === "PAID" && (
            <>
              <Button
                onClick={handleQueueDelivery}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Queue Delivery
              </Button>
              <Button
                onClick={() => handleStatusUpdate("REFUNDED")}
                disabled={actionLoading}
                variant="destructive"
              >
                Refund
              </Button>
            </>
          )}

          {order.status === "FAILED_DELIVERY" && (
            <>
              <Button
                onClick={() => handleStatusUpdate("QUEUED_DELIVERY")}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Retry Delivery
              </Button>
              <Button
                onClick={() => handleStatusUpdate("REFUNDED")}
                disabled={actionLoading}
                variant="destructive"
              >
                Refund
              </Button>
            </>
          )}

          <Link href="/admin/orders">
            <Button variant="outline" className="border-indigo-500/20">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
