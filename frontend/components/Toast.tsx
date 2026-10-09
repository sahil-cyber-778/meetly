"use client";

import { CheckCircle2, X } from "lucide-react";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl bg-[#201c2b] px-4 py-3 text-sm font-medium text-white shadow-2xl animate-rise">
      <CheckCircle2 size={18} className="text-[#a895ff]" />{message}
      <button onClick={onClose} aria-label="Dismiss notification" className="ml-2 text-white/60 hover:text-white"><X size={16}/></button>
    </div>
  );
}

