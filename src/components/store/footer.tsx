'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

const footerSections = [
  {
    title: 'โลกของเซิร์ฟ',
    links: [
      { label: 'หน้าแรก', href: '/' },
      { label: 'บรรยากาศของโลก', href: '/#world' },
      { label: 'ไฮไลต์ประจำซีซัน', href: '/#featured' },
    ],
  },
  {
    title: 'เส้นทางผู้เล่น',
    links: [
      { label: 'สำรวจร้านค้า', href: '/store' },
      { label: 'บัญชีผู้เล่น', href: '/account' },
      { label: 'ประวัติคำสั่งซื้อ', href: '/account/orders' },
    ],
  },
  {
    title: 'ช่วยเหลือ',
    links: [
      { label: 'ศูนย์ช่วยเหลือ', href: '/support' },
      { label: 'ข่าวสาร', href: '/news' },
      { label: 'รถเข็นของฉัน', href: '/cart' },
    ],
  },
  {
    title: 'นโยบาย',
    links: [
      { label: 'ข้อกำหนดการใช้งาน', href: '/legal/terms' },
      { label: 'นโยบายความเป็นส่วนตัว', href: '/legal/privacy' },
      { label: 'นโยบายการคืนสินค้า', href: '/legal/refunds' },
    ],
  },
];

export function StoreFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-[#030816]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.06),transparent_22%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-white/8 pb-12 lg:grid-cols-[1.25fr_repeat(4,0.75fr)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/52 via-cyan-400/24 to-transparent blur-md" />
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md">
                  <Image
                    src="/images/logo.png"
                    alt="Cobblemon Divided"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-white">Cobblemon Divided</h3>
                <p className="mt-1 text-[10px] tracking-[0.26em] text-slate-500">
                  PREMIUM COBBLEMON PORTAL
                </p>
              </div>
            </div>

            <p className="portal-copy mt-6 max-w-md text-sm leading-7">
              พอร์ทัลของเซิร์ฟเวอร์ที่ออกแบบให้ผู้เล่นสัมผัสตัวตนของโลกก่อน แล้วค่อยเลือกของปลดล็อกที่เหมาะกับเส้นทางของตัวเองอย่างมีจังหวะและมีสไตล์
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-cyan-200" />
                <a href="mailto:support@cobblemart.dev" className="transition-colors hover:text-white">
                  support@cobblemart.dev
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="h-4 w-4 text-cyan-200" />
                <span>พร้อมดูแลผู้เล่นจากทุกโซนเวลา</span>
              </div>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-lg font-semibold text-white">{section.title}</h4>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {currentYear} Cobblemon Divided. Minecraft และ Cobblemon เป็นทรัพย์สินของเจ้าของเครื่องหมายการค้าที่เกี่ยวข้อง
          </p>

          <div className="flex items-center gap-4">
            <a href="#" aria-label="Discord" className="transition-colors hover:text-white">
              Discord
            </a>
            <a href="#" aria-label="YouTube" className="transition-colors hover:text-white">
              YouTube
            </a>
            <a href="#" aria-label="TikTok" className="transition-colors hover:text-white">
              TikTok
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
