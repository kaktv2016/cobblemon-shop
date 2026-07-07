'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BookOpen,
  Download,
  HelpCircle,
  Home,
  Menu,
  Newspaper,
  ShoppingCart,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassButton } from '@/components/ui/glass-button';
import { Avatar } from '@/components/ui/avatar';
import { TransitionLink } from '@/components/shared/transition-link';
import { useCart } from '@/components/shared/cart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/#world', label: 'โลกของเซิร์ฟ', icon: Sparkles },
  { href: '/store', label: 'ร้านค้า', icon: Store },
  { href: '/wiki', label: 'Wiki', icon: BookOpen },
  { href: '/news', label: 'ข่าวสาร', icon: Newspaper },
  { href: '/support', label: 'ช่วยเหลือ', icon: HelpCircle },
];

const prefetchRoutes = ['/', '/store', '/wiki', '/news', '/support', '/login', '/register', '/cart', '/download'];

export function StoreNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { count: cartCount } = useCart();

  useEffect(() => {
    const prefetchAll = () => {
      prefetchRoutes.forEach((route) => router.prefetch(route));
    };

    const browserWindow = globalThis as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof window === 'undefined') {
      return;
    }

    if (typeof browserWindow.requestIdleCallback === 'function') {
      const idleId = browserWindow.requestIdleCallback(() => {
        prefetchAll();
      });

      return () => browserWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => {
      prefetchAll();
    }, 350);

    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  return (
    <nav className="theme-nav-shell sticky top-0 z-50 border-b backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/26 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.35rem] items-center justify-between gap-6 py-3">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/50 via-cyan-400/26 to-transparent blur-md" />
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md">
                <Image
                  src="/images/logo.png"
                  alt="Cobblemon Divided"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="hidden min-w-0 flex-col sm:flex">
              <span className="font-display text-[1.05rem] font-semibold leading-none text-white">
                Cobblemon Divided
              </span>
              <span className="mt-1 text-[10px] tracking-[0.26em] text-slate-500">
                PREMIUM COBBLEMON PORTAL
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  <Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-cyan-200" />
                  <span>{link.label}</span>
                  <div className="absolute -bottom-3 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-300/0 via-cyan-300/70 to-cyan-300/0 transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            {/* ── เล่นเลย / Download button ── */}
            <Link
              href="/download"
              className="hidden items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/14 hover:text-emerald-200 lg:flex"
            >
              <Download className="h-3.5 w-3.5" />
              เล่นเลย
            </Link>

            <Link href="/cart" className="group">
              <Button
                variant="ghost"
                size="icon"
                className="theme-surface-control relative h-11 w-11 rounded-2xl border text-slate-300 hover:text-white"
              >
                <ShoppingCart className="h-[1.125rem] w-[1.125rem]" />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/12 px-1 text-[10px] font-semibold text-cyan-100 animate-[cart-pop_300ms_ease]">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {status === 'loading' ? (
              <Button disabled variant="outline" size="sm" className="hidden sm:inline-flex">
                กำลังโหลด
              </Button>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="theme-surface-control rounded-full border p-1 transition-colors">
                    <Avatar name={session.user?.username || 'ผู้เล่น'} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-60 overflow-hidden rounded-[1.25rem] p-2"
                >
                  <DropdownMenuLabel className="px-3 py-3">
                    <p className="text-sm font-medium text-white">{session.user?.username}</p>
                    <p className="mt-1 text-xs font-normal text-slate-400">{session.user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">บัญชีผู้เล่น</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">ประวัติคำสั่งซื้อ</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings">ตั้งค่าบัญชี</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-200 hover:bg-rose-500/10 hover:text-white"
                    onSelect={() => signOut({ callbackUrl: '/' })}
                  >
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <GlassButton asChild variant="secondary" size="sm" className="px-4">
                  <TransitionLink href="/register">สมัครสมาชิก</TransitionLink>
                </GlassButton>
                <GlassButton asChild size="sm" className="px-5">
                  <TransitionLink href="/login">เข้าสู่ระบบ</TransitionLink>
                </GlassButton>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="theme-surface-control h-11 w-11 rounded-2xl border text-slate-300 hover:text-white lg:hidden"
              onClick={() => setIsOpen((open) => !open)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-2 border-t border-white/8 pb-5 pt-4 lg:hidden">
            {navLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="portal-panel-soft flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-200 transition-colors hover:border-white/14 hover:bg-white/[0.05]"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4 text-cyan-200" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Download link in mobile menu */}
            <Link
              href="/download"
              className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-emerald-300 transition-colors hover:border-emerald-400/35 hover:bg-emerald-400/12"
              onClick={() => setIsOpen(false)}
            >
              <Download className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-semibold">เล่นเลย — ดาวน์โหลด & เริ่มเล่น</span>
            </Link>

            {!session && (
              <div className="flex gap-3 pt-2">
                <GlassButton asChild variant="secondary" size="sm" fullWidth>
                  <TransitionLink href="/register">สมัครสมาชิก</TransitionLink>
                </GlassButton>
                <GlassButton asChild size="sm" fullWidth>
                  <TransitionLink href="/login">เข้าสู่ระบบ</TransitionLink>
                </GlassButton>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
