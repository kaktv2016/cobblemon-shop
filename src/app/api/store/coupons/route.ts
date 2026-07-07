import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/lib/services/coupon.service";
import { CartService } from "@/lib/services/cart.service";

/** POST /api/store/coupons/validate — Validate coupon code */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    // Get user's cart items for validation
    const cart = await CartService.getCart(session.user.id);

    if (cart.itemCount === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const cartItems = cart.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const result = await CouponService.validateCoupon(
      code,
      cartItems,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
