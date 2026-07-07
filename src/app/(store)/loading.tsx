function LoadingLine({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-full bg-white/8 ${className ?? ""}`.trim()}
    />
  );
}

function LoadingPanel({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`portal-panel-soft animate-pulse bg-white/[0.02] ${className ?? ""}`.trim()}
    />
  );
}

export default function StoreLoading() {
  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(2,6,17,0.18),rgba(2,6,17,0))]" />

      <div className="mx-auto max-w-7xl space-y-16">
        <section className="portal-panel px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <LoadingLine className="h-3 w-40" />
              <LoadingLine className="h-16 w-full max-w-[34rem] rounded-[1.5rem]" />
              <LoadingLine className="h-6 w-full max-w-[28rem]" />
              <LoadingLine className="h-6 w-full max-w-[24rem]" />
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <LoadingLine className="h-12 w-44 rounded-full" />
                <LoadingLine className="h-12 w-56 rounded-full" />
              </div>
            </div>

            <div className="space-y-5">
              <LoadingPanel className="h-64" />
              <LoadingPanel className="h-44" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <LoadingLine className="h-3 w-28" />
              <LoadingLine className="h-11 w-80 rounded-[1rem]" />
            </div>
            <LoadingLine className="h-5 w-64 rounded-full" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingPanel key={index} className="h-80" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
