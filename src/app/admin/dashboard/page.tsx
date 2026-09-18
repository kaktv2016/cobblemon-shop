import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatusBadge } from "@/components/admin/admin-badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import MonthlySalesChart from "@/components/admin/monthly-sales-chart";
import { getAdminI18n } from "@/lib/admin-i18n-server";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin-i18n";

export const metadata = {
  title: "Dashboard — Admin",
};

async function getDashboardData() {
  const [
    totalRevenue,
    orderCount,
    ordersByStatus,
    userCount,
    productCount,
    failedDeliveries,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "DELIVERED", "QUEUED_DELIVERY"] } },
    }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.deliveryJob.count({ where: { status: "FAILED" } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, email: true, createdAt: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    ordersByStatus.map((s) => [s.status, s._count.id])
  );

  return {
    revenue: totalRevenue._sum.total || 0,
    orderCount,
    userCount,
    productCount,
    failedDeliveries,
    pendingOrders: statusMap["PENDING_PAYMENT"] || 0,
    processingOrders: (statusMap["PAID"] || 0) + (statusMap["QUEUED_DELIVERY"] || 0),
    recentOrders,
    recentUsers,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { locale, t } = await getAdminI18n();
  const formatPrice = (price: unknown) => formatAdminCurrency(Number(price), locale);

  const statCards = [
    {
      title: t("dashboard.totalRevenue"),
      value: formatPrice(data.revenue),
      icon: DollarSign,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: t("dashboard.totalOrders"),
      value: data.orderCount.toString(),
      icon: ShoppingCart,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: t("dashboard.totalUsers"),
      value: data.userCount.toString(),
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: t("dashboard.activeProducts"),
      value: data.productCount.toString(),
      icon: Package,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-outfit text-3xl font-bold text-white">{t("dashboard.title")}</h1>
        <p className="mt-1 text-gray-400">{t("dashboard.subtitle")}</p>
      </div>

      {/* Alert for failed deliveries */}
      {data.failedDeliveries > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div className="flex-1">
            <p className="font-medium text-red-300">
              {t("dashboard.failedJobs", { count: data.failedDeliveries })}
            </p>
          </div>
          <Link
            href="/admin/delivery"
            className="text-sm font-medium text-red-400 hover:text-red-300"
          >
            {t("dashboard.viewQueue")}
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-gray-800/50 bg-gray-900/50"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("dashboard.pendingPayment")}</p>
              <p className="text-lg font-bold text-white">{data.pendingOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("dashboard.processing")}</p>
              <p className="text-lg font-bold text-white">{data.processingOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("dashboard.failedDeliveries")}</p>
              <p className="text-lg font-bold text-white">{data.failedDeliveries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Sales Analytics */}
      <div className="space-y-2">
        <h2 className="font-outfit text-xl font-semibold text-white">
          {t("dashboard.monthlyAnalytics")}
        </h2>
        <p className="text-sm text-gray-400">
          {t("dashboard.monthlySubtitle")}
        </p>
      </div>
      <MonthlySalesChart />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg text-white">{t("dashboard.recentOrders")}</CardTitle>
            <Link href="/admin/orders" className="text-sm text-indigo-400 hover:text-indigo-300">
              {t("dashboard.viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800/50">
              {data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-800/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.username} · {t("dashboard.items", { count: order._count.items })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatPrice(order.total)}
                      </p>
                      <AdminStatusBadge status={order.status} className="text-xs" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-gray-500">
                  {t("dashboard.noOrders")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="border-gray-800/50 bg-gray-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg text-white">{t("dashboard.recentSignups")}</CardTitle>
            <Link href="/admin/users" className="text-sm text-indigo-400 hover:text-indigo-300">
              {t("dashboard.viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800/50">
              {data.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white" data-admin-user-content>{user.username}</p>
                      <p className="text-xs text-gray-500" data-admin-user-content>{user.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatAdminDate(user.createdAt, locale)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
