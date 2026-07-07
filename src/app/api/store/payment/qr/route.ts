import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/store/payment/qr?order=<orderId>
 *
 * Universal QR code endpoint — returns a PNG image for any provider:
 *
 *  omise      → proxies QR image from Omise CDN (requires Omise auth)
 *               Falls back to re-fetching charge/source if rawResponse is empty.
 *  xendit     → renders qr_string (raw EMV) to PNG with qrcode package
 *  gbprimepay → decodes base64 qrImage from rawResponse to PNG
 *  promptpay  → generates EMV payload on-the-fly and renders to PNG
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      total: true,
      status: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          provider: true,
          rawResponse: true,
          providerTransactionId: true,   // needed for Omise fallback re-fetch
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const isAdmin = session.user.roles?.includes('admin');
  if (order.userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return NextResponse.json({ error: 'Order is not awaiting payment' }, { status: 409 });
  }

  const payment = order.payments[0];
  const provider = payment?.provider ?? 'promptpay';
  const raw = payment?.rawResponse as Record<string, string> | null;

  const QRCode = await import('qrcode');

  const renderEMV = async (emvString: string) => {
    const buffer = await QRCode.toBuffer(emvString, {
      type: 'png',
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300' },
    });
  };

  /* ── Omise — proxy the QR image from Omise's CDN with auth ──────── */
  if (provider === 'omise') {
    const secretKey = process.env.OMISE_SECRET_KEY || '';
    if (!secretKey) {
      return NextResponse.json({ error: 'OMISE_SECRET_KEY not configured' }, { status: 500 });
    }
    const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

    // Fast path: use the download_uri stored when the order was created
    let qrDownloadUri: string = raw?.qrDownloadUri || '';

    // Fallback: rawResponse was null or qrDownloadUri empty → re-fetch from Omise API
    if (!qrDownloadUri) {
      const chargeId = payment?.providerTransactionId;
      if (!chargeId) {
        console.error('[QR/omise] No chargeId in providerTransactionId — cannot re-fetch');
        return NextResponse.json(
          { error: 'QR image not found for this order (no charge ID)' },
          { status: 404 }
        );
      }

      // Fetch the charge — source is expanded inline
      const chargeRes = await fetch(`https://api.omise.co/charges/${chargeId}`, {
        headers: { Authorization: authHeader },
      });

      if (!chargeRes.ok) {
        const errText = await chargeRes.text().catch(() => '');
        console.error('[QR/omise] charge fetch failed:', chargeRes.status, errText.slice(0, 300));
        return NextResponse.json({ error: 'Failed to fetch charge from Omise' }, { status: 502 });
      }

      const charge = await chargeRes.json();
      const src = charge.source;

      if (src && typeof src === 'object') {
        // Source is expanded inline
        qrDownloadUri = src.scannable_code?.image?.download_uri || '';
      }

      // Source is a string (just the ID) — fetch source separately
      if (!qrDownloadUri) {
        const sourceId = typeof src === 'string' ? src : src?.id;
        if (sourceId) {
          const srcRes = await fetch(`https://api.omise.co/sources/${sourceId}`, {
            headers: { Authorization: authHeader },
          });
          if (srcRes.ok) {
            const srcData = await srcRes.json();
            qrDownloadUri = srcData.scannable_code?.image?.download_uri || '';
          } else {
            console.error('[QR/omise] source fetch failed:', srcRes.status);
          }
        }
      }
    }

    if (!qrDownloadUri) {
      console.error('[QR/omise] qrDownloadUri is empty after all attempts, chargeId=', payment?.providerTransactionId);
      return NextResponse.json(
        { error: 'QR image URL not available — the test order may not have a scannable QR. Try creating a new order.' },
        { status: 404 }
      );
    }

    // Proxy the image from Omise CDN
    const omiseRes = await fetch(qrDownloadUri, {
      headers: { Authorization: authHeader },
      redirect: 'follow',
    });

    if (!omiseRes.ok) {
      const errText = await omiseRes.text().catch(() => '');
      console.error('[QR/omise] CDN fetch failed:', omiseRes.status, errText.slice(0, 300));
      return NextResponse.json({ error: 'Failed to fetch QR image from Omise CDN' }, { status: 502 });
    }

    const contentType = omiseRes.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      // Omise returned non-image (e.g. HTML error page or JSON error)
      const body = await omiseRes.text().catch(() => '');
      console.error('[QR/omise] unexpected content-type from CDN:', contentType, body.slice(0, 300));
      return NextResponse.json(
        { error: 'Omise CDN returned unexpected content — check OMISE_SECRET_KEY' },
        { status: 502 }
      );
    }

    const imgBuffer = await omiseRes.arrayBuffer();
    return new NextResponse(new Uint8Array(imgBuffer), {
      status: 200,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=300' },
    });
  }

  /* ── Xendit — qr_string is a raw EMV payload → render to PNG ────── */
  if (provider === 'xendit') {
    const qrString = raw?.qrString || raw?.qr_string || '';
    if (!qrString) {
      return NextResponse.json({ error: 'QR data not found for this order' }, { status: 404 });
    }
    return renderEMV(qrString);
  }

  /* ── GBPrimePay — qrImage is a base64 PNG data URI ──────────────── */
  if (provider === 'gbprimepay') {
    const qrImage = raw?.qrImage || '';
    if (!qrImage) {
      return NextResponse.json({ error: 'QR image not found for this order' }, { status: 404 });
    }
    const base64 = qrImage.startsWith('data:') ? qrImage.split(',')[1] : qrImage;
    return new NextResponse(new Uint8Array(Buffer.from(base64, 'base64')), {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300' },
    });
  }

  /* ── PromptPay manual — generate on-the-fly ─────────────────────── */
  const promptPayId = process.env.PROMPTPAY_ID;
  if (!promptPayId) {
    return NextResponse.json({ error: 'PROMPTPAY_ID not configured' }, { status: 500 });
  }
  const generatePayload = (await import('promptpay-qr')).default;
  const emvPayload = generatePayload(promptPayId, { amount: Number(order.total) });
  return renderEMV(emvPayload);
}
