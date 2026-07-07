import { StoreNavbar } from "@/components/store/navbar";
import { StoreFooter } from "@/components/store/footer";
import { AmbientCursor } from "@/components/store/ambient-cursor";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreNavbar />
      <main className="portal-shell relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <AmbientCursor />
        <div className="relative z-[1]">{children}</div>
      </main>
      <StoreFooter />
    </>
  );
}
