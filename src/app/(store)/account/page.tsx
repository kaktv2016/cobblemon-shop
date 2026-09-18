import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Package, Settings, UserRound } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Account" };

function baht(value: unknown) {
  return Number(value).toLocaleString("th-TH", { style: "currency", currency: "THB" });
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/account");

  const [user, orderStats, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true, displayName: true, minecraftAccount: { select: { username: true } } },
    }),
    prisma.order.aggregate({
      where: { userId: session.user.id, status: { in: ["PAID", "QUEUED_DELIVERY", "DELIVERED", "PARTIALLY_DELIVERED"] } },
      _count: { _all: true }, _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, orderNumber: true, createdAt: true, total: true, status: true },
    }),
  ]);
  if (!user) redirect("/login");
  const minecraftName = user.minecraftAccount?.username || user.username;

  const navigation = [
    { icon: Settings, title: "Profile Settings", description: "Manage your profile and AuthMe password", href: "/account/settings" },
    { icon: UserRound, title: "Minecraft Account", description: `Purchases are delivered to ${minecraftName}`, href: "/account/minecraft" },
    { icon: Package, title: "Order History", description: "View payments and delivery status", href: "/account/orders" },
  ];

  return <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
    <section className="border-b border-indigo-500/20 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><h1 className="text-4xl font-bold text-slate-100">Welcome back, {user.displayName || user.username}</h1><p className="mt-2 text-slate-400">{user.email}</p></div></section>
    <div className="px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-12">
      <div className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Paid Orders", value: orderStats._count._all }, { label: "Total Spent", value: baht(orderStats._sum.total || 0) }, { label: "Minecraft Account", value: minecraftName }].map((stat) => <Card key={stat.label} className="border-indigo-500/20 bg-slate-900/70 p-6 text-center"><p className="mb-2 text-sm text-slate-400">{stat.label}</p><p className="text-2xl font-bold text-amber-400" data-admin-user-content>{stat.value}</p></Card>)}
      </div>
      <div className="grid gap-6 sm:grid-cols-3">{navigation.map(({ icon: Icon, ...item }) => <Link key={item.href} href={item.href}><Card className="group h-full border-indigo-500/20 bg-slate-900/70 p-6 transition hover:border-indigo-400/50"><Icon className="mb-4 h-8 w-8 text-indigo-300" /><h2 className="mb-2 text-lg font-semibold text-slate-100 group-hover:text-amber-400">{item.title}</h2><p className="text-sm text-slate-400">{item.description}</p></Card></Link>)}</div>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold text-slate-100">Recent Orders</h2><Button asChild variant="outline"><Link href="/account/orders">View All</Link></Button></div>
        {recentOrders.length === 0 ? <Card className="border-indigo-500/20 bg-slate-900/70 p-8 text-center text-slate-400">You have not placed an order yet.</Card> : <div className="space-y-3">{recentOrders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`}><Card className="flex items-center justify-between border-indigo-500/20 bg-slate-900/70 p-4 transition hover:border-indigo-400/50"><div><p className="font-semibold text-slate-100">{order.orderNumber}</p><p className="text-sm text-slate-400">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</p></div><div className="text-right"><p className="font-bold text-amber-400">{baht(order.total)}</p><p className="text-xs text-slate-300">{order.status.replaceAll("_", " ")}</p></div></Card></Link>)}</div>}
      </section>
    </div></div>
  </main>;
}
