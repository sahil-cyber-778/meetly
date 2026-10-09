"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { FileUp, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Meeting } from "@/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; meeting?: Meeting | null; onSave: (data: object) => Promise<void> };
export function MeetingModal({ open, onOpenChange, meeting, onSave }: Props) {
  const [saving,setSaving]=useState(false), [error,setError]=useState(""), [transcript,setTranscript]=useState(""), [format,setFormat]=useState("txt"), [filename,setFilename]=useState("");
  useEffect(()=>{setError("");setTranscript("");setFormat("txt");setFilename("");},[open]);
  async function upload(file?: File) {
    if(!file)return;
    const ext=file.name.split(".").pop()?.toLowerCase();
    if(!ext || !["txt","vtt","json"].includes(ext)){setError("Choose a .txt, .vtt or .json file.");return;}
    if(file.size>1_000_000){setError("Transcript exceeds the 1 MB limit.");return;}
    try {setTranscript(await file.text());setFormat(ext);setFilename(file.name);setError("");} catch {setError("Could not read this file.");}
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");
    const form=new FormData(event.currentTarget);
    const data={title:String(form.get("title")).trim(),meeting_date:form.get("meeting_date"),duration:Math.round(Number(form.get("duration"))*60),participants:String(form.get("participants")||"").split(",").map(v=>v.trim()).filter(Boolean)};
    try {await onSave(meeting?data:{...data,overview:String(form.get("overview")||""),transcript_text:transcript,transcript_format:format});onOpenChange(false);}
    catch(e){setError(e instanceof Error?e.message:"Could not save meeting.");}finally{setSaving(false);}
  }
  return <Dialog.Root open={open} onOpenChange={saving?undefined:onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#171121]/45 backdrop-blur-sm"/>
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex justify-between gap-4"><div><Dialog.Title className="text-xl font-bold">{meeting?"Edit meeting":"Add a meeting"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[#8b8295]">{meeting?"Update the details of your conversation.":"Upload a transcript or paste a conversation to get started."}</Dialog.Description></div><Dialog.Close disabled={saving} aria-label="Close meeting form" className="h-8 p-1"><X size={20}/></Dialog.Close></div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="field">Meeting title<input required minLength={2} maxLength={200} name="title" defaultValue={meeting?.title} placeholder="Product roadmap review" className="input"/></label>
        <div className="grid grid-cols-2 gap-4"><label className="field">Date<input required type="date" name="meeting_date" defaultValue={meeting?.meeting_date||new Date().toLocaleDateString("en-CA")} className="input"/></label><label className="field">Duration (minutes)<input required type="number" min="1" max="720" step="any" name="duration" defaultValue={meeting?meeting.duration/60:30} className="input"/></label></div>
        <label className="field">Participants<input name="participants" defaultValue={meeting?.participants.map(p=>p.name).join(", ")} placeholder="Maya Chen, Jordan Lee" className="input"/><span className="text-[11px] font-normal text-[#968d9f]">Separate names with commas. Uploaded speakers are included automatically.</span></label>
        {!meeting&&<><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4"><FileUp className="shrink-0 text-violet-600" size={24}/><span className="min-w-0 text-sm"><span className="block truncate font-semibold text-violet-700">{filename||"Upload a transcript"}</span><span className="text-xs text-[#8b8295]">TXT, WebVTT or JSON · up to 1 MB</span></span><input aria-label="Upload transcript" type="file" accept=".txt,.vtt,.json" onChange={e=>upload(e.target.files?.[0])} className="sr-only"/></label>
        <div className="flex items-center justify-between"><label htmlFor="transcript" className="text-xs font-semibold">Transcript</label><select aria-label="Transcript format" value={format} onChange={e=>setFormat(e.target.value)} className="rounded-lg border p-1.5 text-xs"><option value="txt">Plain text</option><option value="vtt">WebVTT</option><option value="json">JSON</option></select></div>
        <textarea id="transcript" value={transcript} onChange={e=>setTranscript(e.target.value)} rows={5} placeholder={"[00:00] Maya: Welcome everyone.\n[00:18] Jordan: Let's review the roadmap."} className="input font-mono text-xs"/>
        <p className="text-xs text-[#968d9f]">Timestamps must fit within the duration above. JSON uses an array of speaker, text, start_time and optional end_time.</p>
        <label className="field">Summary (optional)<textarea name="overview" rows={2} className="input" placeholder="What was discussed?"/></label></>}
        {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><Dialog.Close disabled={saving} className="btn-secondary">Cancel</Dialog.Close><button disabled={saving} className="btn-primary">{saving?"Saving…":meeting?"Save changes":"Create meeting"}</button></div>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

