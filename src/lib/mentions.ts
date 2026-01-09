const MARKER_START = "<!--MENTIONS:";
const MARKER_END = "-->";

export interface MentionReference {
  id: number;
  preview: string;
  createdAt: string;
}

const base64Encode = (value: string) => {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }
  return window.btoa(unescape(encodeURIComponent(value)));
};

const base64Decode = (value: string) => {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }
  return decodeURIComponent(escape(window.atob(value)));
};

export function encodeMentions(content: string, mentions: MentionReference[]) {
  if (!mentions.length) return content;
  const safeJson = JSON.stringify(mentions);
  const encoded = base64Encode(safeJson);
  return `${content}\n\n${MARKER_START}${encoded}${MARKER_END}`;
}

export function decodeMentions(raw: string): { content: string; mentions: MentionReference[] } {
  const index = raw.lastIndexOf(MARKER_START);
  if (index === -1) {
    return { content: raw, mentions: [] };
  }
  const start = index + MARKER_START.length;
  const end = raw.indexOf(MARKER_END, start);
  if (end === -1) {
    return { content: raw, mentions: [] };
  }
  const encoded = raw.slice(start, end);
  const baseContent = raw.slice(0, index).trimEnd();
  try {
    const json = base64Decode(encoded);
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return {
        content: baseContent,
        mentions: parsed.map((mention) => ({
          id: Number(mention.id),
          preview: typeof mention.preview === "string" ? mention.preview : "",
          createdAt: typeof mention.createdAt === "string" ? mention.createdAt : new Date().toISOString(),
        })),
      };
    }
  } catch {
    // ignore bad mention payloads
  }
  return { content: baseContent, mentions: [] };
}
