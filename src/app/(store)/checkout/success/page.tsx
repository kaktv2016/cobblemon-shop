import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Order Confirmed",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-32 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
      </div>

      <h1 className="font-outfit text-3xl font-bold text-white">
        Order Confirmed!
      </h1>

      <p className="mt-3 text-gray-400">
        Thank you for your purchase. Your items will be delivered to your
        Minecraft account shortly.
      </p>

      {order && (
        <Card className="mt-8 border-gray-800/50 bg-gray-900/30">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Order Number</p>
            <p className="mt-1 font-mono text-lg font-bold text-white">
              {order}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Package className="h-4 w-4 text-indigo-400" />
          Items will be delivered when you join the server
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          <Link href="/account/orders">
            View Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-gray-700">
          <Link href="/store">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
