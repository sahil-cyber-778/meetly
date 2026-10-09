"use client";

import Link from "next/link";
import { BarChart3, BookOpen, CalendarDays, ChevronDown, Clock3, Home, Settings, Sparkles } from "lucide-react";

const items = [
  { label: "Home", icon: Home },
  { label: "Meetings", icon: BookOpen, active: true },
  { label: "Calendar", icon: CalendarDays },
  { label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#e8e6ed] bg-white px-4 py-5 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white shadow-glow"><Sparkles size={19} /></span>
        <span className="text-[21px] font-bold tracking-[-.04em]">meetly</span>
      </Link>
      <nav className="space-y-1">
        {items.map(({ label, icon: Icon, active }) => (
          <Link key={label} href={active ? "/" : "#"} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-violet-50 text-violet-700" : "text-[#716d7a] hover:bg-[#f7f6fa]"}`}>
            <Icon size={18} strokeWidth={2} />{label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#aaa6b2]">Workspace</div>
      <div className="mt-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-700"><Clock3 size={14}/> This month</div>
        <div className="text-2xl font-bold">12.4h</div>
        <div className="mt-1 text-xs leading-5 text-[#827d8c]">of meetings made searchable</div>
        <div className="mt-3 h-1.5 rounded-full bg-violet-100"><div className="h-full w-3/5 rounded-full bg-violet-500" /></div>
      </div>
      <div className="mt-auto">
        <Link href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#716d7a] hover:bg-[#f7f6fa]"><Settings size={18}/> Settings</Link>
        <div className="mt-3 flex items-center gap-3 border-t border-[#efedf2] px-2 pt-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1e1a2b] text-xs font-bold text-white">AK</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Arjun Kumar</p><p className="truncate text-[11px] text-[#98939f]">Personal workspace</p></div>
          <ChevronDown size={15} className="text-[#aaa6b2]" />
        </div>
      </div>
    </aside>
  );
}

