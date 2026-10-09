"use client";
import * as Dialog from "@radix-ui/react-dialog";

export function ConfirmDelete({title,busy,onCancel,onConfirm}:{title:string;busy:boolean;onCancel:()=>void;onConfirm:()=>void}){
  return <Dialog.Root open={!!title} onOpenChange={v=>{if(!v&&!busy)onCancel();}}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40"/><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"><Dialog.Title className="text-lg font-bold">Delete this meeting?</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-[#8b8295]">“{title}” and its transcript, notes, chapters and action items will be permanently deleted.</Dialog.Description><div className="mt-6 flex justify-end gap-2"><button disabled={busy} onClick={onCancel} className="btn-secondary">Keep meeting</button><button disabled={busy} onClick={onConfirm} className="btn-primary bg-red-600 hover:bg-red-700">{busy?"Deleting…":"Delete meeting"}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
