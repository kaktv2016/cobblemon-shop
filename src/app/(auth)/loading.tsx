function AuthLoadingLine({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-full bg-white/10 ${className ?? ""}`.trim()}
    />
  );
}

export default function AuthLoading() {
  return (
    <div className="portal-shell relative min-h-screen overflow-hidden bg-[#070315]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.15),transparent_24%),linear-gradient(180deg,#090318_0%,#050813_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.06),transparent_16%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.06),transparent_18%)]" />

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(18,4,39,0.96)_0%,rgba(9,10,28,0.94)_100%)] shadow-[0_28px_120px_rgba(2,6,17,0.45)]">
          <div className="grid min-h-[min(52rem,calc(100svh-2.5rem))] lg:grid-cols-[1.08fr_0.92fr]">
            <section className="hidden bg-[radial-gradient(circle_at_16%_12%,rgba(125,211,252,0.14),transparent_22%),linear-gradient(180deg,rgba(17,5,37,0.9),rgba(8,10,26,0.86))] lg:block" />

            <section className="relative flex items-center bg-[linear-gradient(180deg,rgba(15,8,31,0.74),rgba(8,10,26,0.92))]">
              <div className="w-full p-6 sm:p-8 lg:p-12">
                <div className="mx-auto w-full max-w-md space-y-6">
                  <AuthLoadingLine className="h-3 w-28" />
                  <AuthLoadingLine className="h-14 w-56 rounded-[1rem]" />
                  <AuthLoadingLine className="h-5 w-full max-w-xs" />

                  <div className="space-y-4 pt-6">
                    <AuthLoadingLine className="h-14 w-full rounded-[1.25rem]" />
                    <AuthLoadingLine className="h-14 w-full rounded-[1.25rem]" />
                    <AuthLoadingLine className="h-14 w-full rounded-[1.25rem]" />
                  </div>

                  <div className="space-y-3 pt-4">
                    <AuthLoadingLine className="h-4 w-48" />
                    <AuthLoadingLine className="h-4 w-60" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
