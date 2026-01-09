import { decodeMentions, MentionReference } from "@/lib/mentions";
export type { MentionReference } from "@/lib/mentions";

export type DiaryMode = "real" | "decoy";

export interface DiaryEntryRecord {
  id: number;
  content: string;
  is_decoy: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface MentionReference {
  id: number;
  preview: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: number;
  content: string;
  createdAt: string;
  isDecoy: boolean;
  mentions?: MentionReference[];
}

export function mapDiaryRecord(record: DiaryEntryRecord): DiaryEntry {
  const { content, mentions } = decodeMentions(record.content);
  return {
    id: record.id,
    content,
    isDecoy: record.is_decoy === 1,
    createdAt: record.created_at,
    mentions,
  };
}
