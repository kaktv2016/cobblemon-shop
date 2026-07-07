import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreProductTile } from "@/components/store/store-product-tile";
import { getPublicStoreOverviewData } from "@/lib/public-store-cache";
import { formatStorePrice, getCategoryTheme } from "@/lib/storefront";

export const metadata = {
  title: "ร้านค้า",
  description:
    "คลังปลดล็อกของ Cobblemon Divided ที่จัดวางแบบพอร์ทัลเกม ให้ผู้เล่นสำรวจหมวดต่าง ๆ ก่อนค่อยเลือกไอเทมที่เหมาะกับสไตล์การเล่นของตัวเอง",
};

export const revalidate = 60;

export default async function StorePage() {
  const { categories, featured } = await getPublicStoreOverviewData();
  const spotlight = featured[0] ?? null;
  const queue = spotlight ? featured.slice(1) : [];

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.14),transparent_22%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(2,6,17,0.18),rgba(2,6,17,0))]" />

      <div className="mx-auto max-w-7xl">
        <section className="portal-panel px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_26%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-300/80">
                ร้านค้าคัดสรร // Cobblemon Divided
              </p>
              <h1 className="font-outfit mt-5 text-4xl font-semibold leading-none text-white sm:text-5xl lg:text-6xl">
                คลังปลดล็อกที่เริ่มจากโลกของเซิร์ฟเวอร์ ก่อนเรื่องราคา
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300/80 sm:text-base">
                หน้านี้รวมของปลดล็อกทั้งหมดไว้ในรูปแบบที่คัดทางเดินให้ชัดขึ้น แต่ละหมวดจะมีอารมณ์และหน้าที่ของตัวเอง เพื่อให้ผู้เล่นเลือกสิ่งที่เข้ากับตัวตนของตัวเองได้ง่ายกว่าเดิม
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full border border-white/12 bg-white px-8 text-sm font-semibold text-slate-950 shadow-none hover:bg-slate-200"
                >
                  <Link href="#catalog">
                    เปิดดูหมวดที่คัดไว้
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Link
                  href="/support"
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
                >
                  อ่านข้อมูลการสั่งซื้อและการส่งของ
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {spotlight ? (
                <div className="portal-panel-soft p-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
                    ไฮไลต์ประจำรอบนี้
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{spotlight.category.name}</p>
                  <h2 className="font-outfit mt-3 text-3xl font-semibold text-white">
                    {spotlight.name}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-300/78">
                    {spotlight.shortDescription || "ของปลดล็อกเด่นที่ช่วยให้เส้นทางของผู้เล่นมีน้ำหนักและบุคลิกชัดขึ้นในซีซันนี้"}
                  </p>

                  <div className="mt-8 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                        ค่าปลดล็อก
                      </p>
                      <p className="font-outfit mt-2 text-4xl font-semibold text-white">
                        {formatStorePrice(spotlight.price)}
                      </p>
                    </div>

                    <Link
                      href={`/store/${spotlight.category.slug}/${spotlight.slug}`}
                      className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
                    >
                      ดูไอเทมนี้
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : null}

              {queue.length > 0 ? (
                <div className="portal-panel-soft p-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    คิวถัดไป
                  </p>
                  <div className="mt-4 border-t border-white/10">
                    {queue.map((product) => (
                      <Link
                        key={product.id}
                        href={`/store/${product.category.slug}/${product.slug}`}
                        className="group flex items-center justify-between gap-5 border-b border-white/10 py-4"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                            {product.category.name}
                          </p>
                          <p className="mt-2 font-outfit text-xl font-semibold text-white transition-colors group-hover:text-cyan-200">
                            {product.name}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-outfit text-xl font-semibold text-white">
                            {formatStorePrice(product.price)}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400 transition-colors group-hover:text-white">
                            สำรวจ
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="catalog" className="mt-20 space-y-16">
          {categories.map((category) => {
            const theme = getCategoryTheme(category.slug, category.name);

            return (
              <section
                key={category.id}
                className="grid gap-8 border-t border-white/8 pt-16 lg:grid-cols-[0.82fr_1.18fr]"
              >
                <div className="max-w-xl">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-300/78">
                    {theme.eyebrow}
                  </p>
                  <h2 className="font-outfit mt-4 text-3xl font-semibold text-white md:text-4xl">
                    {category.name}
                  </h2>
                  <p className="mt-5 text-sm leading-7 text-slate-300/78 sm:text-base">
                    {category.description || theme.description}
                  </p>

                  <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                    <span>{category._count.products} ไอเทมพร้อมปลดล็อก</span>
                    <span className="h-4 w-px bg-white/10" />
                    <span>คัดมาให้เห็นก่อน 3 ชิ้นเด่น</span>
                  </div>

                  <Link
                    href={`/store/${category.slug}`}
                    className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-slate-300 transition-colors hover:text-white"
                  >
                    เปิดดูทั้งหมวด
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {category.products.map((product) => (
                    <StoreProductTile
                      key={product.id}
                      href={`/store/${category.slug}/${product.slug}`}
                      name={product.name}
                      description={product.shortDescription}
                      price={product.price}
                      compareAtPrice={product.compareAtPrice}
                      productType={product.productType}
                      categorySlug={category.slug}
                      categoryName={category.name}
                      imageUrl={product.imageUrl}
                      bannerUrl={product.bannerUrl}
                      available={
                        product.stockLimit !== null ? product.stockLimit - product.stockSold : null
                      }
                      purchaseLimit={product.purchaseLimit}
                      cooldownMinutes={product.cooldownMinutes}
                      compact
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </section>
      </div>
    </div>
  );
}
