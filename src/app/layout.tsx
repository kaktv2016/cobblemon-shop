import { Anuphan } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

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

export const metadata = {
  title: {
    default: "Cobblemon Divided - พอร์ทัลเซิร์ฟเวอร์ Cobblemon",
    template: "%s | Cobblemon Divided",
  },
  description:
    "พอร์ทัลของ Cobblemon Divided ที่รวมโลกของเซิร์ฟเวอร์ ข่าวสาร และคลังปลดล็อกแบบพรีเมียมไว้ในบรรยากาศที่เข้ม สุขุม และเป็นเอกลักษณ์",
};

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
