export type Participant = { id: number; name: string; email?: string | null };
export type TranscriptSegment = { id: number; speaker: string; start_time: number; end_time: number; text: string };
export type ActionItem = { id: number; meeting_id: number; text: string; assignee: string | null; completed: boolean };
export type Chapter = { id: number; title: string; start_time: number };
export type Summary = { id: number; overview: string; notes: string };
export type Meeting = {
  id: number;
  title: string;
  meeting_date: string;
  duration: number;
  created_at: string;
  participants: Participant[];
  action_items: ActionItem[];
  transcript_segments?: TranscriptSegment[];
  chapters?: Chapter[];
  summary?: Summary | null;
};

