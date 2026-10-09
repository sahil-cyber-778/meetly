"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Meeting } from "@/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; meeting?: Meeting | null; onSave: (data: object) => Promise<void> };

export function MeetingModal({ open, onOpenChange, meeting, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setError(""), [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await onSave({
        title: form.get("title"), meeting_date: form.get("meeting_date"), duration: Number(form.get("duration")) * 60,
        participants: String(form.get("participants") || "").split(",").map(v => v.trim()).filter(Boolean),
        overview: form.get("overview"), transcript_text: form.get("transcript_text"),
      });
      onOpenChange(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save meeting"); }
    finally { setSaving(false); }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#16121f]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between"><div><Dialog.Title className="text-2xl font-bold tracking-[-.03em]">{meeting ? "Edit meeting" : "Add a meeting"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[#7c7785]">{meeting ? "Keep the meeting details accurate." : "Paste a transcript and Meetly will organize it for you."}</Dialog.Description></div><Dialog.Close className="rounded-lg p-2 text-[#8d8994] hover:bg-[#f4f2f7]"><X size={19}/></Dialog.Close></div>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block"><span className="mb-2 block text-xs font-semibold text-[#575261]">Meeting title</span><input required name="title" defaultValue={meeting?.title} placeholder="e.g. Product roadmap review" className="w-full rounded-xl border border-[#ddd9e3] px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-2 block text-xs font-semibold text-[#575261]">Date</span><input required type="date" name="meeting_date" defaultValue={meeting?.meeting_date || new Date().toISOString().slice(0,10)} className="w-full rounded-xl border border-[#ddd9e3] px-4 py-3 text-sm outline-none focus:border-violet-500"/></label>
              <label><span className="mb-2 block text-xs font-semibold text-[#575261]">Duration (minutes)</span><input required type="number" min="1" max="720" name="duration" defaultValue={meeting ? Math.round(meeting.duration/60) : 30} className="w-full rounded-xl border border-[#ddd9e3] px-4 py-3 text-sm outline-none focus:border-violet-500"/></label>
            </div>
            <label className="block"><span className="mb-2 block text-xs font-semibold text-[#575261]">Participants <em className="font-normal text-[#aaa6b2]">(comma separated)</em></span><input name="participants" defaultValue={meeting?.participants.map(p=>p.name).join(", ")} placeholder="Maya Chen, Jordan Lee" className="w-full rounded-xl border border-[#ddd9e3] px-4 py-3 text-sm outline-none focus:border-violet-500" /></label>
            {!meeting && <><label className="block"><span className="mb-2 block text-xs font-semibold text-[#575261]">Summary</span><textarea name="overview" rows={2} placeholder="What was this meeting about?" className="w-full resize-none rounded-xl border border-[#ddd9e3] px-4 py-3 text-sm outline-none focus:border-violet-500" /></label><label className="block"><span className="mb-2 block text-xs font-semibold text-[#575261]">Transcript</span><textarea name="transcript_text" rows={6} placeholder={'[00:00] Maya: Welcome everyone...\n[00:18] Jordan: Let’s review the roadmap.'} className="w-full resize-none rounded-xl border border-[#ddd9e3] px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-violet-500" /></label></>}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3 pt-1"><Dialog.Close className="rounded-xl border border-[#dedbe4] px-5 py-2.5 text-sm font-semibold">Cancel</Dialog.Close><button disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-700 disabled:opacity-60">{saving ? "Saving…" : meeting ? "Save changes" : "Create meeting"}</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

