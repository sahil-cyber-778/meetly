"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Meeting } from "@/types";

const colors = ["bg-[#ebe5ff] text-[#6242dc]", "bg-[#e2f4ee] text-[#24745e]", "bg-[#ffeadf] text-[#a95229]", "bg-[#e4efff] text-[#3564a8]"];
const fmtDuration = (seconds: number) => `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)}h ` : ""}${Math.round((seconds % 3600) / 60)}m`;

export function MeetingCard({ meeting, onEdit, onDelete }: { meeting: Meeting; onEdit: () => void; onDelete: () => void }) {
  const [menu, setMenu] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setMenu(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  const completed = meeting.action_items.filter(item => item.completed).length;
  return (
    <article className="group relative rounded-2xl border border-[#e8e5ec] bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex -space-x-2">{meeting.participants.slice(0,3).map((person,index)=><span key={person.id} title={person.name} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white text-[10px] font-bold ${colors[index%colors.length]}`}>{person.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>)}</div>
          <span className="text-xs font-medium text-[#8c8793]">{meeting.participants.length} people</span>
        </div>
        <div className="relative" ref={ref}>
          <button onClick={()=>setMenu(!menu)} aria-label="Meeting options" className="rounded-lg p-1.5 text-[#9c98a4] hover:bg-[#f4f2f7] hover:text-ink"><MoreHorizontal size={19}/></button>
          {menu && <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-[#e4e1e8] bg-white p-1.5 text-sm shadow-xl animate-rise"><button onClick={()=>{setMenu(false);onEdit();}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#f6f4f8]"><Pencil size={14}/> Edit</button><button onClick={()=>{setMenu(false);onDelete();}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"><Trash2 size={14}/> Delete</button></div>}
        </div>
      </div>
      <Link href={`/meetings/${meeting.id}`} className="mt-5 block">
        <h2 className="line-clamp-2 min-h-14 text-[18px] font-bold leading-7 tracking-[-.025em] transition group-hover:text-violet-700">{meeting.title}</h2>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[#837e89]"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{new Date(`${meeting.meeting_date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span><span className="flex items-center gap-1.5"><Clock3 size={14}/>{fmtDuration(meeting.duration)}</span></div>
        <div className="mt-5 flex items-center justify-between border-t border-[#efedf2] pt-4"><span className="rounded-full bg-[#f2efff] px-2.5 py-1 text-[11px] font-semibold text-violet-700">Transcript ready</span><span className="flex items-center gap-1.5 text-[11px] font-medium text-[#8c8793]"><CheckCircle2 size={14} className="text-[#43a987]"/>{completed}/{meeting.action_items.length} actions</span></div>
      </Link>
    </article>
  );
}

