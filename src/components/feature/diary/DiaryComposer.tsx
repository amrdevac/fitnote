"use client";

import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { DiaryMode, MentionReference } from "@/types/diary";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/ui/textarea";
import { Button } from "@/ui/button";
import { useToast } from "@/ui/use-toast";

interface DiaryComposerProps {
  onPosted: () => void;
  mentions: MentionReference[];
  onRemoveMention: (id: number) => void;
}

const MAX_LENGTH = 1000;

export default function DiaryComposer({ onPosted, mentions, onRemoveMention }: DiaryComposerProps) {
  const { mode, blurSettings } = useDiarySession();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [targetMode, setTargetMode] = useState<DiaryMode>("real");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlain, setShowPlain] = useState(false);
  const [holdReveal, setHoldReveal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTargetMode(mode === "decoy" ? "decoy" : "real");
  }, [mode]);

  const remaining = MAX_LENGTH - content.length;
  const canPost = content.trim().length > 0 && !submitting;
  const placeholder = useMemo(() => {
    if (mode === "decoy") {
      return "Tulis cerita versi aman buat dibaca siapapun...";
    }
    return "Curhat aja di sini. Semua kabur kalau blur aktif.";
  }, [mode]);

  const submitDiary = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, any> = { content };
      if (mode === "real") {
        payload.targetMode = targetMode;
      }
      if (mentions.length) {
        payload.mentions = mentions.map((mention) => ({
          id: mention.id,
          preview: mention.preview,
          createdAt: mention.createdAt,
        }));
      }
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Gagal menyimpan diary.");
      }
      setContent("");
      setShowPlain(false);
      onPosted();
      toast({
        title: "Catatan tersimpan",
        description: "Diary baru berhasil ditambahkan.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      toast({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [canPost, content, mode, onPosted, targetMode, mentions, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    submitDiary();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.activeElement === textareaRef.current) {
        event.preventDefault();
        setHoldReveal(false);
        textareaRef.current?.blur();
        return;
      }
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        textareaRef.current?.focus();
        return;
      }
      if (
        event.ctrlKey &&
        event.altKey &&
        event.key.toLowerCase() === "s" &&
        document.activeElement === textareaRef.current
      ) {
        event.preventDefault();
        setHoldReveal(true);
        return;
      }
      if (
        event.ctrlKey &&
        event.key === "Enter" &&
        document.activeElement === textareaRef.current
      ) {
        event.preventDefault();
        submitDiary();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "s" ||
        !event.ctrlKey ||
        !event.altKey ||
        document.activeElement !== textareaRef.current
      ) {
        setHoldReveal((prev) => (prev ? false : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [submitDiary]);

  return (
    <section
      className="diary-surface rounded-3xl border p-6 shadow-sm backdrop-blur bg-white"
      data-section="compose"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="diary-label font-semibold">
            Compose
          </p>
        </div>
        <div>
{blurSettings.composeBlur && (
            <Button
            variant={"outlineDefault"}
              type="button"
              onClick={() => setShowPlain((prev) => !prev)}
              className="diary-blur-toggle rounded-full"
            >
              {showPlain ? "Blur lagi" : "Lihat teks"}
            </Button>
          )}

        </div>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {mentions.length > 0 && (
          <div className="diary-mention-block rounded-2xl border p-4 space-y-2">
            <p className="diary-label">Menanggapi</p>
            {mentions.map((mention) => (
              <div key={`mention-preview-${mention.id}`} className="diary-mention-preview rounded-xl border p-3">
                <div className="diary-mention-preview-meta flex items-center justify-between">
                  <span>{formatTimeAgo(mention.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveMention(mention.id)}
                    className="diary-mention-remove"
                  >
                    Hapus
                  </button>
                </div>
                <p className="diary-mention-text text-sm">{mention.preview}</p>
              </div>
            ))}
          </div>
        )}
        <div className="relative group">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
            data-id="diary-composer-textarea"
            placeholder={placeholder}
            className={cn(
              "min-h-[150px] resize-none rounded-2xl diary-textarea leading-relaxed shadow-inner  border focus-within:ring-0 ",
              blurSettings.composeBlur && !(showPlain || holdReveal)
                ? "filter blur-[4px] group-hover:blur-none transition-all"
                : ""
            )}
            disabled={submitting}
            onBlur={() => setHoldReveal(false)}
          />
          
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm diary-text-muted">
          <span className="diary-char-counter font-mono">
            {remaining} karakter tersisa
          </span>
          {error && <span className="diary-error-text">{error}</span>}
          <Button
            type="submit"
            disabled={!canPost}
            variant="default"
            className="ml-auto rounded-full px-6"
          >
            {submitting ? "Menyimpan..." : "Posting"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function formatTimeAgo(dateString: string) {
  const parsed = new Date(`${dateString}Z`);
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) return "baru saja";
  if (Math.abs(minutes) < 60) {
    return `${Math.abs(minutes)} menit lalu`;
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return `${Math.abs(hours)} jam lalu`;
  }
  const days = Math.round(hours / 24);
  return `${Math.abs(days)} hari lalu`;
}
