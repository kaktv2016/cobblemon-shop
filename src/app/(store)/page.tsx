import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { FloatingParticles } from "@/components/store/floating-particles";
import { FadeInSection } from "@/components/shared/fade-in-section";
import { AnimatedText } from "@/components/shared/animated-text";
import { getPublicHomeData } from "@/lib/public-store-cache";
import {
  ArrowUpRight,
  ChevronRight,
  Crown,
  Download,
  Gem,
  Key,
  Package,
  Radar,
  Star,
  Sword,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Cobblemon Divided - ร้านค้าเซิร์ฟเวอร์ Cobblemon",
  description:
    "หน้าแรกของร้านค้า Cobblemon Divided สำหรับแรงก์ ไอเทมตกแต่ง กุญแจ กล่องรางวัล และของพิเศษประจำซีซัน",
};

export const revalidate = 60;

const categoryIcons: Record<string, any> = {
  ranks: Crown,
  cosmetics: Gem,
  "crate-keys": Key,
  currency: Star,
  "battle-pass": Sword,
  bundles: Package,
  perks: Zap,
};

const categoryLabels: Record<string, string> = {
  ranks: "แรงก์",
  cosmetics: "ไอเทมตกแต่ง",
  "crate-keys": "กุญแจลัง",
  currency: "เงินในเซิร์ฟเวอร์",
  "battle-pass": "แบตเทิลพาส",
  bundles: "บันเดิล",
  perks: "สิทธิพิเศษ",
};

const pillarContent = [
  {
    kicker: "ส่งของอัตโนมัติ",
    title: "ซื้อแล้วเตรียมส่งเข้าบัญชีผู้เล่นของคุณทันที",
    body: "เชื่อมต่อบัญชี Minecraft แล้วให้ระบบจัดคิวไอเทม รางวัล และสิทธิพิเศษแบบเป็นขั้นตอน ไม่ต้องคอยตามเอง",
  },
  {
    kicker: "บรรยากาศประจำซีซัน",
    title: "หน้าร้านควรให้ความรู้สึกเหมือนอีเวนต์ของเซิร์ฟเวอร์",
    body: "เราเน้นให้ผู้เล่นเห็นอารมณ์ของโลก Cobblemon Divided ก่อน แล้วค่อยพาไปยังแพ็กเกจที่เหมาะกับสายเล่นของตัวเอง",
  },
  {
    kicker: "เส้นทางชัดเจน",
    title: "คัดของเด่นขึ้นมาก่อน แล้วค่อยพาไปดูทั้งหมด",
    body: "ไม่เปิดมาด้วยกำแพงสินค้าทันที แต่ค่อย ๆ พาคุณเข้าสู่ร้านค้าแบบมีจังหวะและมีสไตล์มากกว่าเดิม",
  },
];

const systemNotes = [
  {
    label: "โทนร้านค้า",
    value: "ซีซันเปิดฉากแบบภาพยนตร์",
  },
  {
    label: "รูปแบบการเลือกซื้อ",
    value: "อินกับโลกก่อน ค่อยเลือกของ",
  },
  {
    label: "โฟกัสผู้เล่น",
    value: "แรงก์ ไอเทมตกแต่ง กุญแจ บันเดิล",
  },
];

const accentPlanes = [
  "from-indigo-500/30 via-indigo-400/8 to-transparent",
  "from-cyan-400/25 via-cyan-300/8 to-transparent",
  "from-amber-400/25 via-orange-300/8 to-transparent",
  "from-fuchsia-500/25 via-violet-400/8 to-transparent",
  "from-emerald-400/20 via-teal-300/8 to-transparent",
  "from-rose-500/20 via-orange-300/8 to-transparent",
];

function formatPrice(price: any): string {
  return `฿${Number(price).toLocaleString()}`;
}

function getCategoryLabel(slug: string, fallback: string) {
  return categoryLabels[slug] || fallback;
}

export default async function HomePage() {
  const { featured, categories } = await getPublicHomeData();

  const spotlight = featured[0] ?? null;
  const queue = spotlight ? featured.slice(1) : [];
  const visibleCategories = categories.slice(0, 6);
  const liveItemCount = categories.reduce(
    (sum, category) => sum + category._count.products,
    0
  );

  return (
    <div className="relative overflow-hidden bg-[#020611]">
      {/* ==================== HERO ==================== */}
      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          <Image
            src="/images/backgrounds/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Lighter overlays — let more of the hero image through */}
          <div className="animate-drift absolute inset-0 bg-[radial-gradient(circle_at_62%_24%,rgba(56,189,248,0.22),transparent_22%),radial-gradient(circle_at_78%_28%,rgba(129,140,248,0.24),transparent_24%),radial-gradient(circle_at_68%_55%,rgba(34,197,94,0.1),transparent_28%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020611]/90 via-[#020611]/70 to-[#020611]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020611] via-[#020611]/10 to-[#020611]/40" />
          <div className="hero-grid absolute inset-x-0 bottom-0 top-[12%] opacity-25" />
          <div className="scanline-overlay absolute inset-0 opacity-10" />
        </div>

        {/* Floating particles */}
        <FloatingParticles count={40} />

        {/* Hero content */}
        <div className="relative z-[3] mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-between px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <FadeInSection delay={100} duration={600} distance={20}>
              <p className="text-[11px] uppercase tracking-[0.4em] text-indigo-200/80">
                Cobblemon Divided // Cobblemon Server // Event Store
              </p>
            </FadeInSection>

            <FadeInSection delay={250} duration={600} distance={20}>
              <div className="portal-chip mt-6 gap-2 px-4 py-2 text-[10px] tracking-[0.22em] text-slate-200">
                <Radar className="h-3.5 w-3.5 text-cyan-300" />
                เส้นทางรางวัลประจำซีซันเปิดแล้ว
              </div>
            </FadeInSection>

            <AnimatedText
              as="h1"
              className="font-outfit mt-8 text-[clamp(3.9rem,9vw,7.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em] text-white text-glow"
              delay={400}
              duration={1000}
            >
              Cobblemon Divided
            </AnimatedText>

            <AnimatedText
              as="h2"
              className="font-outfit mt-6 max-w-2xl text-[clamp(2rem,4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white"
              delay={550}
              duration={900}
            >
              ก้าวเข้าสู่รอยแยก ก่อนของรางวัลจะหายไป
            </AnimatedText>

            <FadeInSection delay={700} duration={800}>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300/88 sm:text-lg">
                หน้าร้านของ Cobblemon Divided ถูกออกแบบให้รู้สึกเหมือนหน้าเปิดซีซันของเซิร์ฟเวอร์
                คุณจะได้สัมผัสโลก อารมณ์ และของเด่นก่อน แล้วค่อยเลือกซื้อไอเทมที่ใช่จริง ๆ
              </p>
            </FadeInSection>

            <FadeInSection delay={850} duration={800}>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
                <GlassButton
                  asChild
                  size="lg"
                  iconRight={<ChevronRight />}
                  className="px-8 text-[13px] font-semibold uppercase tracking-[0.16em]"
                >
                  <Link href="/store">เข้าสู่ร้านค้า</Link>
                </GlassButton>
                <GlassButton
                  asChild
                  variant="secondary"
                  size="lg"
                  className="px-8 text-[13px] uppercase tracking-[0.16em]"
                >
                  <Link
                    href={
                      spotlight
                        ? `/store/${spotlight.category.slug}/${spotlight.slug}`
                        : "/store"
                    }
                  >
                    ดูไฮไลต์ประจำซีซัน
                  </Link>
                </GlassButton>
              </div>
            </FadeInSection>
          </div>

          {/* Pillars — staggered */}
          <div className="mt-16 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-3">
            {pillarContent.map((pillar, i) => (
              <FadeInSection key={pillar.kicker} delay={200 + i * 150} distance={24}>
                <div className="max-w-sm">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
                    {pillar.kicker}
                  </p>
                  <h3 className="mt-3 font-outfit text-2xl font-semibold leading-tight text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{pillar.body}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WORLD SIGNAL ==================== */}
      <section id="world" className="border-y border-white/6 bg-black/20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <FadeInSection direction="left" distance={40}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-fuchsia-300/75">
                สัญญาณของโลก
              </p>
              <h3 className="font-outfit mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
                หน้าแรกควรให้ความรู้สึกเหมือนโปสเตอร์เปิดซีซันของเซิร์ฟเวอร์ ไม่ใช่ชั้นวางสินค้าแบบตรงเกินไป
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                ตอนนี้มีไอเทมพร้อมใช้งาน {liveItemCount} ชิ้น กระจายอยู่ใน {categories.length} หมวด
                แต่สิ่งแรกที่คุณควรเห็นคือบรรยากาศของโลก แรงดึงดูดของซีซัน และเส้นทางที่ตัวละครของคุณกำลังจะไป
              </p>
            </div>
          </FadeInSection>

          <FadeInSection direction="right" distance={40} delay={200}>
            <div className="grid gap-4 sm:grid-cols-3">
              {systemNotes.map((note, i) => (
                <FadeInSection key={note.label} delay={i * 120} distance={20}>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                      {note.label}
                    </p>
                    <p className="mt-3 font-outfit text-xl font-semibold text-white">
                      {note.value}
                    </p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ==================== DOWNLOAD STRIP ==================== */}
      <FadeInSection distance={30} duration={700}>
        <Link
          href="/download"
          className="group flex items-center justify-between gap-4 border-y border-emerald-400/14 bg-gradient-to-r from-emerald-400/6 via-emerald-400/4 to-transparent px-4 py-5 transition-colors hover:border-emerald-400/24 hover:from-emerald-400/10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10">
                <Download className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  ยังไม่ได้เล่นเซิร์ฟ?
                  <span className="ml-2 text-emerald-300">โหลด Launcher แล้วเล่นได้เลย →</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Java 21 · Launcher เซิร์ฟ — ติดตั้งเสร็จใน 2 ขั้นตอน
                </p>
              </div>
            </div>
            <span className="hidden flex-shrink-0 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors group-hover:bg-emerald-400/18 sm:block">
              เล่นเลย
            </span>
          </div>
        </Link>
      </FadeInSection>

      {/* ==================== SPOTLIGHT ==================== */}
      {spotlight && (
        <FadeInSection as="section" distance={50} duration={900}>
          <section id="featured" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div data-spotlight="" className="portal-panel spotlight-surface p-8 sm:p-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.16),transparent_26%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                <div className="relative">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
                    ของเด่นประจำซีซัน
                  </p>
                  <h3 className="font-outfit mt-4 text-4xl font-semibold leading-none text-white md:text-5xl">
                    {spotlight.name}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    นี่คือไฮไลต์จากหมวด {getCategoryLabel(spotlight.category.slug, spotlight.category.name)}
                    สำหรับผู้เล่นที่ต้องการอัปเกรดตัวเองให้ดูโดดเด่นขึ้นในโลกของ Cobblemon Divided
                  </p>

                  <div className="mt-10 flex flex-wrap items-end gap-6">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                        ราคา ณ ตอนนี้
                      </p>
                      <p className="font-outfit mt-2 text-4xl font-semibold text-white">
                        {formatPrice(spotlight.price)}
                      </p>
                    </div>
                    {spotlight.compareAtPrice && (
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                          ราคาเดิม
                        </p>
                        <p className="mt-2 text-lg text-slate-500 line-through">
                          {formatPrice(spotlight.compareAtPrice)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                    <Button
                      asChild
                      className="h-11 border border-white/12 bg-white px-6 text-slate-950 shadow-[0_12px_34px_rgba(255,255,255,0.08)] hover:bg-slate-200"
                    >
                      <Link href={`/store/${spotlight.category.slug}/${spotlight.slug}`}>
                        เปิดดูสินค้า
                      </Link>
                    </Button>
                    <Link
                      href={`/store/${spotlight.category.slug}`}
                      className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-slate-300 transition-colors hover:text-white"
                    >
                      ไปยังหมวด {getCategoryLabel(spotlight.category.slug, spotlight.category.name)}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <FadeInSection delay={200} direction="right" distance={30}>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.32em] text-indigo-300/80">
                      ถัดจากนี้
                    </p>
                    <h3 className="font-outfit mt-4 text-3xl font-semibold text-white">
                      ของเด่นต้องชัด ของรองต้องพาไปต่อ
                    </h3>
                    <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
                      เราเน้นให้หน้าแรกมีของเด่นเพียงชิ้นเดียวเป็นตัวนำสายตา แล้วใช้แถวถัดไปเป็นตัวพาคุณดำดิ่งเข้าสู่ร้านค้าทั้งหมด
                    </p>
                  </div>
                </FadeInSection>

                <div className="mt-8 border-t border-white/10">
                  {queue.map((product, i) => (
                    <FadeInSection key={product.id} delay={300 + i * 120} distance={20}>
                      <Link
                        href={`/store/${product.category.slug}/${product.slug}`}
                        data-spotlight=""
                        className="spotlight-surface group relative flex items-center justify-between gap-6 overflow-hidden rounded-[1.35rem] border-b border-white/10 py-5"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
                            {getCategoryLabel(product.category.slug, product.category.name)}
                          </p>
                          <h4 className="font-outfit mt-2 text-2xl font-semibold text-white transition-colors group-hover:text-cyan-300">
                            {product.name}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="font-outfit text-xl font-semibold text-white">
                            {formatPrice(product.price)}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400 transition-colors group-hover:text-white">
                            ดูรายละเอียด
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </FadeInSection>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>
      )}

      {/* ==================== CATEGORIES ==================== */}
      {visibleCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <FadeInSection distance={30}>
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-amber-300/80">
                  เส้นทางรางวัล
                </p>
                <h3 className="font-outfit mt-4 text-3xl font-semibold text-white md:text-4xl">
                  เลือกทางที่เหมาะกับสไตล์การเล่นของคุณ
                </h3>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                แต่ละหมวดถูกจัดให้มีบุคลิกของตัวเอง ไม่ใช่แค่แยกประเภทสินค้าเฉย ๆ แต่เป็นเส้นทางของผู้เล่นแต่ละสาย
              </p>
            </div>
          </FadeInSection>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleCategories.map((category, index) => {
              const Icon = categoryIcons[category.slug] || Package;
              const accent = accentPlanes[index % accentPlanes.length];

              return (
                <FadeInSection key={category.id} delay={index * 100} distance={30}>
                  <Link
                    href={`/store/${category.slug}`}
                    data-spotlight=""
                    className="portal-panel-soft spotlight-surface group relative block px-7 py-8 transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(99,102,241,0.12)]"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="absolute right-5 top-3 font-outfit text-[5rem] font-bold leading-none tracking-[-0.08em] text-white/5 transition-colors duration-300 group-hover:text-white/8">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div className="absolute left-7 top-0 h-px w-24 bg-white/15 transition-all duration-500 group-hover:w-36 group-hover:bg-white/30" />

                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:shadow-[0_0_24px_rgba(56,189,248,0.12)]">
                        <Icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h4 className="font-outfit mt-12 text-3xl font-semibold text-white">
                        {getCategoryLabel(category.slug, category.name)}
                      </h4>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300/75">
                        ตอนนี้มีไอเทมพร้อมใช้งาน {category._count.products} ชิ้นในเส้นทางนี้
                      </p>
                      <span className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/75 transition-all duration-300 group-hover:gap-3 group-hover:text-white">
                        เปิดดูหมวดนี้
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </Link>
                </FadeInSection>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================== CTA BANNER ==================== */}
      <FadeInSection distance={40} duration={900}>
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div data-spotlight="" className="portal-panel spotlight-surface mx-auto max-w-7xl">
            <div className="absolute inset-0">
              <Image
                src="/images/backgrounds/hero.png"
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-[center_42%]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#020611]/94 via-[#020611]/72 to-[#020611]/35" />
              <div className="scanline-overlay absolute inset-0 opacity-10" />
            </div>

            <div className="relative px-8 py-14 sm:px-12 sm:py-16 lg:max-w-3xl lg:px-16 lg:py-20">
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
                พร้อมลุยต่อ
              </p>
              <h3 className="font-outfit mt-4 text-4xl font-semibold leading-none text-white sm:text-5xl">
                เข้ามาเพื่อสัมผัสบรรยากาศ แล้วค่อยเลือกของที่ใช่สำหรับตัวคุณ
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300/82 sm:text-base">
                เมื่อคุณเห็นอารมณ์ของโลก Cobblemon Divided ชัดพอแล้ว การเลือกแรงก์ กุญแจ หรือแพ็กเกจก็จะรู้สึกมีความหมายขึ้นทันที
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 border border-cyan-300/18 bg-gradient-to-r from-cyan-300 to-indigo-400 px-8 text-[13px] font-semibold tracking-[0.16em] text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.18)]"
                >
                  <Link href="/store">
                    ดูสินค้าทั้งหมด
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-white/14 bg-black/20 px-8 text-[13px] tracking-[0.16em] text-white backdrop-blur-md hover:border-white/22 hover:bg-white/10"
                >
                  <Link href="/support">เปิดศูนย์ช่วยเหลือ</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}
