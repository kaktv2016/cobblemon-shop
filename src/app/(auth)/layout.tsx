import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { AmbientCursor } from "@/components/store/ambient-cursor";
import { TransitionLink } from "@/components/shared/transition-link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="portal-shell relative min-h-screen overflow-hidden bg-[#070315]">
      <AmbientCursor />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.15),transparent_24%),linear-gradient(180deg,#090318_0%,#050813_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.06),transparent_16%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.06),transparent_18%)]" />

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(18,4,39,0.96)_0%,rgba(9,10,28,0.94)_100%)] shadow-[0_28px_120px_rgba(2,6,17,0.45)]">
          <div className="grid min-h-[min(56rem,calc(100svh-2rem))] lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative hidden overflow-hidden border-r border-white/8 lg:block">
              <Image
                src="/images/backgrounds/login.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover object-left-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#10031d]/12 via-transparent to-[#10031d]/18" />
            </section>

            <section className="relative flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(15,8,31,0.74),rgba(8,10,26,0.92))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.07),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.08),transparent_20%)]" />
              <div className="absolute inset-0 opacity-[0.12] lg:hidden">
                <Image
                  src="/images/backgrounds/login.png"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover object-left-top"
                />
              </div>

              <div className="relative flex min-h-0 w-full flex-1 flex-col p-6 sm:p-8 lg:p-12">
                <div className="mb-8 hidden items-center justify-end lg:flex">
                  <TransitionLink
                    href="/"
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-300/74 transition-colors hover:text-white"
                  >
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                    หน้าแรก
                  </TransitionLink>
                </div>

                <div className="mb-8 flex items-center justify-between lg:hidden">
                  <TransitionLink href="/" className="group inline-flex items-center gap-3">
                    <span className="relative h-11 w-11 overflow-hidden rounded-2xl border border-cyan-300/18 bg-white/[0.04]">
                      <Image
                        src="/images/logo.png"
                        alt="Cobblemon Divided"
                        width={44}
                        height={44}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </span>
                    <span className="font-display text-lg font-semibold tracking-[-0.03em] text-white">
                      Cobblemon Divided
                    </span>
                  </TransitionLink>

                  <TransitionLink
                    href="/"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300/74 transition-colors hover:text-white"
                  >
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                    หน้าแรก
                  </TransitionLink>
                </div>

                <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
                  {children}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
