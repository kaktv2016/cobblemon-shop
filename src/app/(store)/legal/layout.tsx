import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900/50 to-slate-850/50 border-b border-indigo-500/10">
        <div className="mx-auto max-w-3xl">
          <Link href="/">
            <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300 mb-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {children}
        </div>
      </div>
    </>
  );
}
