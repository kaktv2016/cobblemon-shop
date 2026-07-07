"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export function AccordionItem({ title, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-indigo-500/20 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden hover:border-indigo-400/30 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <ChevronDown
          className={`h-5 w-5 text-indigo-400 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-6 py-4 border-t border-indigo-500/10 text-slate-300 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
