export function Highlight({text,query}:{text:string;query:string}) {
  const q=query.trim();
  if(!q)return <>{text}</>;
  const parts=text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi"));
  return <>{parts.map((part,i)=>part.toLowerCase()===q.toLowerCase()?<mark key={i} className="rounded bg-[#ffeaa3] px-0.5 text-inherit">{part}</mark>:part)}</>;
}
