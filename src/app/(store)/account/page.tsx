import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Account - CobbleMart',
};

export default function AccountPage() {
  // Mock user data
  const user = {
    displayName: 'Trainer Alex',
    email: 'trainer@example.com',
    minecraftUsername: 'TrainerAlex',
    minecraftUUID: 'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p',
  };

  const stats = [
    { label: 'Total Orders', value: '12' },
    { label: 'Spent', value: '$120.50' },
    { label: 'Linked Account', value: user.minecraftUsername },
  ];

  const recentOrders = [
    {
      id: 'ORD-001',
      date: '2026-04-05',
      total: '$29.99',
      status: 'completed',
    },
    {
      id: 'ORD-002',
      date: '2026-03-28',
      total: '$9.99',
      status: 'completed',
    },
  ];

  const navigationCards = [
    {
      icon: '⚙️',
      title: 'Profile Settings',
      description: 'Manage your account info',
      href: '/account/settings',
    },
    {
      icon: '🎮',
      title: 'Minecraft Account',
      description: 'Link your Minecraft account',
      href: '/account/minecraft',
    },
    {
      icon: '📦',
      title: 'Order History',
      description: 'View all your orders',
      href: '/account/orders',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold text-slate-100">Welcome back, {user.displayName}</h1>
          <p className="mt-2 text-slate-400">{user.email}</p>
        </div>
      </section>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat, idx) => (
              <Card
                key={idx}
                className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center"
              >
                <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-amber-400">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Navigation Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            {navigationCards.map((card, idx) => (
              <Link key={idx} href={card.href}>
                <Card className="group cursor-pointer border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 transition-all hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/20 h-full">
                  <div className="mb-4 text-4xl">{card.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-400">{card.description}</p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100">Recent Orders</h2>
              <Link href="/account/orders">
                <Button variant="outline" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`}>
                  <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex items-center justify-between cursor-pointer hover:border-indigo-400/40 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-100">{order.id}</p>
                      <p className="text-sm text-slate-400">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-400">{order.total}</p>
                      <p className="text-xs text-emerald-400 capitalize">{order.status}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
