"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminBadge } from "@/components/admin/admin-badge";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import type { AdminTone } from "@/lib/admin-ui";

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  target: string;
  targetId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

const actionTones: Record<string, AdminTone> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  CREATE_COUPON: "success",
  UPDATE_COUPON: "info",
  DELETE_COUPON: "danger",
  ASSIGN_ROLE: "accent",
  REMOVE_ROLE: "accent",
  UPDATE_USER: "info",
  PROCESS_DELIVERY_QUEUE: "info",
  RETRY_DELIVERY: "info",
};

function getActionType(action: string): string {
  if (action.includes("CREATE")) return "CREATE";
  if (action.includes("UPDATE")) return "UPDATE";
  if (action.includes("DELETE")) return "DELETE";
  if (action.includes("ASSIGN") || action.includes("REMOVE")) return "ASSIGN_ROLE";
  return action;
}

export default function AdminAuditPage() {
  const { addToast } = useToast();
  const { formatDate } = useAdminPreferences();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, userEmail, actionFilter, dateFrom, dateTo]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(userEmail && { userEmail }),
        ...(actionFilter && { action: actionFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load audit logs");
      setLogs(data.data);
      setTotal(data.total);
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to load audit logs" });
    } finally {
      setLoading(false);
    }
  }

  async function exportLogs() {
    try {
      const params = new URLSearchParams({
        format: "csv",
        ...(userEmail && { userEmail }),
        ...(actionFilter && { action: actionFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const response = await fetch(`/api/admin/audit?${params}`);
      if (!response.ok) throw new Error("Unable to export audit logs");
      const url = window.URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast({ type: "success", message: "Audit log export downloaded" });
    } catch (err) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Unable to export audit logs" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">Audit Log</h1>
          <p className="mt-1 text-gray-400">{total} total entries</p>
        </div>
        <Button
          onClick={exportLogs}
          variant="outline"
          className="border-gray-700 text-gray-300"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            User Email
          </label>
          <Input
            placeholder="Search by email..."
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value);
              setPage(1);
            }}
            className="border-gray-700 bg-gray-800/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Action
          </label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="ASSIGN_ROLE">Assign Role</option>
            <option value="REMOVE_ROLE">Remove Role</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            From Date
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="border-gray-700 bg-gray-800/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            To Date
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="border-gray-700 bg-gray-800/50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No audit logs found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Target ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {logs.map((log) => {
                    const actionType = getActionType(log.action);
                    const tone = actionTones[actionType] || "neutral";
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {formatDate(log.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            {log.userEmail}
                          </td>
                          <td className="px-6 py-4">
                            <AdminBadge tone={tone} dot>{log.action}</AdminBadge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {log.target}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {log.targetId || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {log.ipAddress || "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {Object.keys(log.details || {}).length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedId(expandedId === log.id ? null : log.id)
                                }
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                {expandedId === log.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr className="bg-gray-800/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  Details:
                                </p>
                                <pre className="font-mono text-xs text-gray-300 bg-gray-900/50 p-3 rounded overflow-auto max-h-96">
                                  {JSON.stringify(log.details || {}, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
