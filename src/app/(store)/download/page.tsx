'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  HardDrive,
  Loader2,
  MemoryStick,
  Monitor,
  Rocket,
  Server,
  Zap,
} from 'lucide-react';
import { FadeInSection } from '@/components/shared/fade-in-section';
import { GlassButton } from '@/components/ui/glass-button';

/* ─── ตั้งค่าที่นี่ ───────────────────────────────────────── */
const SERVER_IP   = 'play.cobblemon-divided.com'; // ← เปลี่ยนเป็น IP/domain จริง
const GITHUB_REPO = 'kaktv2016/CobblemonDivided';
/* ──────────────────────────────────────────────────────────── */

const requirements = [
  { icon: Monitor,     label: 'Minecraft',        value: 'Java Edition 1.20.x' },
  { icon: MemoryStick, label: 'RAM',               value: 'อย่างน้อย 4 GB (แนะนำ 6–8 GB)' },
  { icon: HardDrive,   label: 'พื้นที่ว่าง',      value: 'อย่างน้อย 4 GB' },
  { icon: Monitor,     label: 'Java',              value: 'Java 21 (64-bit)' },
  { icon: Zap,         label: 'GPU',               value: 'รองรับ OpenGL 4.2+' },
  { icon: Server,      label: 'ระบบปฏิบัติการ',   value: 'Windows 10/11 · macOS 12+' },
];

const faqs = [
  {
    q: 'ต้องมีบัญชี Minecraft Java Edition ไหม?',
    a: 'ใช่ — Cobblemon เป็น Mod สำหรับ Minecraft Java Edition เท่านั้น ต้องซื้อเกมผ่าน minecraft.net ก่อน',
  },
  {
    q: 'ทำไมเกมแล็กหรือโหลดช้า?',
    a: 'ลองเพิ่ม RAM ที่จัดสรรให้ Minecraft เป็น 4–6 GB ใน Launcher → ไปที่ Settings → Java/Memory แล้วปรับค่า Max Memory',
  },
  {
    q: 'Launcher ของเซิร์ฟต่างจาก Launcher ทั่วไปยังไง?',
    a: 'Launcher ของ Cobblemon Divided ติดตั้ง Mod, Config และ Resource Pack ทั้งหมดให้อัตโนมัติ ไม่ต้องตั้งค่าเพิ่มเอง',
  },
  {
    q: 'เล่นบน Mac ได้ไหม?',
    a: 'ได้ — มี Launcher สำหรับ macOS (12 Monterey ขึ้นไป) ให้ดาวน์โหลดแยกด้านบน',
  },
];

export default function DownloadPage() {
  const [copiedIp, setCopiedIp] = useState(false);
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [version, setVersion]   = useState<string | null>(null);

  // ดึง version ล่าสุดจาก GitHub API เพื่อแสดงบนหน้า
  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => r.json())
      .then((d) => setVersion(d.tag_name ?? null))
      .catch(() => {/* silent */});
  }, []);

  const copyIp = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-[#020611]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-0 pt-24 sm:pt-32">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/12 blur-[96px]" />
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-cyan-500/8 blur-[72px]" />
          <div className="absolute right-1/4 top-32 h-48 w-48 rounded-full bg-violet-500/10 blur-[60px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeInSection delay={0}>
            <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-300/80">
              Cobblemon Divided // เริ่มเล่นได้เลย
            </p>
          </FadeInSection>

          <FadeInSection delay={150} duration={700} distance={24}>
            <h1 className="font-outfit mt-6 text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.04em] text-white">
              เล่น Cobblemon Divided
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                ใน 2 ขั้นตอน
              </span>
            </h1>
          </FadeInSection>

          <FadeInSection delay={300} duration={700}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              ติดตั้งทุกอย่างให้เสร็จภายใน 10 นาที
              แล้วเจอกันบนเซิร์ฟเวอร์ได้เลย
            </p>
          </FadeInSection>

          {/* Server IP Pill */}
          <FadeInSection delay={450}>
            <button
              onClick={copyIp}
              className="group mx-auto mt-10 flex max-w-sm items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 transition-all hover:border-cyan-400/30 hover:bg-white/[0.05]"
            >
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Server IP</p>
                <p className="mt-1 font-mono text-lg font-semibold text-white">{SERVER_IP}</p>
              </div>
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition-colors ${
                copiedIp
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-400'
                  : 'border-white/10 bg-white/[0.04] text-slate-400 group-hover:border-cyan-400/30 group-hover:text-cyan-300'
              }`}>
                {copiedIp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </div>
            </button>
            {copiedIp && (
              <p className="mt-2 text-center text-xs text-emerald-400">คัดลอก IP แล้ว!</p>
            )}
          </FadeInSection>
        </div>

        <div className="mt-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* ── 2 STEPS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">

          {/* ── Step 01: Java ── */}
          <FadeInSection delay={0} distance={30}>
            <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-cyan-400/5 p-7 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
              <div className="absolute right-6 top-2 font-outfit text-[5.5rem] font-bold leading-none tracking-[-0.06em] text-white/5">
                01
              </div>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-outfit text-2xl font-semibold text-white">ดาวน์โหลด Java</h3>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300/80">
                  Cobblemon ต้องการ <span className="font-semibold text-white">Java 21 (64-bit)</span> เพื่อรันเกม
                  ถ้ามีอยู่แล้วข้ามขั้นตอนนี้ได้เลย
                </p>

                <a
                  href="https://adoptium.net/temurin/releases/?version=21"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.09]"
                >
                  <Download className="h-4 w-4 text-cyan-300" />
                  ดาวน์โหลด Java 21
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                </a>

                {/* Badge info */}
                <p className="mt-5 text-xs text-slate-500">
                  ใช้ Eclipse Temurin — ฟรี, เสถียร, รองรับ Windows & macOS
                </p>
              </div>
            </div>
          </FadeInSection>

          {/* ── Step 02: Server Launcher ── */}
          <FadeInSection delay={120} distance={30}>
            <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-500/20 to-indigo-400/5 p-7 shadow-[0_0_32px_rgba(99,102,241,0.12)]">
              <div className="absolute right-6 top-2 font-outfit text-[5.5rem] font-bold leading-none tracking-[-0.06em] text-white/5">
                02
              </div>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-2xl font-semibold text-white">โหลด Launcher เซิร์ฟ</h3>
                    {/* Version badge — แสดง version ล่าสุดจาก GitHub อัตโนมัติ */}
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-indigo-300/25 bg-indigo-300/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-indigo-300">
                      {version ? (
                        version
                      ) : (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      )}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300/80">
                  Launcher ของ Cobblemon Divided จะติดตั้ง Mod, Config
                  และ Resource Pack ทุกอย่างให้อัตโนมัติ
                  ไม่ต้องตั้งค่าอะไรเพิ่ม — เปิดแล้วเล่นได้เลย
                </p>

                {/* Download button — ชี้ผ่าน API route ที่ดึง version ล่าสุดเสมอ */}
                <div className="mt-6">
                  <a
                    href="/api/download/launcher"
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500/25 active:scale-95"
                  >
                    <Download className="h-4 w-4 text-indigo-300" />
                    ดาวน์โหลด Launcher (Windows)
                  </a>
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  เปิด Launcher → ล็อกอินด้วยบัญชี Minecraft → กด Play — เจอกันบนเซิร์ฟ!
                </p>
              </div>
            </div>
          </FadeInSection>

        </div>
      </section>

      {/* ── REQUIREMENTS ─────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeInSection>
            <p className="text-[11px] uppercase tracking-[0.36em] text-slate-500">ความต้องการของระบบ</p>
            <h2 className="font-outfit mt-3 text-3xl font-semibold text-white">สเปคที่แนะนำ</h2>
          </FadeInSection>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requirements.map((req, i) => {
              const Icon = req.icon;
              return (
                <FadeInSection key={req.label} delay={i * 80} distance={20}>
                  <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                      <Icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{req.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-200">{req.value}</p>
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeInSection>
          <p className="text-[11px] uppercase tracking-[0.36em] text-slate-500">คำถามที่พบบ่อย</p>
          <h2 className="font-outfit mt-3 text-3xl font-semibold text-white">FAQ</h2>
        </FadeInSection>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, i) => (
            <FadeInSection key={i} delay={i * 80}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="group w-full rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-left transition-all hover:border-white/14 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <ChevronRight
                    className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-90' : ''
                    }`}
                  />
                </div>
                {openFaq === i && (
                  <p className="mt-4 text-sm leading-7 text-slate-400">{faq.a}</p>
                )}
              </button>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────── */}
      <section className="border-t border-white/8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <FadeInSection>
            <h2 className="font-outfit text-3xl font-semibold text-white sm:text-4xl">
              ติดตั้งแล้ว ไปเลือกของได้เลย
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              เลือก Rank, Crate Key, หรือของประจำซีซันที่ชอบ แล้วอัปเกรดตัวเองบนเซิร์ฟ
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <GlassButton asChild size="lg" className="px-8">
                <Link href="/store">
                  เข้าสู่ร้านค้า
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </GlassButton>
              <GlassButton asChild variant="secondary" size="lg" className="px-8">
                <Link href="/support">ติดต่อทีมงาน</Link>
              </GlassButton>
            </div>
          </FadeInSection>
        </div>
      </section>

    </div>
  );
}
