import { CommerceAvailability } from "@/components/store/commerce-availability";

export default function StoreCommerceLayout({ children }: { children: React.ReactNode }) {
  return <CommerceAvailability>{children}</CommerceAvailability>;
}
