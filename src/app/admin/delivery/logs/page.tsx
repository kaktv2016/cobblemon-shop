"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface DeliveryLog {
  id: string;
  jobId: string;
  orderNumber: string;
  playerName: string;
  attemptNumber: number;
  status: string;
  command: string;
  response: string | null;
  error: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  SUCCESS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-300 border-red-500/30",
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  PROCESSING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

function truncate(value: string, maxLength: number = 40) {
  return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
}

function DeliveryLogsSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
    </div>
  );
}

function DeliveryLogsPageContent() {
  const searchParams = useSearchParams();
  const jobIdFilter = searchParams.get("jobId") || "";

  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [jobIdSearch, setJobIdSearch] = useState(jobIdFilter);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, jobIdSearch, statusFilter]);

  async function fetchLogs() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(jobIdSearch && { jobId: jobIdSearch }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/delivery/logs?${params}`);

      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
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
      <Link
        href="/admin/delivery"
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Delivery Queue
      </Link>

      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">Delivery Logs</h1>
        <p className="mt-1 text-gray-400">{total} total logs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">Job ID</label>
          <Input
            placeholder="Search by job ID..."
            value={jobIdSearch}
            onChange={(event) => {
              setJobIdSearch(event.target.value);
              setPage(1);
            }}
            className="border-gray-700 bg-gray-800/50"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400">Status</label>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
          </select>
        </div>
      </div>

      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Attempt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Command
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {logs.map((log) => (
                    <Fragment key={log.id}>
                      <tr className="transition-colors hover:bg-gray-800/20">
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-mono text-sm text-gray-400">
                            {truncate(log.jobId, 12)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/orders/${log.orderNumber}`}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            {log.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{log.playerName}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">#{log.attemptNumber}</td>
                        <td className="px-6 py-4">
                          <Badge
                            className={`border ${statusColors[log.status] || statusColors.PENDING}`}
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="max-w-xs truncate font-mono text-xs text-gray-500">
                            {truncate(log.command, 30)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            {expandedId === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedId === log.id && (
                        <tr className="bg-gray-800/20">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="space-y-3">
                              {log.command && (
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">Command:</p>
                                  <p className="break-all rounded bg-gray-900/50 p-2 font-mono text-sm text-gray-300">
                                    {log.command}
                                  </p>
                                </div>
                              )}
                              {log.response && (
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">Response:</p>
                                  <p className="break-all rounded bg-gray-900/50 p-2 font-mono text-sm text-emerald-300">
                                    {log.response}
                                  </p>
                                </div>
                              )}
                              {log.error && (
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">Error:</p>
                                  <p className="break-all rounded bg-gray-900/50 p-2 font-mono text-sm text-red-300">
                                    {log.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
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

export default function AdminDeliveryLogsPage() {
  return (
    <Suspense fallback={<DeliveryLogsSkeleton />}>
      <DeliveryLogsPageContent />
    </Suspense>
  );
}
