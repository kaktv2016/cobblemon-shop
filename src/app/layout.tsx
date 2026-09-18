import { Anuphan } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";
import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/store-settings";

const bodyFont = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const displayFont = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: {
      default: `${settings.shopName} - พอร์ทัลเซิร์ฟเวอร์ Cobblemon`,
      template: `%s | ${settings.shopName}`,
    },
    description: settings.shopDescription,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`dark ${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen bg-gray-950 font-sans text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
