'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Loader2,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXPIRE_MINUTES = 30;
const POLL_INTERVAL_MS = 10_000; // check order status every 10 s

type OrderInfo = {
  id: string;
  orderNumber: string;
  total: string;
  status: string;
  promptPayId: string;
};

function formatBaht(amount: string | number) {
  return Number(amount).toLocaleString('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  });
}

function useCountdown(minutes: number) {
  const endRef = useRef<number>(Date.now() + minutes * 60 * 1000);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, Math.floor((endRef.current - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, expired: secondsLeft === 0 };
}

export default function PromptPayCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [copied, setCopied] = useState<'id' | 'amount' | null>(null);
  const [paid, setPaid] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  const { display: countdown, expired } = useCountdown(EXPIRE_MINUTES);

  /* ── Fetch order info ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!orderId) {
      setOrderError('ไม่พบหมายเลขคำสั่งซื้อ');
      setLoadingOrder(false);
      return;
    }

    fetch(`/api/store/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setOrder({
          id: data.id,
          orderNumber: data.orderNumber,
          total: data.total,
          status: data.status,
          // PromptPay ID comes from the env (masked here for display)
          promptPayId: process.env.NEXT_PUBLIC_PROMPTPAY_DISPLAY_ID || 'xxx-xxx-xxxx',
        });
        if (data.status === 'PAID' || data.status === 'QUEUED_DELIVERY') {
          setPaid(true);
        }
      })
      .catch((e) => setOrderError(e.message || 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้'))
      .finally(() => setLoadingOrder(false));
  }, [orderId]);

  /* ── Poll order status until PAID ─────────────────────────────────── */
  useEffect(() => {
    if (!orderId || paid || expired) return;

    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/store/orders/${orderId}`);
        const data = await r.json();
        if (data.status === 'PAID' || data.status === 'QUEUED_DELIVERY') {
          setPaid(true);
          clearInterval(id);
        }
      } catch {
        // silent — we'll catch on next tick
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [orderId, paid, expired]);

  /* ── Redirect after confirmed ──────────────────────────────────────── */
  useEffect(() => {
    if (paid && orderId) {
      const t = setTimeout(() => router.push(`/account/orders/${orderId}`), 3000);
      return () => clearTimeout(t);
    }
  }, [paid, orderId, router]);

  /* ── Copy helper ───────────────────────────────────────────────────── */
  const copyToClipboard = (text: string, field: 'id' | 'amount') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  /* ── Download QR ───────────────────────────────────────────────────── */
  const downloadQR = () => {
    const a = document.createElement('a');
    a.href = `/api/store/payment/qr?order=${orderId}`;
    a.download = `promptpay-qr-${order?.orderNumber ?? orderId}.png`;
    a.click();
  };

  /* ── Manually verify payment with Omise API ─────────────────────── */
  const handleVerify = async () => {
    if (!orderId || verifying) return;
    setVerifying(true);
    setVerifyMsg('');
    try {
      const res = await fetch('/api/store/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (data.updated && data.status === 'PAID') {
        setPaid(true);  // trigger success screen + redirect
        return;
      }

      const msgMap: Record<string, string> = {
        successful: 'ชำระแล้ว กำลังอัปเดต…',
        pending:    'ยังไม่พบการชำระเงิน — กรุณารอสักครู่แล้วลองอีกครั้ง',
        failed:     'การชำระเงินล้มเหลวในระบบ Omise',
        expired:    'QR หมดอายุแล้วในระบบ Omise — กรุณาสร้างออเดอร์ใหม่',
      };
      setVerifyMsg(msgMap[data.chargeStatus] ?? data.error ?? 'ยังไม่พบการชำระเงิน');
    } catch {
      setVerifyMsg('เชื่อมต่อไม่ได้ — กรุณาลองใหม่');
    } finally {
      setVerifying(false);
    }
  };

  /* ── Handle QR image load error ─────────────────────────────────── */
  const handleQrError = async () => {
    setQrLoading(false);
    try {
      // Fetch the endpoint directly to get the actual error message
      const res = await fetch(`/api/store/payment/qr?order=${orderId}`);
      const data = await res.json().catch(() => ({}));
      setQrError(data.error || `โหลด QR ไม่สำเร็จ (${res.status})`);
    } catch {
      setQrError('โหลด QR ไม่สำเร็จ — กรุณาลองใหม่');
    }
  };

  /* ──────────────────────────────────────────────────────────────────── */

  if (loadingOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030816]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  if (orderError || !orderId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#030816] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-rose-400" />
        <p className="text-lg font-semibold text-white">{orderError || 'ไม่พบคำสั่งซื้อ'}</p>
        <Link href="/store" className="text-sm text-cyan-300 hover:underline">
          กลับหน้าร้านค้า
        </Link>
      </main>
    );
  }

  /* ── Payment confirmed ─────────────────────────────────────────────── */
  if (paid) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#030816] px-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">ชำระเงินสำเร็จ!</h1>
          <p className="mt-2 text-slate-400">
            ยืนยันการชำระเงินแล้ว — กำลังนำคุณไปหน้าคำสั่งซื้อ…
          </p>
        </div>
      </main>
    );
  }

  /* ── Expired ───────────────────────────────────────────────────────── */
  if (expired) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#030816] px-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-400/30">
          <Clock className="h-12 w-12 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">QR Code หมดอายุแล้ว</h1>
          <p className="mt-2 text-slate-400">
            QR Code ใช้งานได้ {EXPIRE_MINUTES} นาที หากคุณชำระเงินแล้วโปรดรอสักครู่
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => router.refresh()}
            variant="outline"
            className="gap-2 border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
          >
            <RefreshCw className="h-4 w-4" />
            โหลดใหม่
          </Button>
          {orderId && (
            <Button asChild className="bg-cyan-500 text-black hover:bg-cyan-400">
              <Link href={`/account/orders/${orderId}`}>ดูสถานะคำสั่งซื้อ</Link>
            </Button>
          )}
        </div>
      </main>
    );
  }

  /* ── Main QR UI ────────────────────────────────────────────────────── */
  const amountBaht = order ? formatBaht(order.total) : '';

  return (
    <main className="min-h-screen bg-[#030816] px-4 py-16 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_60%)]" />

      <div className="relative mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            ชำระเงินผ่าน PromptPay
          </h1>
          {order && (
            <p className="mt-1 text-sm text-slate-400">
              คำสั่งซื้อ #{order.orderNumber}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#081120]/80 shadow-[0_24px_80px_rgba(2,6,17,0.5)] backdrop-blur-xl">
          {/* Timer bar */}
          <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
            <span className="text-sm font-medium text-slate-300">QR Code หมดอายุใน</span>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="font-mono text-lg font-semibold tabular-nums text-amber-300">
                {countdown}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 px-6 py-8">
            {/* QR Code */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-cyan-400/10 blur-xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white p-4 shadow-lg min-h-[288px] min-w-[288px] flex items-center justify-center">
                {/* Loading spinner while QR loads */}
                {qrLoading && !qrError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                )}

                {/* Error state */}
                {qrError ? (
                  <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
                    <AlertCircle className="h-10 w-10 text-rose-500" />
                    <p className="text-sm font-medium text-slate-800">โหลด QR ไม่สำเร็จ</p>
                    <p className="text-xs text-slate-500 max-w-[220px]">{qrError}</p>
                    <button
                      onClick={() => { setQrError(''); setQrLoading(true); }}
                      className="mt-1 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      ลองใหม่
                    </button>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={qrLoading ? 'loading' : 'loaded'}
                    src={`/api/store/payment/qr?order=${orderId}`}
                    alt="PromptPay QR Code"
                    width={256}
                    height={256}
                    className="block"
                    onLoad={() => setQrLoading(false)}
                    onError={handleQrError}
                  />
                )}
              </div>
            </div>

            {/* PromptPay logo badge */}
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2">
              <Phone className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium text-white">PromptPay</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="text-sm text-slate-400">แสกนด้วยแอปธนาคาร</span>
            </div>

            {/* Amount */}
            <div className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-slate-500">
                ยอดชำระ
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-white">{amountBaht}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(String(order?.total ?? ''), 'amount')}
                  className="gap-1.5 rounded-xl border border-white/8 bg-white/[0.04] text-xs text-slate-300 hover:bg-white/[0.08] hover:text-white"
                >
                  {copied === 'amount' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === 'amount' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <ol className="w-full space-y-3 text-sm">
              {[
                'เปิดแอปธนาคารหรือ True Money Wallet',
                'เลือก "สแกน QR" หรือ "โอนเงิน PromptPay"',
                'สแกน QR ด้านบน แล้วกรอกยอดให้ครบถ้วน',
                'กดยืนยันการโอน — ระบบจะอัปเดตสถานะอัตโนมัติ',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-xs font-bold text-cyan-300">
                    {i + 1}
                  </span>
                  <span className="text-slate-300 leading-6">{step}</span>
                </li>
              ))}
            </ol>

            {/* ── ตรวจสอบการชำระเงิน (manual verify) ── */}
            <div className="w-full space-y-2">
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-md shadow-emerald-500/20"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังตรวจสอบ…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    ชำระเงินแล้ว — ตรวจสอบสถานะ
                  </>
                )}
              </Button>

              {/* Feedback message */}
              {verifyMsg && (
                <p className={`text-center text-xs px-2 ${
                  verifyMsg.includes('ไม่พบ') || verifyMsg.includes('ล้มเหลว') || verifyMsg.includes('หมดอายุ')
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}>
                  {verifyMsg}
                </p>
              )}
            </div>

            {/* Download QR */}
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadQR}
              className="w-full gap-2 rounded-2xl border border-white/8 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] hover:text-white"
            >
              <Download className="h-4 w-4" />
              บันทึก QR Code
            </Button>
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 px-6 py-4 text-center text-xs text-slate-500">
            หากชำระเงินแล้วแต่ระบบยังไม่อัปเดต —{' '}
            <Link href="/support" className="text-cyan-400 hover:text-cyan-300">
              ติดต่อทีมงาน
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href={`/account/orders/${orderId}`} className="text-sm text-slate-500 hover:text-white">
            ดูรายละเอียดคำสั่งซื้อ →
          </Link>
        </div>
      </div>
    </main>
  );
}
