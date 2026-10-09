"use client";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Clock3, Download, ListChecks, Menu, Pencil, Search, Sparkles, Trash2, Users, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Highlight } from "@/components/Highlight";
import { Player } from "@/components/Player";
import { ActionItems } from "@/components/ActionItems";
import { MeetingModal } from "@/components/MeetingModal";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { api } from "@/lib/api";
import { activeSegment, clampTime, formatTime } from "@/lib/playback";
import { Meeting } from "@/types";

const initials=(name:string)=>name.split(" ").map(p=>p[0]).slice(0,2).join("");
const colors=["bg-violet-100 text-violet-700","bg-emerald-100 text-emerald-700","bg-orange-100 text-orange-700","bg-sky-100 text-sky-700"];

export default function MeetingDetail(){
  const params=useParams<{id:string}>(),router=useRouter();
  const locationQuery=useSearchParams().toString();
  const [meeting,setMeeting]=useState<Meeting|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [tab,setTab]=useState<"summary"|"actions"|"chapters">("summary"),[query,setQuery]=useState(""),[time,setTime]=useState(0),[playing,setPlaying]=useState(false);
  const [toast,setToast]=useState(""),[toastError,setToastError]=useState(false),[mobile,setMobile]=useState(false),[editingNotes,setEditingNotes]=useState(false),[busy,setBusy]=useState(false),[editMeeting,setEditMeeting]=useState(false),[deleting,setDeleting]=useState(false);
  const [exportFormat,setExportFormat]=useState("md"),[exportContent,setExportContent]=useState("all"),[matchIndex,setMatchIndex]=useState(0);
  const transcriptPane=useRef<HTMLDivElement>(null);
  const notify=useCallback((message:string,failed=false)=>{setToast(message);setToastError(failed);},[]);
  const closeToast=useCallback(()=>setToast(""),[]);
  useEffect(()=>{
    let cancelled=false;setLoading(true);setPlaying(false);
    api.meeting(params.id).then(m=>{if(cancelled)return;setMeeting(m);setError("");const search=new URLSearchParams(window.location.search);setTime(clampTime(Number(search.get("t")||0),m.duration));setQuery(search.get("q")||"");}).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[params.id,locationQuery]);
  const segments=useMemo(()=>meeting?.transcript_segments||[],[meeting]);
  const active=useMemo(()=>activeSegment(segments,time,meeting?.duration||0),[segments,time,meeting?.duration]);
  const matches=useMemo(()=>query.trim()?segments.filter(s=>s.text.toLowerCase().includes(query.trim().toLowerCase())):[],[segments,query]);
  useEffect(()=>{setMatchIndex(0);},[query]);
  useEffect(()=>{
    const pane=transcriptPane.current;
    const row=pane?.querySelector<HTMLElement>(`[data-segment-id="${active?.id}"]`);
    if(pane&&row) pane.scrollTo({top:Math.max(0,row.offsetTop-pane.offsetTop-pane.clientHeight/3),behavior:"smooth"});
  },[active?.id]);
  function seek(value:number){if(meeting)setTime(clampTime(value,meeting.duration));}
  function nextMatch(direction:number){if(!matches.length)return;const index=(matchIndex+direction+matches.length)%matches.length;setMatchIndex(index);seek(matches[index].start_time);}
  async function saveNotes(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!meeting)return;const form=new FormData(e.currentTarget);setBusy(true);try{setMeeting(await api.updateMeeting(meeting.id,{overview:form.get("overview"),notes:form.get("notes")}));setEditingNotes(false);notify("Notes saved");}catch(e){notify(e instanceof Error?e.message:"Could not save notes",true);}finally{setBusy(false);}}
  async function remove(){if(!meeting)return;setBusy(true);try{await api.deleteMeeting(meeting.id);router.push("/");}catch(e){notify(e instanceof Error?e.message:"Could not delete meeting",true);setBusy(false);}}
  async function download(){if(!meeting)return;try{await api.export(meeting.id,exportFormat,exportContent);notify("Export downloaded");}catch(e){notify(e instanceof Error?e.message:"Export failed",true);}}
  if(loading)return <div className="flex min-h-screen"><Sidebar/><main className="grid flex-1 place-items-center"><p role="status" className="text-sm text-violet-600">Opening your meeting…</p></main></div>;
  if(error||!meeting)return <div className="grid min-h-screen place-items-center p-8"><div className="text-center"><h1 className="text-xl font-bold">Meeting unavailable</h1><p role="alert" className="my-3 text-sm text-[#968b9f]">{error}</p><Link href="/" className="btn-primary">Back to meetings</Link></div></div>;
  return <div className="flex min-h-screen lg:h-dvh lg:overflow-hidden"><Sidebar open={mobile} onClose={()=>setMobile(false)}/><main className="flex min-w-0 flex-1 flex-col">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6"><div className="flex items-center gap-2"><button aria-label="Open navigation" onClick={()=>setMobile(true)} className="p-2 lg:hidden"><Menu size={20}/></button><Link href="/" className="flex items-center gap-2 text-xs text-[#968b9f]"><ArrowLeft size={16}/> Meetings</Link></div><GlobalSearch/></header>
    <div className="shrink-0 border-b border-[#e9e2ef] bg-white px-4 py-5 sm:px-7"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{meeting.title}</h1><div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#a095aa]"><span>{new Date(meeting.meeting_date+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span><span className="flex items-center gap-1"><Clock3 size={13}/>{Math.ceil(meeting.duration/60)} min</span><span className="flex items-center gap-1"><Users size={13}/>{meeting.participants.length} participants</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">Ready to review</span></div></div><div className="flex shrink-0 gap-1"><button aria-label="Edit meeting" onClick={()=>setEditMeeting(true)} className="btn-secondary p-2"><Pencil size={15}/></button><button aria-label="Delete meeting" onClick={()=>setDeleting(true)} className="btn-secondary p-2 hover:text-red-600"><Trash2 size={15}/></button></div></div></div>
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="order-2 w-full shrink-0 border-r border-[#e5deed] bg-[#faf8fc] lg:order-1 lg:w-[39%] lg:max-w-[480px] lg:overflow-y-auto">
        <div role="tablist" aria-label="Meeting notes" className="sticky top-0 z-10 flex border-b border-[#e5deed] bg-white px-3">{([{id:"summary",label:"Summary",icon:Sparkles},{id:"actions",label:"Actions",icon:ListChecks},{id:"chapters",label:"Chapters",icon:Clock3}] as const).map(({id,label,icon:Icon})=><button role="tab" aria-selected={tab===id} key={id} onClick={()=>setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-4 text-xs font-semibold ${tab===id?"border-violet-600 text-violet-700":"border-transparent text-[#9a8da4]"}`}><Icon size={14}/>{label}{id==="actions"&&<span className="text-[10px]">({meeting.action_items.length})</span>}</button>)}</div>
        <div className="p-5 sm:p-6">
          {tab==="summary"&&(editingNotes?<form onSubmit={saveNotes} className="space-y-4"><label className="field">Overview<textarea name="overview" defaultValue={meeting.summary?.overview} rows={8} className="input"/></label><label className="field">Notes<textarea name="notes" defaultValue={meeting.summary?.notes} rows={6} className="input"/></label><div className="flex gap-2"><button disabled={busy} className="btn-primary text-xs"><Check size={14}/>{busy?"Saving…":"Save notes"}</button><button type="button" disabled={busy} onClick={()=>setEditingNotes(false)} className="btn-secondary text-xs">Cancel</button></div></form>:<section><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Meeting overview</p><button onClick={()=>setEditingNotes(true)} className="btn-secondary text-xs"><Pencil size={12}/> Edit notes</button></div><h2 className="mt-5 text-lg font-bold">The short version</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#786783]">{meeting.summary?.overview||"No summary yet."}</p><div className="mt-6 rounded-xl border border-[#e6ddf0] bg-white p-5"><h3 className="flex items-center gap-2 text-xs font-bold text-[#675573]"><Sparkles size={14} className="text-violet-600"/> Key notes</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#8b7b95]">{meeting.summary?.notes||"Add decisions, context or follow-ups here."}</p></div><h3 className="mt-7 text-[10px] font-bold uppercase tracking-widest text-[#a092ab]">Participants</h3><div className="mt-3 flex flex-wrap gap-2">{meeting.participants.map((p,i)=><span key={p.id} className="flex items-center gap-2 rounded-full border border-[#e5deed] bg-white py-1 pl-1 pr-3 text-[11px] text-[#786783]"><span className={`grid h-6 w-6 place-items-center rounded-full text-[8px] font-bold ${colors[i%4]}`}>{initials(p.name)}</span>{p.name}</span>)}</div></section>)}
          {tab==="actions"&&<ActionItems meeting={meeting} onChange={items=>setMeeting(m=>m?{...m,action_items:items}:m)} onNotify={notify}/>}
          {tab==="chapters"&&<section><p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Conversation outline</p><h2 className="mt-2 text-lg font-bold">Chapters</h2><div className="mt-4 space-y-2">{meeting.chapters?.map((chapter,i)=><button key={chapter.id} onClick={()=>seek(chapter.start_time)} className="flex w-full items-center gap-3 rounded-xl border border-[#e5deed] bg-white p-4 text-left hover:border-violet-300"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-50 text-xs text-violet-600">{i+1}</span><span className="text-sm font-semibold text-[#786783]">{chapter.title}<span className="mt-1 block font-mono text-[10px] font-normal text-violet-600">{formatTime(chapter.start_time)}</span></span></button>)}</div></section>}
          <div className="mt-8 border-t border-[#e5deed] pt-5"><h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#a092ab]">Take your notes with you</h3><div className="flex flex-wrap gap-2"><select aria-label="Export content" value={exportContent} onChange={e=>setExportContent(e.target.value)} className="min-w-0 rounded-lg border bg-white px-2 py-2 text-xs"><option value="all">Full meeting</option><option value="transcript">Transcript</option><option value="summary">Summary & actions</option></select><select aria-label="Export format" value={exportFormat} onChange={e=>setExportFormat(e.target.value)} className="rounded-lg border bg-white px-2 text-xs"><option value="md">Markdown</option><option value="txt">TXT</option></select><button onClick={download} className="btn-secondary text-xs"><Download size={14}/> Export</button></div></div>
        </div>
      </aside>
      <section className="order-1 flex min-h-0 min-w-0 flex-1 flex-col bg-white lg:order-2">
        <div className="shrink-0 border-b border-[#eee8f3] px-4 py-4 sm:px-6"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">Transcript</h2><span className="text-[10px] text-[#ac9fb6]">{segments.length} segments</span></div><div className="mt-3 flex items-center gap-2"><div className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-3 text-[#ac9fb6]"/><input aria-label="Search transcript" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")nextMatch(e.shiftKey?-1:1);}} placeholder="Search in this conversation" className="input pl-9 pr-8"/>{query&&<button aria-label="Clear transcript search" onClick={()=>setQuery("")} className="absolute right-2 top-3"><X size={14}/></button>}</div>{query&&<><span role="status" className="whitespace-nowrap text-[10px] text-[#a092ab]">{matches.length?matchIndex+1:0}/{matches.length}</span><button aria-label="Previous match" disabled={!matches.length} onClick={()=>nextMatch(-1)} className="p-1 disabled:opacity-30"><ArrowUp size={15}/></button><button aria-label="Next match" disabled={!matches.length} onClick={()=>nextMatch(1)} className="p-1 disabled:opacity-30"><ArrowDown size={15}/></button></>}</div></div>
        <div ref={transcriptPane} className="thin-scrollbar relative max-h-[55dvh] min-h-[260px] flex-1 overflow-y-auto px-3 py-4 sm:px-5 lg:max-h-none">
          {!segments.length&&<p className="p-8 text-center text-sm text-[#a092ab]">No transcript was provided for this meeting.</p>}
          {segments.map(segment=>{const selected=active?.id===segment.id;const index=Math.max(0,meeting.participants.findIndex(p=>p.name===segment.speaker));return <button key={segment.id} data-segment-id={segment.id} data-active={selected?"true":"false"} aria-label={`Seek to ${formatTime(segment.start_time)}: ${segment.speaker}`} aria-current={selected?"true":undefined} onClick={()=>seek(segment.start_time)} className={`mb-2 flex w-full gap-3 rounded-xl border p-4 text-left transition sm:gap-4 ${selected?"border-violet-200 bg-violet-50":"border-transparent hover:bg-[#faf8fc]"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold ${colors[index%4]}`}>{initials(segment.speaker)}</span><span className="min-w-0 flex-1"><span className="mb-2 flex flex-wrap items-center gap-3"><span className="text-xs font-bold text-[#6c5c79]">{segment.speaker}</span><span className="font-mono text-[10px] text-violet-600">{formatTime(segment.start_time)}</span>{selected&&<span className="text-[9px] font-semibold uppercase tracking-wide text-violet-500">{playing?"Playing":"Selected"}</span>}</span><span className="block break-words text-sm leading-7 text-[#86758f]"><Highlight text={segment.text} query={query}/></span></span></button>;})}
        </div>
      </section>
    </div>
    <div className="sticky bottom-0 z-20 lg:static"><Player duration={meeting.duration} time={time} setTime={setTime} playing={playing} setPlaying={setPlaying}/></div>
    <MeetingModal open={editMeeting} onOpenChange={setEditMeeting} meeting={meeting} onSave={async data=>{setMeeting(await api.updateMeeting(meeting.id,data));notify("Meeting updated");}}/>
    <ConfirmDelete title={deleting?meeting.title:""} busy={busy} onCancel={()=>setDeleting(false)} onConfirm={remove}/>
    {toast&&<Toast message={toast} error={toastError} onClose={closeToast}/>}
  </main></div>;
}

