"use client";
import Link from "next/link";
import { BookOpen, CalendarDays, ChevronDown, HelpCircle, Plug, Settings, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const [placeholder, setPlaceholder] = useState("");
  return <>
    {open && <button aria-label="Close navigation overlay" onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    <aside className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-[224px] shrink-0 flex-col border-r border-[#e8e6ed] bg-[#fcfbfe] px-4 py-6 lg:static lg:flex lg:h-screen`}>
      <div className="mb-8 flex items-center justify-between px-2"><Link href="/" className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white"><Sparkles size={19}/></span><span className="text-2xl font-bold tracking-[-.05em]">meetly<span className="text-violet-600">.</span></span></Link><button onClick={onClose} aria-label="Close navigation" className="p-2 lg:hidden"><X size={17}/></button></div>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#a29baa]">Workspace</p>
      <nav aria-label="Main navigation" className="space-y-1">
        <Link href="/" onClick={onClose} className="flex items-center gap-3 rounded-lg bg-violet-100/70 px-3 py-3 text-sm font-semibold text-violet-700"><BookOpen size={18}/> Meetings</Link>
        {[{name:"Calendar",icon:CalendarDays},{name:"Integrations",icon:Plug}].map(({name,icon:Icon}) => <button key={name} onClick={()=>setPlaceholder(name)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#746d80] hover:bg-violet-50"><Icon size={18}/>{name}<span className="ml-auto text-[9px] uppercase text-[#a39ba9]">Soon</span></button>)}
      </nav>
      <div className="mt-8 rounded-xl border border-violet-100 bg-white p-4"><span className="text-xs font-semibold text-violet-700">A little clarity, after every call.</span><p className="mt-2 text-xs leading-5 text-[#92899c]">Your conversations, decisions, and next steps in one place.</p></div>
      <div className="mt-auto pt-8">
        <button onClick={()=>setPlaceholder("Help & workspace settings")} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#746d80] hover:bg-violet-50"><Settings size={17}/> Settings <span className="ml-auto text-[9px]">SOON</span></button>
        <button onClick={()=>setPlaceholder("Profile")} className="mt-3 flex w-full items-center gap-3 border-t border-[#e8e3ed] px-2 pt-5 text-left"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#ebe5fa] text-xs font-bold text-violet-700">SK</span><span className="flex-1"><span className="block text-sm font-semibold">Sahil</span><span className="text-[11px] text-[#92899c]">Personal workspace</span></span><ChevronDown size={14}/></button>
      </div>
    </aside>
    <Placeholder title={placeholder} onClose={()=>setPlaceholder("")}/>
  </>;
}

