import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PromptPayProvider } from '@/lib/payment/promptpay';
import QRCode from 'qrcode';

/**
 * GET /api/store/payment/promptpay/qr?order=<orderId>
 *
 * Returns a PNG image of the PromptPay EMV QR code for the given order.
 * Requires the requesting user to own the order (or be an admin).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get('order');
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order parameter' }, { status: 400 });
  }

  try {
    // Fetch the order — verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, total: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = session.user.roles?.includes('admin');
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Order is not awaiting payment' },
        { status: 409 }
      );
    }

    const amountInBaht = Number(order.total);

    // Generate EMV QR payload
    const provider = new PromptPayProvider();
    const payload = provider.generatePayload(amountInBaht);

    // Render to PNG buffer
    const pngBuffer = await QRCode.toBuffer(payload, {
      type: 'png',
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Cache for 5 minutes — the payload doesn't change unless the amount changes
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('PromptPay QR generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
