import { CommerceAvailability } from "@/components/store/commerce-availability";

export default function CheckoutCommerceLayout({ children }: { children: React.ReactNode }) {
  return <CommerceAvailability>{children}</CommerceAvailability>;
}
