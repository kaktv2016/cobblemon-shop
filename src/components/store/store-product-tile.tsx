import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  formatStorePrice,
  getAvailabilityCopy,
  getCategoryTheme,
  getProductTypeLabel,
  type StorePriceValue,
} from "@/lib/storefront";
import { cn } from "@/lib/utils";

interface StoreProductTileProps {
  href: string;
  name: string;
  description?: string | null;
  price: StorePriceValue;
  compareAtPrice?: StorePriceValue;
  productType?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  available?: number | null;
  purchaseLimit?: number | null;
  cooldownMinutes?: number | null;
  compact?: boolean;
  className?: string;
}

export function StoreProductTile({
  href,
  name,
  description,
  price,
  compareAtPrice,
  productType,
  categorySlug,
  categoryName,
  imageUrl,
  bannerUrl,
  available,
  purchaseLimit,
  cooldownMinutes,
  compact = false,
  className,
}: StoreProductTileProps) {
  const theme = getCategoryTheme(categorySlug, categoryName);
  const artworkUrl = bannerUrl || imageUrl || null;
  const typeLabel = getProductTypeLabel(productType);
  const comparePrice =
    compareAtPrice !== null && compareAtPrice !== undefined
      ? formatStorePrice(compareAtPrice)
      : null;

  return (
    <Link href={href} className={className}>
      <article
        data-spotlight=""
        className={cn(
          "portal-panel-soft spotlight-surface group relative h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-white/18 hover:shadow-[0_30px_84px_rgba(2,6,17,0.34)]",
          compact ? "min-h-[22.5rem]" : "min-h-[26rem]"
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.88]", theme.accent)} />
        <div className={cn("absolute inset-0 opacity-90", theme.glow)} />

        <div className="relative flex h-full flex-col">
          <div className={cn("relative overflow-hidden", compact ? "aspect-[16/10]" : "aspect-[5/4]")}>
            {artworkUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.04]"
                style={{ backgroundImage: `url("${artworkUrl}")` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%),linear-gradient(180deg,rgba(8,14,33,0.96),rgba(5,10,24,0.98))]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-16 w-16 text-white/18" />
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-[#060b19]/56 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020611]/74 via-[#020611]/22 to-transparent" />

            <div className="portal-chip absolute left-5 top-5 px-3 py-1 text-[10px] tracking-[0.18em] text-slate-100/82">
              {theme.label}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-cyan-100/78">{typeLabel}</p>
                <p className="mt-2 max-w-[17rem] text-sm leading-6 text-slate-200/74">
                  {getAvailabilityCopy({ available, purchaseLimit, cooldownMinutes })}
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-white/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </div>
          </div>

          <div className={cn("flex flex-1 flex-col", compact ? "p-5" : "p-6")}>
            <p className="portal-kicker">{theme.eyebrow}</p>
            <h3
              className={cn(
                "portal-heading mt-3 leading-[1.02]",
                compact ? "text-[1.8rem]" : "text-[2rem]"
              )}
            >
              {name}
            </h3>
            <p className="portal-copy mt-3 line-clamp-3 text-sm leading-7">
              {description || theme.description}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <div>
                <p className="portal-kicker">
                  {comparePrice ? "ค่าปลดล็อกตอนนี้" : "ค่าปลดล็อก"}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <span
                    className={cn(
                      "font-display font-semibold tracking-[-0.03em] text-white",
                      compact ? "text-[1.8rem]" : "text-[2.1rem]"
                    )}
                  >
                    {formatStorePrice(price)}
                  </span>
                  {comparePrice ? (
                    <span className="pb-1 text-sm text-slate-500/90 line-through">
                      {comparePrice}
                    </span>
                  ) : null}
                </div>
              </div>

              <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/74 transition-colors group-hover:text-white">
                รายละเอียด
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
