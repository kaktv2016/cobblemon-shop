import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronRight, Clock3, Link2, Shield, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";
import { StoreProductTile } from "@/components/store/store-product-tile";
import { getPublicProductPageData } from "@/lib/public-store-cache";
import {
  formatStoreDate,
  formatStorePrice,
  getAvailabilityCopy,
  getCategoryTheme,
  getProductTypeLabel,
} from "@/lib/storefront";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicProductPageData(slug);
  const product = data?.product;

  if (!product) {
    return { title: "ไม่พบสินค้า" };
  }

  return {
    title: product.name,
    description:
      product.shortDescription ||
      "รายละเอียดของไอเทมใน Cobblemon Divided พร้อมข้อมูลการปลดล็อกและการส่งของอัตโนมัติ",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;

  const data = await getPublicProductPageData(slug);

  if (!data) {
    notFound();
  }
  const { product, relatedProducts } = data;

  const theme = getCategoryTheme(product.category.slug, product.category.name);
  const available = product.stockLimit !== null ? product.stockLimit - product.stockSold : null;
  const artworkUrl = product.bannerUrl || product.imageUrl || null;
  const availabilityCopy = getAvailabilityCopy({
    available,
    purchaseLimit: product.purchaseLimit,
    cooldownMinutes: product.cooldownMinutes,
  });
  const detailParagraphs =
    product.fullDescription
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(2,6,17,0.18),rgba(2,6,17,0))]" />

      <div className="mx-auto max-w-7xl">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/store" className="transition-colors hover:text-white">
            ร้านค้า
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/store/${product.category.slug}`} className="transition-colors hover:text-white">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-300">{product.name}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="portal-panel">
            {artworkUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${artworkUrl}")` }}
              />
            ) : null}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060b19] via-[#060b19]/88 to-[#060b19]/56" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b19] via-[#060b19]/18 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

            <div className="relative flex min-h-[33rem] flex-col justify-between px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/store/${product.category.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-200/82 backdrop-blur-md transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  กลับไปที่ {product.category.name}
                </Link>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/82 backdrop-blur-md">
                  {theme.eyebrow}
                </div>
              </div>

              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
                  {getProductTypeLabel(product.productType)}
                </p>
                <h1 className="font-outfit mt-4 text-4xl font-semibold leading-none text-white sm:text-5xl lg:text-6xl">
                  {product.name}
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base">
                  {product.shortDescription || theme.description}
                </p>

                {product.tags.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.tags.map((entry) => (
                      <span
                        key={entry.tag}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300"
                      >
                        {entry.tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="portal-panel-soft p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                ปลดล็อกชิ้นนี้
              </p>

              <div className="mt-5 flex items-end gap-3">
                <p className="font-outfit text-4xl font-semibold text-white">
                  {formatStorePrice(product.price)}
                </p>
                {product.compareAtPrice ? (
                  <div className="pb-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ราคามาตรฐาน</p>
                    <p className="mt-1 text-sm text-slate-500 line-through">
                      {formatStorePrice(product.compareAtPrice)}
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300/78">{availabilityCopy}</p>

              <div className="portal-panel-soft mt-6 [--portal-panel-radius:1.5rem] p-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-4 w-4 text-cyan-200" />
                  <div>
                    <p className="font-medium text-white">เชื่อมกับบัญชีผู้เล่นโดยตรง</p>
                    <p className="mt-1 text-slate-400">
                      สิทธิ์และไอเทมจะถูกส่งเข้าสู่บัญชี Minecraft ที่เชื่อมไว้ทันทีหลังคำสั่งซื้อสำเร็จ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-cyan-200" />
                  <div>
                    <p className="font-medium text-white">กระบวนการสั่งซื้อแบบนุ่มนวลขึ้น</p>
                    <p className="mt-1 text-slate-400">
                      หน้านี้ลดการเร่งขายตรงลง และแยกข้อมูลสำคัญออกจากภาษาส่วนลดที่ไม่จำเป็น
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <AddToCartButton
                  productId={product.id}
                  available={available}
                  productName={product.name}
                />
              </div>
            </div>

            <div className="portal-panel-soft p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                ภาพรวมการปลดล็อก
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-6">
                  <span className="text-sm text-slate-400">หมวดหมู่</span>
                  <span className="text-right text-sm text-white">{product.category.name}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-sm text-slate-400">ประเภท</span>
                  <span className="text-right text-sm text-white">
                    {getProductTypeLabel(product.productType)}
                  </span>
                </div>
                {product.purchaseLimit ? (
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm text-slate-400">ลิมิตต่อผู้เล่น</span>
                    <span className="text-right text-sm text-white">
                      {product.purchaseLimit} ชิ้น
                    </span>
                  </div>
                ) : null}
                {product.cooldownMinutes ? (
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm text-slate-400">คูลดาวน์การซื้อ</span>
                    <span className="text-right text-sm text-white">
                      {product.cooldownMinutes} นาที
                    </span>
                  </div>
                ) : null}
                {product.endDate ? (
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm text-slate-400">เปิดถึง</span>
                    <span className="text-right text-sm text-white">
                      {formatStoreDate(product.endDate)}
                    </span>
                  </div>
                ) : null}
                {typeof available === "number" ? (
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm text-slate-400">สถานะรอบนี้</span>
                    <span className="text-right text-sm text-white">
                      {available > 0 ? `เหลืออีก ${available} ชิ้น` : "จองครบแล้ว"}
                    </span>
                  </div>
                ) : null}
              </div>

              {product.endDate ? (
                <div className="mt-6 flex items-center gap-3 rounded-[1.25rem] border border-amber-400/15 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
                  <Clock3 className="h-4 w-4" />
                  รอบปลดล็อกนี้จะเปิดถึงวันที่ {formatStoreDate(product.endDate)}
                </div>
              ) : null}
            </div>
          </aside>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="portal-panel-soft p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/78">
              รายละเอียดของไอเทม
            </p>
            <h2 className="font-outfit mt-4 text-3xl font-semibold text-white">
              สิ่งที่ชิ้นนี้เพิ่มให้กับประสบการณ์ของผู้เล่น
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-300/80 sm:text-base">
              {detailParagraphs.length > 0 ? (
                detailParagraphs.map((paragraph, index) => (
                  <p key={`${product.id}-paragraph-${index}`}>{paragraph.replace(/\*\*/g, "")}</p>
                ))
              ) : (
                <p>
                  ไอเทมนี้ถูกวางไว้ให้เป็นส่วนหนึ่งของโลก Cobblemon Divided โดยเน้นความชัดเจนของบทบาทและความรู้สึกของการปลดล็อก มากกว่าการผลักให้รีบซื้อจากข้อความโปรโมชั่น
                </p>
              )}
            </div>
          </div>

          <div className="portal-panel-soft p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
              บันทึกประกอบ
            </p>
            <div className="mt-6 space-y-5">
              <div className="portal-panel-soft [--portal-panel-radius:1.25rem] p-4">
                <p className="text-sm font-medium text-white">เหตุผลที่ชิ้นนี้อยู่ในหมวด {product.category.name}</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  เราจัดวางให้ไอเทมนี้อยู่ในเส้นทาง {theme.label} เพื่อให้ผู้เล่นอ่านความตั้งใจของมันได้จากบริบทของหมวด ไม่ใช่จากป้ายลดราคาเพียงอย่างเดียว
                </p>
              </div>

              <div className="portal-panel-soft [--portal-panel-radius:1.25rem] p-4">
                <p className="text-sm font-medium text-white">การส่งของหลังสั่งซื้อ</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  เมื่อการชำระเงินเสร็จสิ้น ระบบจะจัดคิวส่งสิทธิ์หรือไอเทมให้อัตโนมัติ และคุณสามารถติดตามผลได้จากหน้าบัญชีผู้เล่น
                </p>
              </div>
            </div>
          </div>
        </section>

        {product.bundleItems.length > 0 ? (
          <section className="mt-16">
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/78">
                รายการในบันเดิล
              </p>
              <h2 className="font-outfit mt-4 text-3xl font-semibold text-white">
                รายการที่รวมอยู่ในชุดนี้
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {product.bundleItems.map((bundleItem) => (
                <StoreProductTile
                  key={bundleItem.id}
                  href={`/store/${bundleItem.item.category?.slug}/${bundleItem.item.slug}`}
                  name={bundleItem.item.name}
                  description={
                    bundleItem.quantity > 1
                      ? `${bundleItem.item.shortDescription || "ไอเทมในชุดนี้"} จำนวน ${bundleItem.quantity} ชิ้น`
                      : bundleItem.item.shortDescription
                  }
                  price={bundleItem.item.price}
                  productType={bundleItem.item.productType}
                  categorySlug={bundleItem.item.category?.slug}
                  categoryName={bundleItem.item.category?.name}
                  imageUrl={bundleItem.item.imageUrl}
                  bannerUrl={bundleItem.item.bannerUrl}
                  available={
                    bundleItem.item.stockLimit !== null
                      ? bundleItem.item.stockLimit - bundleItem.item.stockSold
                      : null
                  }
                  purchaseLimit={bundleItem.item.purchaseLimit}
                  cooldownMinutes={bundleItem.item.cooldownMinutes}
                  compact
                />
              ))}
            </div>
          </section>
        ) : null}

        {relatedProducts.length > 0 ? (
          <section className="mt-16">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/78">
                  อยู่ในเส้นทางเดียวกัน
                </p>
                <h2 className="font-outfit mt-4 text-3xl font-semibold text-white">
                  ไอเทมอื่นที่เข้ากับหมวดนี้
                </h2>
              </div>

              <Link
                href={`/store/${product.category.slug}`}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
              >
                ดูทั้งหมวด
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <StoreProductTile
                  key={relatedProduct.id}
                  href={`/store/${relatedProduct.category.slug}/${relatedProduct.slug}`}
                  name={relatedProduct.name}
                  description={relatedProduct.shortDescription}
                  price={relatedProduct.price}
                  compareAtPrice={relatedProduct.compareAtPrice}
                  productType={relatedProduct.productType}
                  categorySlug={relatedProduct.category.slug}
                  categoryName={relatedProduct.category.name}
                  imageUrl={relatedProduct.imageUrl}
                  bannerUrl={relatedProduct.bannerUrl}
                  available={
                    relatedProduct.stockLimit !== null
                      ? relatedProduct.stockLimit - relatedProduct.stockSold
                      : null
                  }
                  purchaseLimit={relatedProduct.purchaseLimit}
                  cooldownMinutes={relatedProduct.cooldownMinutes}
                  compact
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
