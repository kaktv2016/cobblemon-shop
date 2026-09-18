"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBadge } from "@/components/admin/admin-badge";
import {
  TrendingUp, TrendingDown, ShoppingCart, BarChart3,
  Trophy, Loader2, ArrowUpRight, ArrowDownRight, Minus,
  Wallet, Receipt, BadgePercent,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface MonthData {
  key: string;
  label: string;
  fullLabel: string;
  month: number;
  year: number;
  revenue: number;
  fee: number;
  netRevenue: number;
  orders: number;
}

interface ComparisonData {
  currentMonth: { key: string; label: string; revenue: number; fee: number; netRevenue: number; orders: number };
  previousMonth: { key: string; label: string; revenue: number; fee: number; netRevenue: number; orders: number } | null;
  revenueChange: number;
  netRevenueChange: number;
  ordersChange: number;
}

interface SummaryData {
  totalRevenue: number;
  totalFee: number;
  totalNetRevenue: number;
  totalOrders: number;
  avgMonthlyRevenue: number;
  avgMonthlyNetRevenue: number;
  bestMonth: { key: string; label: string; revenue: number; fee: number; netRevenue: number; orders: number };
}

interface MonthlySalesData {
  feeRate: number;
  months: MonthData[];
  comparison: ComparisonData;
  summary: SummaryData;
}

type ChartView = "area" | "bar";

/* ─── Helpers ────────────────────────────────────────────────────────── */

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
        <ArrowUpRight className="h-4 w-4" />+{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-400">
        <ArrowDownRight className="h-4 w-4" />{value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-400">
      <Minus className="h-4 w-4" />0%
    </span>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  const { formatCurrency } = useAdminPreferences();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-300">{entry.name}:</span>
          <span className="text-xs font-semibold text-white">
            {entry.name === "Orders" ? entry.value : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export default function MonthlySalesChart() {
  const { formatCurrency, formatNumber, locale, theme } = useAdminPreferences();
  const formatPrice = formatCurrency;
  const [data, setData] = useState<MonthlySalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartView, setChartView] = useState<ChartView>("area");

  useEffect(() => {
    fetch("/api/admin/dashboard/monthly-sales")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("ไม่สามารถโหลดข้อมูลยอดขายได้"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardContent className="flex h-96 items-center justify-center">
          <p className="text-sm text-red-400">{error || "ไม่มีข้อมูล"}</p>
        </CardContent>
      </Card>
    );
  }

  const { months, comparison, summary, feeRate } = data;
  const feePercent = (feeRate * 100).toFixed(1);
  const monthLabel = (key: string, long = false) => {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
      month: long ? "long" : "short", year: long ? "numeric" : "2-digit", timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  };
  const chartMonths = months.map((month) => ({ ...month, label: monthLabel(month.key) }));
  const labels = locale === "th" ? {
    gross: "ยอดขายรวม", fee: "ค่าธรรมเนียมโดยประมาณ", net: "รายได้สุทธิ", orders: "ออเดอร์",
    average: "เฉลี่ยสุทธิ / เดือน", best: "เดือนที่ดีที่สุด", versus: "เทียบเดือนก่อน",
    deducted: "หักออกจากยอดขาย", lastYear: "ย้อนหลัง 12 เดือน",
  } : {
    gross: "Gross revenue", fee: "Estimated payment fee", net: "Net revenue", orders: "Orders",
    average: "Average net / month", best: "Best month", versus: "vs previous month",
    deducted: "Deducted from revenue", lastYear: "Last 12 months",
  };
  const chartColors = theme === "light"
    ? { grid: "#dbe3ee", tick: "#5d6b82", revenue: "#4f46e5", net: "#047857", orders: "#1d4ed8", active: "#ffffff" }
    : { grid: "#1e293b", tick: "#94a3b8", revenue: "#818cf8", net: "#34d399", orders: "#67e8f9", active: "#ffffff" };

  /* ── Stat cards ────────────────────────────────────────────────────── */
  const statCards = [
    {
      label: `${labels.gross} (${monthLabel(comparison.currentMonth.key, true)})`,
      value: formatPrice(comparison.currentMonth.revenue),
      sub: <><ChangeIndicator value={comparison.revenueChange} /><span className="text-xs text-gray-500 ml-1">{labels.versus}</span></>,
      icon: <TrendingUp className="h-4 w-4 text-indigo-400" />,
      iconBg: "border-indigo-500/20 bg-indigo-500/10",
    },
    {
      label: `${labels.fee} (${feePercent}%)`,
      value: formatPrice(comparison.currentMonth.fee),
      sub: <span className="text-xs text-gray-500">{labels.deducted}</span>,
      icon: <BadgePercent className="h-4 w-4 text-rose-400" />,
      iconBg: "border-rose-500/20 bg-rose-500/10",
    },
    {
      label: `${labels.net} (${monthLabel(comparison.currentMonth.key, true)})`,
      value: formatPrice(comparison.currentMonth.netRevenue),
      sub: <><ChangeIndicator value={comparison.netRevenueChange} /><span className="text-xs text-gray-500 ml-1">{labels.versus}</span></>,
      icon: <Wallet className="h-4 w-4 text-emerald-400" />,
      iconBg: "border-emerald-500/20 bg-emerald-500/10",
    },
    {
      label: `${labels.orders} (${monthLabel(comparison.currentMonth.key, true)})`,
      value: formatNumber(comparison.currentMonth.orders),
      sub: <><ChangeIndicator value={comparison.ordersChange} /><span className="text-xs text-gray-500 ml-1">{labels.versus}</span></>,
      icon: <ShoppingCart className="h-4 w-4 text-cyan-400" />,
      iconBg: "border-cyan-500/20 bg-cyan-500/10",
    },
    {
      label: labels.average,
      value: formatPrice(summary.avgMonthlyNetRevenue),
      sub: <span className="text-xs text-gray-500">{labels.lastYear}</span>,
      icon: <BarChart3 className="h-4 w-4 text-purple-400" />,
      iconBg: "border-purple-500/20 bg-purple-500/10",
    },
    {
      label: labels.best,
      value: formatPrice(summary.bestMonth.netRevenue),
      sub: <span className="text-xs text-gray-500">{monthLabel(summary.bestMonth.key, true)} · {summary.bestMonth.orders} {labels.orders}</span>,
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
      iconBg: "border-amber-500/20 bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-gray-800/50 bg-gray-900/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${card.iconBg}`}>
                  {card.icon}
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
              <div className="mt-1 flex items-center gap-1">{card.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Chart ──────────────────────────────────────────────────── */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg text-white">{locale === "th" ? "ยอดขายรายเดือน" : "Monthly sales"}</CardTitle>
            <p className="mt-0.5 text-xs text-gray-500">
              {locale === "th" ? "สีม่วง = ยอดรวม · สีเขียว = สุทธิ · สีฟ้า = ออเดอร์" : "Indigo = gross · green = net · blue = orders"}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-700/50 bg-gray-800/50 p-0.5">
            {(["area", "bar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  chartView === v ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {v === "area" ? "Area" : "Bar"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === "area" ? (
                <AreaChart data={chartMonths} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.revenue} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartColors.revenue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.net} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartColors.net} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.orders} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chartColors.orders} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="label" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="revenue" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`} />
                  <YAxis yAxisId="orders" orientation="right" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: chartColors.tick }} />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" name={labels.gross}
                    stroke={chartColors.revenue} strokeWidth={2} fill="url(#gRevenue)"
                    dot={{ fill: chartColors.revenue, strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: chartColors.revenue, strokeWidth: 2, stroke: chartColors.active, r: 5 }} />
                  <Area yAxisId="revenue" type="monotone" dataKey="netRevenue" name={labels.net}
                    stroke={chartColors.net} strokeWidth={2.5} fill="url(#gNet)"
                    dot={{ fill: chartColors.net, strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: chartColors.net, strokeWidth: 2, stroke: chartColors.active, r: 5 }} />
                  <Area yAxisId="orders" type="monotone" dataKey="orders" name={labels.orders}
                    stroke={chartColors.orders} strokeWidth={1.5} fill="url(#gOrders)"
                    dot={{ fill: chartColors.orders, strokeWidth: 0, r: 3 }}
                    activeDot={{ fill: chartColors.orders, strokeWidth: 2, stroke: chartColors.active, r: 5 }} />
                </AreaChart>
              ) : (
                <BarChart data={chartMonths} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="label" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="revenue" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`} />
                  <YAxis yAxisId="orders" orientation="right" stroke={chartColors.tick} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: chartColors.tick }} />
                  <Bar yAxisId="revenue" dataKey="revenue" name={labels.gross} fill={chartColors.revenue} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar yAxisId="revenue" dataKey="netRevenue" name={labels.net} fill={chartColors.net} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar yAxisId="orders" dataKey="orders" name={labels.orders} fill={chartColors.orders} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Monthly Summary Table ────────────────────────────────────── */}
      <Card className="border-gray-800/50 bg-gray-900/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg text-white">{locale === "th" ? "ตารางรายเดือน" : "Monthly table"}</CardTitle>
            <p className="mt-0.5 text-xs text-gray-500">
              {labels.fee} {feePercent}% · {labels.net} = {labels.gross} − {locale === "th" ? "ค่าธรรมเนียม" : "fee"}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{locale === "th" ? "รวม" : "Total"}: {formatPrice(summary.totalRevenue)}</div>
            <div className="text-rose-400">Fee: −{formatPrice(summary.totalFee)}</div>
            <div className="text-emerald-400 font-semibold">{labels.net}: {formatPrice(summary.totalNetRevenue)}</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/50">
                  {[
                    [locale === "th" ? "เดือน" : "Month", "left"],
                    [labels.gross, "right"],
                    [`Fee (${feePercent}%)`, "right"],
                    [labels.net, "right"],
                    [labels.orders, "right"],
                    [locale === "th" ? "เฉลี่ย/ออเดอร์" : "Average/order", "right"],
                    [locale === "th" ? "สัดส่วน" : "Share", "left"],
                  ].map(([h, align]) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-${align} text-xs font-medium uppercase tracking-wider text-gray-400`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {[...chartMonths].reverse().map((month, idx) => {
                  const avgPerOrder = month.orders > 0 ? month.revenue / month.orders : 0;
                  const revenueShare =
                    summary.totalRevenue > 0
                      ? (month.revenue / summary.totalRevenue) * 100
                      : 0;
                  const isCurrent = idx === 0;

                  return (
                    <tr
                      key={month.key}
                      className={`transition-colors hover:bg-gray-800/30 ${isCurrent ? "bg-indigo-500/5" : ""}`}
                    >
                      {/* Month */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{monthLabel(month.key, true)}</span>
                          {isCurrent && (
                            <AdminBadge tone="accent">{locale === "th" ? "ปัจจุบัน" : "Current"}</AdminBadge>
                          )}
                        </div>
                      </td>
                      {/* Gross revenue */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="text-sm font-semibold text-white">
                          {formatPrice(month.revenue)}
                        </span>
                      </td>
                      {/* Fee */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="text-sm font-medium text-rose-400">
                          {month.fee > 0 ? `−${formatPrice(month.fee)}` : "—"}
                        </span>
                      </td>
                      {/* Net revenue */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="text-sm font-bold text-emerald-400">
                          {formatPrice(month.netRevenue)}
                        </span>
                      </td>
                      {/* Orders */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="text-sm text-gray-300">{month.orders}</span>
                      </td>
                      {/* Avg per order */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <span className="text-sm text-gray-400">
                          {month.orders > 0 ? formatPrice(Math.round(avgPerOrder)) : "—"}
                        </span>
                      </td>
                      {/* Revenue share bar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${Math.min(revenueShare, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{revenueShare.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="border-t-2 border-gray-700/50 bg-gray-800/30">
                  <td className="px-5 py-3 text-sm font-bold text-white">{locale === "th" ? "รวม 12 เดือน" : "12-month total"}</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-white">
                    {formatPrice(summary.totalRevenue)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-rose-400">
                    −{formatPrice(summary.totalFee)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-emerald-400">
                    {formatPrice(summary.totalNetRevenue)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-300">
                    {summary.totalOrders}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-400">
                    {summary.totalOrders > 0
                      ? formatPrice(Math.round(summary.totalRevenue / summary.totalOrders))
                      : "—"}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
