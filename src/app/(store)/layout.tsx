import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { AmbientCursor } from "@/components/store/ambient-cursor";
import { getStoreSettings } from "@/lib/store-settings";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getStoreSettings();
  return (
    <>
      <StoreNavbar shopName={settings.shopName} />
      <main className="portal-shell relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <AmbientCursor />
        <div className="relative z-[1]">{children}</div>
      </main>
      <StoreFooter shopName={settings.shopName} shopDescription={settings.shopDescription} />
    </>
  );
}
