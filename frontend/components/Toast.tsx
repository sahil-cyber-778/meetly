"use client";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

export function Toast({ message, onClose, error = false }: { message: string; onClose: () => void; error?: boolean }) {
  useEffect(() => { const timer = setTimeout(onClose, 5000); return () => clearTimeout(timer); }, [message, onClose]);
  const Icon = error ? AlertCircle : CheckCircle2;
  return <div role={error ? "alert" : "status"} className="fixed bottom-6 right-4 z-[70] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl bg-[#201c2b] px-4 py-3 text-sm text-white shadow-2xl animate-rise">
    <Icon size={18} className={error ? "shrink-0 text-red-300" : "shrink-0 text-[#a895ff]"} />{message}
    <button onClick={onClose} aria-label="Dismiss notification" className="ml-2 p-1 text-white/60"><X size={16}/></button>
  </div>;
}

