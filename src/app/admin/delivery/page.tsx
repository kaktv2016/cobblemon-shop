"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  Loader2,
  ChevronDown,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeliveryJob {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  playerName: string;
  command: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: string | null;
  error: string | null;
}

interface Stats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

function truncate(str: string, maxLength: number = 40): string {
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  PROCESSING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  SUCCESS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  FAILED: "bg-red-500/20 text-red-300 border-red-500/30",
  SKIPPED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const statusIcons: Record<string, React.ComponentType<any>> = {
  PENDING: Clock,
  PROCESSING: Loader2,
  SUCCESS: CheckCircle,
  FAILED: AlertCircle,
  SKIPPED: () => null,
};

export default function AdminDeliveryPage() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
  });
  const [currentStatus, setCurrentStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [currentStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function fetchJobs() {
    try {
      const params = new URLSearchParams({
        ...(currentStatus !== "all" && { status: currentStatus.toUpperCase() }),
        limit: "50",
      });
      const res = await fetch(`/api/admin/delivery?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.data);

        // Calculate stats
        const allRes = await fetch("/api/admin/delivery");
        if (allRes.ok) {
          const allData = await allRes.json();
          const allJobs = allData.data;
          setStats({
            pending: allJobs.filter((j: DeliveryJob) => j.status === "PENDING").length,
            processing: allJobs.filter((j: DeliveryJob) => j.status === "PROCESSING")
              .length,
            failed: allJobs.filter((j: DeliveryJob) => j.status === "FAILED").length,
            completed: allJobs.filter((j: DeliveryJob) => j.status === "SUCCESS").length,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function processAllPending() {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_queue", batchSize: 10 }),
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }

  async function processJob(jobId: string) {
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_job", jobId }),
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function retryJob(jobId: string) {
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", jobId }),
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-white">Delivery Queue</h1>
          <p className="mt-1 text-gray-400">Manage order deliveries</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900"
            />
            Auto-refresh
          </label>
          <Button
            onClick={processAllPending}
            disabled={processing || stats.pending === 0}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Process All ({stats.pending})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.pending}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Processing</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.processing}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Failed</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.failed}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="mt-1 text-2xl font-bold text-white">{stats.completed}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <Tabs defaultValue="all" onValueChange={setCurrentStatus} className="w-full">
          <TabsList className="w-full justify-start border-b border-gray-800 bg-transparent">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="success">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={currentStatus} className="p-0">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              ) : jobs.length === 0 ? (
                <p className="py-12 text-center text-gray-500">No jobs found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800/50">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Job ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Command
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Last Try
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-mono text-sm text-gray-400">
                              {truncate(job.id, 12)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/admin/orders/${job.orderId}`}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {job.orderNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {job.productName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {job.playerName}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p className="font-mono text-xs text-gray-500 max-w-xs truncate">
                              {truncate(job.command, 30)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`border ${statusColors[job.status] || statusColors.PENDING}`}
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {job.attempts}/{job.maxAttempts}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {job.lastAttemptAt
                              ? new Date(job.lastAttemptAt).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-gray-800 border-gray-700"
                              >
                                {job.status === "PENDING" && (
                                  <DropdownMenuItem onClick={() => processJob(job.id)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Process
                                  </DropdownMenuItem>
                                )}
                                {job.status === "FAILED" && (
                                  <DropdownMenuItem onClick={() => retryJob(job.id)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Retry
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/delivery/logs?jobId=${job.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Logs
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
