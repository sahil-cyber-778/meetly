"use client";
import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from "react";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { clampTime, formatTime } from "@/lib/playback";

export function Player({duration,time,setTime,playing,setPlaying}:{duration:number;time:number;setTime:Dispatch<SetStateAction<number>>;playing:boolean;setPlaying:Dispatch<SetStateAction<boolean>>}) {
  const [speed,setSpeed]=useState(1);
  useEffect(()=>{
    if(!playing)return;
    let previous=performance.now();
    const timer=setInterval(()=>{const now=performance.now();const delta=(now-previous)/1000*speed;previous=now;setTime(t=>clampTime(t+delta,duration));},100);
    return()=>clearInterval(timer);
  },[playing,speed,duration,setTime]);
  useEffect(()=>{if(time>=duration)setPlaying(false);},[time,duration,setPlaying]);
  return <section aria-label="Meeting player" className="shrink-0 border-t border-[#e5dfed] bg-white px-4 py-4 sm:px-8"><div className="flex items-center gap-3 sm:gap-5"><button aria-label={playing?"Pause":"Play"} onClick={()=>{if(time>=duration)setTime(0);setPlaying(!playing);}} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 text-white hover:bg-violet-700">{playing?<Pause size={18}/>:<Play size={18}/>}</button><button aria-label="Back 10 seconds" onClick={()=>setTime(t=>clampTime(t-10,duration))} className="hidden p-1 text-[#8b8295] sm:block"><RotateCcw size={17}/></button><span data-testid="player-time" className="w-10 shrink-0 font-mono text-xs">{formatTime(time)}</span><input aria-label="Meeting playback position" type="range" min={0} max={duration} step={0.1} value={time} onChange={e=>setTime(Number(e.target.value))} className="range min-w-0 flex-1" style={{"--progress":`${time/duration*100}%`} as CSSProperties}/><span className="font-mono text-xs text-[#968d9f]">{formatTime(duration)}</span><button aria-label="Forward 10 seconds" onClick={()=>setTime(t=>clampTime(t+10,duration))} className="hidden p-1 text-[#8b8295] sm:block"><RotateCw size={17}/></button><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="rounded-lg border px-1 py-1.5 text-xs"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></div><p className="mt-2 text-center text-[10px] text-[#a39aaa]">Transcript playback · simulated audio</p></section>;
}
