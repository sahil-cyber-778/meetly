import { ActionItem, Meeting } from "@/types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
export type SearchResult = { meeting_id: number; title: string; kind: "meeting" | "transcript"; text: string; start_time: number | null; segment_id: number | null };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init, headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    const detail = Array.isArray(body.detail) ? body.detail.map((e: {msg: string}) => e.msg).join("; ") : body.detail;
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const api = {
  meetings: (query = "", signal?: AbortSignal) => request<Meeting[]>(`/meetings${query}`, {signal}),
  search: (q: string, signal?: AbortSignal) => request<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`, {signal}),
  meeting: (id: string | number) => request<Meeting>(`/meetings/${id}`),
  createMeeting: (data: object) => request<Meeting>("/meetings", { method: "POST", body: JSON.stringify(data) }),
  updateMeeting: (id: number, data: object) => request<Meeting>(`/meetings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMeeting: (id: number) => request<void>(`/meetings/${id}`, { method: "DELETE" }),
  addAction: (mid: number, data: object) => request<ActionItem>(`/meetings/${mid}/action-items`, { method: "POST", body: JSON.stringify(data) }),
  updateAction: (mid: number, id: number, data: object) => request<ActionItem>(`/meetings/${mid}/action-items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAction: (mid: number, id: number) => request<void>(`/meetings/${mid}/action-items/${id}`, { method: "DELETE" }),
  export: async (id: number, format: string, content: string) => {
    const response = await fetch(`${API_URL}/meetings/${id}/export?format=${format}&content=${content}`);
    if (!response.ok) throw new Error("Could not export meeting.");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url; link.download = `meetly-${id}.${format}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

