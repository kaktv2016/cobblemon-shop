"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ExternalLink, ChevronDown } from "lucide-react";

function formatPrice(price: any): string {
  return `฿${Number(price).toLocaleString()}`;
}

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  PAID: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  QUEUED_DELIVERY: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  DELIVERED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  PARTIALLY_DELIVERED: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  FAILED_DELIVERY: "border-red-500/30 bg-red-500/10 text-red-400",
  REFUNDED: "border-gray-500/30 bg-gray-500/10 text-gray-400",
  CANCELED: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAID", label: "Paid" },
  { value: "QUEUED_DELIVERY", label: "Queued Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED_DELIVERY", label: "Failed Delivery" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELED", label: "Canceled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-gray-400">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search by order #, player, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border-gray-700 bg-gray-800/50 pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm text-gray-300 outline-none focus:border-indigo-500"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm font-medium text-white">{order.orderNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white">{order.user?.username}</p>
                        <p className="text-xs text-gray-500">{order.playerName || order.user?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[order.status] || "bg-gray-500/10 text-gray-400"}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/orders/${order.id}`}>
                            View <ExternalLink className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-gray-700">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="border-gray-700">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
