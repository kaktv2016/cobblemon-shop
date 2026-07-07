import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/orders/[id]/confirm-payment
 *
 * Admin manually confirms a PromptPay (or any manual) payment.
 * Transitions the order from PENDING_PAYMENT → PAID and
 * updates the corresponding PaymentTransaction to COMPLETED.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const isAdmin = session.user.roles?.includes('admin');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id: orderId } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: `ไม่สามารถยืนยันได้ — สถานะคำสั่งซื้อคือ "${order.status}"` },
        { status: 409 }
      );
    }

    // Transition order + payment transaction atomically
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      // Update latest payment transaction to COMPLETED
      if (order.payments[0]) {
        await tx.paymentTransaction.update({
          where: { id: order.payments[0].id },
          data: { status: 'COMPLETED' },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'CONFIRM_PAYMENT',
          target: 'ORDER',
          targetId: orderId,
          details: {
            orderNumber: order.orderNumber,
            confirmedBy: session.user.username,
            confirmedAt: new Date().toISOString(),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'ยืนยันการชำระเงินสำเร็จ',
      orderId,
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: error.message || 'ไม่สามารถยืนยันการชำระเงินได้' },
      { status: 500 }
    );
  }
}
