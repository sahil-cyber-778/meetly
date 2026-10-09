import type { TranscriptSegment } from "../types/index";

export function clampTime(value:number,duration:number){return Number.isFinite(value)?Math.max(0,Math.min(duration,value)):0;}
export function activeSegment(segments:TranscriptSegment[],time:number,duration:number){
  return segments.find(s=>time>=s.start_time&&time<s.end_time) || (time===duration?segments.find(s=>s.end_time===duration):undefined);
}
export function formatTime(value:number){const n=Math.floor(value);return `${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`;}
