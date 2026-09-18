import Link from "next/link";
import { Wrench } from "lucide-react";
import { getStoreSettings } from "@/lib/store-settings";

export async function CommerceAvailability({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  if (!settings.maintenanceMode) return children;

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="max-w-xl rounded-3xl border border-amber-400/20 bg-amber-400/5 p-10 text-center">
        <Wrench className="mx-auto h-12 w-12 text-amber-300" />
        <h1 className="mt-5 text-3xl font-bold text-white">ร้านค้ากำลังปิดปรับปรุง</h1>
        <p className="mt-4 leading-7 text-slate-300">
          {settings.maintenanceMessage || "กรุณากลับมาใหม่ภายหลัง"}
        </p>
        <Link href="/" className="mt-7 inline-block rounded-xl bg-white px-5 py-3 font-medium text-slate-950">
          กลับหน้าแรก
        </Link>
      </div>
    </section>
  );
}
