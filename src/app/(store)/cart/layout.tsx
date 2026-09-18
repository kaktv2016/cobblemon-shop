import { CommerceAvailability } from "@/components/store/commerce-availability";

export default function CartCommerceLayout({ children }: { children: React.ReactNode }) {
  return <CommerceAvailability>{children}</CommerceAvailability>;
}
