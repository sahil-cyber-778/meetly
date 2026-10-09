"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Clock3, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api, SearchResult } from "@/lib/api";
import { Highlight } from "./Highlight";

export function GlobalSearch(){
  const [open,setOpen]=useState(false),[q,setQ]=useState(""),[rows,setRows]=useState<SearchResult[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setOpen(v=>!v);}};window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);},[]);
  useEffect(()=>{
    const controller=new AbortController();setRows([]);setError("");
    if(!q.trim()||!open){setLoading(false);return;}
    setLoading(true);
    const timer=setTimeout(()=>{api.search(q.trim(),controller.signal).then(setRows).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});},250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[q,open]);
  return <><button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-lg border border-[#e9e5ed] bg-[#faf9fc] px-3 py-2 text-sm text-[#968d9f]"><Search size={16}/><span className="hidden sm:inline">Search all meetings</span><kbd className="ml-5 hidden rounded border bg-white px-1.5 text-[10px] md:inline">Ctrl K</kbd></button><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#171121]/45 backdrop-blur-sm"/><Dialog.Content className="fixed left-1/2 top-[12vh] z-50 flex max-h-[76dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col rounded-2xl bg-white shadow-2xl"><Dialog.Title className="sr-only">Search all meetings</Dialog.Title><Dialog.Description className="sr-only">Search meeting titles, participants and transcript content.</Dialog.Description><div className="flex items-center gap-3 border-b p-5"><Search size={20} className="text-violet-600"/><input autoFocus aria-label="Global search" value={q} onChange={e=>setQ(e.target.value)} maxLength={200} placeholder="Search titles, people, or something someone said…" className="min-w-0 flex-1 text-sm outline-none"/><Dialog.Close aria-label="Close search"><X size={18}/></Dialog.Close></div><div className="overflow-y-auto p-3">{loading?<p role="status" className="p-8 text-center text-sm text-[#968d9f]">Searching your workspace…</p>:error?<p role="alert" className="p-5 text-red-600">{error}</p>:rows.length?rows.map((row,i)=><Link onClick={()=>setOpen(false)} key={`${row.kind}-${row.meeting_id}-${i}`} href={`/meetings/${row.meeting_id}${row.start_time!==null?`?t=${row.start_time}&q=${encodeURIComponent(q.trim())}`:""}`} className="mb-1 block rounded-xl p-4 hover:bg-violet-50 focus:bg-violet-50"><div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold"><Highlight text={row.title} query={q}/></span><span className="shrink-0 text-[10px] font-semibold uppercase text-violet-600">{row.kind}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#8b8295]"><Highlight text={row.text} query={q}/></p>{row.start_time!==null&&<span className="mt-2 flex items-center gap-1 text-xs text-violet-600"><Clock3 size={12}/> Jump to {Math.floor(row.start_time/60)}:{String(Math.floor(row.start_time%60)).padStart(2,"0")}</span>}</Link>):<p className="p-10 text-center text-sm text-[#968d9f]">{q?"No matches. Try another word or name.":"Find a decision in any conversation."}</p>}</div></Dialog.Content></Dialog.Portal></Dialog.Root></>;
}
