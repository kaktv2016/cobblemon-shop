import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { StoreProductTile } from "@/components/store/store-product-tile";
import { getPublicCategoryPageData } from "@/lib/public-store-cache";
import { getCategoryTheme } from "@/lib/storefront";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = await getPublicCategoryPageData(category);
  const foundCategory = data?.category;

  if (!foundCategory) {
    return { title: "ไม่พบหมวดหมู่" };
  }

  return {
    title: foundCategory.name,
    description:
      foundCategory.description ||
      `สำรวจหมวด ${foundCategory.name} ของ Cobblemon Divided ในบรรยากาศแบบพอร์ทัลเกมที่คัดจังหวะการเลือกไอเทมให้ชัดขึ้น`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const data = await getPublicCategoryPageData(category);

  if (!data) {
    notFound();
  }
  const { category: foundCategory, products } = data;

  const theme = getCategoryTheme(foundCategory.slug, foundCategory.name);

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(2,6,17,0.18),rgba(2,6,17,0))]" />

      <div className="mx-auto max-w-7xl">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/store" className="transition-colors hover:text-white">
            ร้านค้า
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-300">{foundCategory.name}</span>
        </nav>

        <section className="portal-panel px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: foundCategory.imageUrl
                ? `url("${foundCategory.imageUrl}")`
                : undefined,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_26%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b19] via-[#060b19]/92 to-[#060b19]/68" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับไปยังคลังหลัก
              </Link>

              <p className="mt-8 text-[11px] uppercase tracking-[0.32em] text-cyan-300/80">
                {theme.eyebrow}
              </p>
              <h1 className="font-outfit mt-4 text-4xl font-semibold leading-none text-white sm:text-5xl lg:text-6xl">
                {foundCategory.name}
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300/78 sm:text-base">
                {foundCategory.description || theme.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="portal-panel-soft [--portal-panel-radius:1.5rem] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  จำนวนไอเทม
                </p>
                <p className="font-outfit mt-4 text-4xl font-semibold text-white">
                  {products.length}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  หน้านี้รวมรายการทั้งหมดของหมวดนี้ไว้ในจังหวะการนำเสนอที่โปร่งขึ้นและอ่านง่ายขึ้น
                </p>
              </div>

              <div className="portal-panel-soft [--portal-panel-radius:1.5rem] p-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  อารมณ์ของหมวด
                </p>
                <p className="font-outfit mt-4 text-2xl font-semibold text-white">
                  {theme.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  เน้นให้เห็นบทบาทของไอเทมในโลกเกมก่อน แล้วค่อยปล่อยให้การตัดสินใจซื้อเป็นเรื่องรองลงมาตามธรรมชาติ
                </p>
              </div>
            </div>
          </div>
        </section>

        {products.length === 0 ? (
          <div className="portal-panel-soft mt-16 px-8 py-16 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-slate-500" />
            <p className="mt-5 text-sm leading-7 text-slate-400">
              หมวดนี้ยังไม่มีไอเทมพร้อมปลดล็อกในตอนนี้ ลองกลับไปสำรวจหมวดอื่นก่อน แล้วค่อยกลับมาอีกครั้งเมื่อมีการอัปเดตรอบใหม่
            </p>
          </div>
        ) : (
          <section className="mt-16">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/78">
                  คัดสรรมาให้
                </p>
                <h2 className="font-outfit mt-4 text-3xl font-semibold text-white">
                  รายการทั้งหมดในหมวดนี้
                </h2>
              </div>

              <Link
                href="/store"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
              >
                สำรวจหมวดอื่นต่อ
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <StoreProductTile
                  key={product.id}
                  href={`/store/${foundCategory.slug}/${product.slug}`}
                  name={product.name}
                  description={product.shortDescription}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  productType={product.productType}
                  categorySlug={foundCategory.slug}
                  categoryName={foundCategory.name}
                  imageUrl={product.imageUrl}
                  bannerUrl={product.bannerUrl}
                  available={
                    product.stockLimit !== null ? product.stockLimit - product.stockSold : null
                  }
                  purchaseLimit={product.purchaseLimit}
                  cooldownMinutes={product.cooldownMinutes}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
