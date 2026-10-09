"use client";
import Link from "next/link";
import { BookOpen, CalendarDays, LayoutGrid, List, Menu, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { MeetingCard } from "@/components/MeetingCard";
import { MeetingModal } from "@/components/MeetingModal";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Placeholder } from "@/components/Placeholder";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export default function Dashboard() {
  const [meetings,setMeetings]=useState<Meeting[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [search,setSearch]=useState(""),[participant,setParticipant]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState(""),[sort,setSort]=useState("newest");
  const [modal,setModal]=useState(false),[editing,setEditing]=useState<Meeting|null>(null),[deleting,setDeleting]=useState<Meeting|null>(null),[busy,setBusy]=useState(false);
  const [toast,setToast]=useState(""),[toastError,setToastError]=useState(false),[view,setView]=useState<"list"|"grid">("list"),[mobile,setMobile]=useState(false),[placeholder,setPlaceholder]=useState(""),[revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError("");
    const timer=setTimeout(()=>{
      const params=new URLSearchParams({sort});
      if(search.trim())params.set("search",search.trim());
      if(participant.trim())params.set("participant",participant.trim());
      if(from)params.set("date_from",from);
      if(to)params.set("date_to",to);
      api.meetings(`?${params}`,controller.signal).then(setMeetings).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    },200);
    return()=>{clearTimeout(timer);controller.abort();};
  },[search,participant,from,to,sort,revision]);
  const notify=(message:string,failed=false)=>{setToast(message);setToastError(failed);};
  async function save(data:object){if(editing)await api.updateMeeting(editing.id,data);else await api.createMeeting(data);notify(editing?"Meeting updated":"Meeting created");setRevision(v=>v+1);}
  async function remove(){if(!deleting)return;setBusy(true);try{await api.deleteMeeting(deleting.id);setDeleting(null);setRevision(v=>v+1);notify("Meeting deleted");}catch(e){notify(e instanceof Error?e.message:"Could not delete meeting",true);}finally{setBusy(false);}}
  const clearToast=useCallback(()=>setToast(""),[]);
  const filtered=!!(search||participant||from||to);
  return <div className="flex min-h-screen"><Sidebar open={mobile} onClose={()=>setMobile(false)}/><main className="min-w-0 flex-1">
    <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-[#e8e3ed] bg-white px-4 py-3 sm:px-8">
      <div className="flex items-center gap-3"><button onClick={()=>setMobile(true)} aria-label="Open navigation" className="p-2 lg:hidden"><Menu size={20}/></button><GlobalSearch/></div>
      <button onClick={()=>setPlaceholder("Invite teammates")} className="btn-secondary text-xs"><Users size={15}/> Invite teammates</button>
    </header>
    <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 lg:px-10">
      <div className="flex items-start justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#a196ab]">Your conversation hub</p><h1 className="text-[28px] font-bold tracking-[-.04em]">Meetings</h1><p className="mt-1 text-sm text-[#968b9f]">Find the moments that matter. Keep the next steps moving.</p></div><button onClick={()=>{setEditing(null);setModal(true);}} className="btn-primary shrink-0"><Plus size={17}/><span className="hidden sm:inline">Add meeting</span><span className="sm:hidden">Add</span></button></div>
      <div className="mt-7 flex items-center justify-between border-b border-[#e4dfea]"><div className="flex items-center gap-2 border-b-2 border-violet-600 px-1 py-3 text-sm font-semibold text-violet-700"><BookOpen size={16}/> All meetings <span className="ml-1 rounded-md bg-violet-100 px-2 py-0.5 text-[10px]">{loading?"…":meetings.length}</span></div><div className="flex gap-1 rounded-lg border border-[#e4dfea] bg-white p-1"><button aria-label="List view" aria-pressed={view==="list"} onClick={()=>setView("list")} className={`rounded p-1.5 ${view==="list"?"bg-violet-50 text-violet-700":"text-[#9b90a5]"}`}><List size={16}/></button><button aria-label="Grid view" aria-pressed={view==="grid"} onClick={()=>setView("grid")} className={`rounded p-1.5 ${view==="grid"?"bg-violet-50 text-violet-700":"text-[#9b90a5]"}`}><LayoutGrid size={16}/></button></div></div>
      <div className="my-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_.9fr]">
        <label className="field">Meeting title or person<div className="relative"><Search className="absolute left-3 top-3 text-[#a599ae]" size={16}/><input aria-label="Search meetings" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this library" className="input pl-9"/></div></label>
        <label className="field">Participant<input aria-label="Filter by participant" value={participant} onChange={e=>setParticipant(e.target.value)} placeholder="Anyone" className="input"/></label>
        <label className="field">From<input aria-label="From date" type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input"/></label>
        <label className="field">To<input aria-label="To date" type="date" value={to} onChange={e=>setTo(e.target.value)} className="input"/></label>
        <label className="field">Sort<select aria-label="Sort meetings" value={sort} onChange={e=>setSort(e.target.value)} className="input"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      </div>
      {filtered&&<button onClick={()=>{setSearch("");setParticipant("");setFrom("");setTo("");}} className="mb-4 flex items-center gap-1 text-xs font-semibold text-violet-600"><X size={13}/> Clear all filters</button>}
      {loading?<div aria-label="Loading meetings" className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-24 animate-pulse rounded-xl bg-[#ebe7f0]"/>)}</div>:error?<div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-7 text-sm text-red-700">{error}<button onClick={()=>setRevision(v=>v+1)} className="ml-4 font-bold underline">Retry</button></div>:!meetings.length?<div className="rounded-xl border border-dashed bg-white p-16 text-center"><Search className="mx-auto text-violet-500"/><h2 className="mt-4 font-semibold">No meetings found</h2><p className="mt-2 text-sm text-[#968b9f]">Try different filters or add a new conversation.</p></div>:view==="grid"?<div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{meetings.map(meeting=><MeetingCard key={meeting.id} meeting={meeting} onEdit={()=>{setEditing(meeting);setModal(true);}} onDelete={()=>setDeleting(meeting)}/>)}</div>:<div className="overflow-hidden rounded-xl border border-[#e7e1ec] bg-white">
        <div className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_90px] gap-5 border-b bg-[#fcfbfd] px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#a194ac] md:grid"><span>Meeting</span><span>Participants</span><span>Follow-ups</span><span className="text-right">Manage</span></div>
        {meetings.map(meeting=><article key={meeting.id} className="grid gap-4 border-b border-[#eeeaf2] px-4 py-5 transition last:border-b-0 hover:bg-[#fcfaff] sm:px-6 md:grid-cols-[minmax(0,2fr)_1fr_1fr_90px] md:items-center">
          <Link href={`/meetings/${meeting.id}`} className="flex min-w-0 items-center gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f1edfc] text-violet-500"><BookOpen size={19}/></span><span className="min-w-0"><span className="block text-sm font-semibold leading-6 text-[#453a51]">{meeting.title}</span><span className="mt-1 flex items-center gap-2 text-[11px] text-[#a194ac]"><CalendarDays size={12}/>{new Date(meeting.meeting_date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}<span>·</span>{Math.ceil(meeting.duration/60)} min</span></span></Link>
          <div className="text-xs text-[#95879f]"><div className="mb-1 flex -space-x-1">{meeting.participants.slice(0,4).map((p,i)=><span title={p.name} key={p.id} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[9px] font-semibold ${["bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-orange-100 text-orange-700","bg-sky-100 text-sky-700"][i%4]}`}>{p.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>)}</div><span>{meeting.participants.length} participants</span></div>
          <div><span className="rounded-full bg-[#eef8f2] px-2.5 py-1 text-[10px] font-semibold text-[#4b8d6a]">Ready to review</span><p className="mt-2 text-[11px] text-[#a194ac]">{meeting.action_items.filter(a=>a.completed).length} of {meeting.action_items.length} actions done</p></div>
          <div className="flex justify-end gap-1"><button aria-label={`Edit ${meeting.title}`} onClick={()=>{setEditing(meeting);setModal(true);}} className="rounded-lg p-2 text-[#a194ac] hover:bg-violet-100 hover:text-violet-700"><Pencil size={15}/></button><button aria-label={`Delete ${meeting.title}`} onClick={()=>setDeleting(meeting)} className="rounded-lg p-2 text-[#a194ac] hover:bg-red-50 hover:text-red-600"><Trash2 size={15}/></button></div>
        </article>)}
      </div>}
      <p className="mt-5 text-center text-[11px] text-[#b2a7bb]">A clearer record of every conversation.</p>
    </div>
    <MeetingModal open={modal} onOpenChange={setModal} meeting={editing} onSave={save}/>
    <ConfirmDelete title={deleting?.title||""} busy={busy} onCancel={()=>setDeleting(null)} onConfirm={remove}/>
    <Placeholder title={placeholder} onClose={()=>setPlaceholder("")}/>{toast&&<Toast message={toast} error={toastError} onClose={clearToast}/>}
  </main></div>;
}

