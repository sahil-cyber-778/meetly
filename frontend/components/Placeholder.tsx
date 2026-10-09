"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";

export function Placeholder({title,onClose}:{title:string;onClose:()=>void}) {
  return <Dialog.Root open={!!title} onOpenChange={v=>{if(!v)onClose();}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-black/35"/><Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-7 shadow-2xl"><Dialog.Close aria-label="Close placeholder" className="absolute right-4 top-4 p-1"><X size={18}/></Dialog.Close><Sparkles className="mb-4 text-violet-600"/><Dialog.Title className="text-lg font-bold">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-[#8b8295]">Coming soon. This demo focuses on your meeting library, transcripts, notes and follow-ups.</Dialog.Description><Dialog.Close className="btn-primary mt-5">Got it</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
