import { NextResponse } from 'next/server';

const GITHUB_REPO = 'kaktv2016/CobblemonDivided';
const API_URL     = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * GET /api/download/launcher
 *
 * ดึง release ล่าสุดจาก GitHub แล้ว redirect ไปยังไฟล์ .exe โดยตรง
 * ผู้เล่นกดปุ่มแล้วโหลดไฟล์ทันที — ไม่ต้องเด้งไปหน้า GitHub
 *
 * อัปเดต version บน GitHub → ลิงก์นี้ชี้ไปล่าสุดอัตโนมัติ ไม่ต้องแก้โค้ดเลย
 */
export async function GET() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'CobblemonDivided-Web',
      },
      // revalidate ทุก 5 นาที — ไม่ต้อง hit GitHub ทุก request
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('[download/launcher] GitHub API error:', res.status);
      // fallback ไปหน้า releases ถ้า API มีปัญหา
      return NextResponse.redirect(
        `https://github.com/${GITHUB_REPO}/releases/latest`,
        { status: 302 }
      );
    }

    const release = await res.json();
    const version: string = release.tag_name ?? 'latest';

    // หา asset ที่เป็น .exe
    const exeAsset = (release.assets as { name: string; browser_download_url: string }[])
      .find((a) => a.name.endsWith('.exe'));

    if (!exeAsset) {
      console.error(`[download/launcher] No .exe found in release ${version}`);
      return NextResponse.redirect(
        `https://github.com/${GITHUB_REPO}/releases/latest`,
        { status: 302 }
      );
    }

    console.log(`[download/launcher] → ${exeAsset.name} (${version})`);

    // redirect ตรงไปยังไฟล์ — browser จะโหลดทันที
    return NextResponse.redirect(exeAsset.browser_download_url, { status: 302 });
  } catch (err) {
    console.error('[download/launcher] Unexpected error:', err);
    return NextResponse.redirect(
      `https://github.com/${GITHUB_REPO}/releases/latest`,
      { status: 302 }
    );
  }
}
