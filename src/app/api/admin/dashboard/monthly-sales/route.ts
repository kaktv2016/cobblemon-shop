import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/dashboard/monthly-sales
 * Returns monthly revenue + order count for the last 12 months,
 * including GBPrimePay fee deduction breakdown.
 *
 * Fee rate is read from GBPRIMEPAY_FEE_RATE env var (default 2.5%).
 */

const FEE_RATE = parseFloat(process.env.PAYMENT_FEE_RATE || "0.015");

function calcFee(revenue: number) {
  return Math.round(revenue * FEE_RATE * 100) / 100;
}

function calcNet(revenue: number) {
  return Math.round((revenue - calcFee(revenue)) * 100) / 100;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Build date range: 12 months ago from the start of this month
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(
    startOfThisMonth.getFullYear(),
    startOfThisMonth.getMonth() - 11,
    1
  );

  // Fetch all completed orders in range
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "DELIVERED", "QUEUED_DELIVERY", "PARTIALLY_DELIVERED"] },
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const monthlyMap = new Map<string, { revenue: number; orders: number }>();

  // Pre-fill all 12 months so months with 0 sales still appear
  for (let i = 0; i < 12; i++) {
    const d = new Date(
      twelveMonthsAgo.getFullYear(),
      twelveMonthsAgo.getMonth() + i,
      1
    );
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key);
    if (entry) {
      entry.revenue += Number(order.total);
      entry.orders += 1;
    }
  }

  // Convert to sorted array with fee breakdown
  const monthNames = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  const months = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [year, month] = key.split("-");
      const monthIndex = parseInt(month, 10) - 1;
      const revenue = Math.round(data.revenue * 100) / 100;
      const fee = calcFee(revenue);
      const netRevenue = calcNet(revenue);
      return {
        key,
        label: `${monthNames[monthIndex]} ${year.slice(2)}`,
        fullLabel: `${monthNames[monthIndex]} ${year}`,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        revenue,       // gross
        fee,           // GBPrimePay gateway fee
        netRevenue,    // revenue after fee
        orders: data.orders,
      };
    });

  // Current vs previous month comparison
  const currentMonth = months[months.length - 1];
  const previousMonth = months.length >= 2 ? months[months.length - 2] : null;

  const revenueChange =
    previousMonth && previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      : currentMonth.revenue > 0 ? 100 : 0;

  const netRevenueChange =
    previousMonth && previousMonth.netRevenue > 0
      ? ((currentMonth.netRevenue - previousMonth.netRevenue) / previousMonth.netRevenue) * 100
      : currentMonth.netRevenue > 0 ? 100 : 0;

  const ordersChange =
    previousMonth && previousMonth.orders > 0
      ? ((currentMonth.orders - previousMonth.orders) / previousMonth.orders) * 100
      : currentMonth.orders > 0 ? 100 : 0;

  // Totals
  const totalRevenue    = Math.round(months.reduce((s, m) => s + m.revenue, 0) * 100) / 100;
  const totalFee        = Math.round(months.reduce((s, m) => s + m.fee, 0) * 100) / 100;
  const totalNetRevenue = Math.round(months.reduce((s, m) => s + m.netRevenue, 0) * 100) / 100;
  const totalOrders     = months.reduce((s, m) => s + m.orders, 0);

  const avgMonthlyRevenue    = Math.round((totalRevenue / 12) * 100) / 100;
  const avgMonthlyNetRevenue = Math.round((totalNetRevenue / 12) * 100) / 100;

  const bestMonth = months.reduce(
    (best, m) => (m.netRevenue > best.netRevenue ? m : best),
    months[0]
  );

  return NextResponse.json({
    feeRate: FEE_RATE,          // so the UI can display "2.5%"
    months,
    comparison: {
      currentMonth: {
        label: currentMonth.fullLabel,
        revenue: currentMonth.revenue,
        fee: currentMonth.fee,
        netRevenue: currentMonth.netRevenue,
        orders: currentMonth.orders,
      },
      previousMonth: previousMonth
        ? {
            label: previousMonth.fullLabel,
            revenue: previousMonth.revenue,
            fee: previousMonth.fee,
            netRevenue: previousMonth.netRevenue,
            orders: previousMonth.orders,
          }
        : null,
      revenueChange: Math.round(revenueChange * 10) / 10,
      netRevenueChange: Math.round(netRevenueChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
    },
    summary: {
      totalRevenue,
      totalFee,
      totalNetRevenue,
      totalOrders,
      avgMonthlyRevenue,
      avgMonthlyNetRevenue,
      bestMonth: {
        label: bestMonth.fullLabel,
        revenue: bestMonth.revenue,
        fee: bestMonth.fee,
        netRevenue: bestMonth.netRevenue,
        orders: bestMonth.orders,
      },
    },
  });
}
