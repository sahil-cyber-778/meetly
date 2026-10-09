import { ActionItem, Meeting } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  meetings: (query = "") => request<Meeting[]>(`/meetings${query}`),
  meeting: (id: string | number) => request<Meeting>(`/meetings/${id}`),
  createMeeting: (data: object) => request<Meeting>("/meetings", { method: "POST", body: JSON.stringify(data) }),
  updateMeeting: (id: number, data: object) => request<Meeting>(`/meetings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMeeting: (id: number) => request<void>(`/meetings/${id}`, { method: "DELETE" }),
  addAction: (meetingId: number, data: object) => request<ActionItem>(`/meetings/${meetingId}/action-items`, { method: "POST", body: JSON.stringify(data) }),
  updateAction: (meetingId: number, id: number, data: object) => request<ActionItem>(`/meetings/${meetingId}/action-items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAction: (meetingId: number, id: number) => request<void>(`/meetings/${meetingId}/action-items/${id}`, { method: "DELETE" }),
};

