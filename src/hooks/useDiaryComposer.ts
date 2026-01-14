"use client";

import { useDiarySession } from "@/components/providers/DiarySessionProvider";
import { DiaryEntry, DiaryMode, MentionReference } from "@/types/diary";
import { useToast } from "@/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_LENGTH = 1000;

interface UseDiaryComposerParams {
  mentions: MentionReference[];
  onPosted: (entry: DiaryEntry) => void;
}

export function useDiaryComposer(params: UseDiaryComposerParams) {
  const diarySession = useDiarySession();
  const toastApi = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [targetMode, setTargetMode] = useState<DiaryMode>("real");
  const [showPlain, setShowPlain] = useState(false);
  const [holdReveal, setHoldReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetMode(diarySession.mode === "decoy" ? "decoy" : "real");
  }, [diarySession.mode]);

  const placeholder = useMemo(() => {
    if (diarySession.mode === "decoy") {
      return "Tulis cerita versi aman buat dibaca siapapun...";
    }
    return "Curhat aja di sini. Semua kabur kalau blur aktif.";
  }, [diarySession.mode]);

  const remaining = MAX_LENGTH - content.length;
  const shouldBlurContent = diarySession.blurSettings.composeBlur && !(showPlain || holdReveal);
  const canPost = content.trim().length > 0;

  const diaryMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.entry) {
        throw new Error(data?.error || "Gagal menyimpan diary.");
      }
      return data.entry as DiaryEntry;
    },
  });

  const submitDiary = useCallback(async () => {
    if (!canPost) return;
    setError(null);
    const payload: Record<string, unknown> = { content };
    if (diarySession.mode === "real") {
      payload.targetMode = targetMode;
    }
    if (params.mentions.length) {
      payload.mentions = params.mentions.map((mention) => ({
        id: mention.id,
        preview: mention.preview,
        createdAt: mention.createdAt,
      }));
    }
    try {
      const createdEntry = await diaryMutation.mutateAsync(payload);
      setContent("");
      setShowPlain(false);
      params.onPosted(createdEntry);
      toastApi.toast({
        title: "Catatan tersimpan",
        description: "Diary baru berhasil ditambahkan.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(message);
      toastApi.toast({
        title: "Gagal menyimpan",
        description: message,
        variant: "destructive",
      });
    }
  }, [canPost, content, diarySession.mode, targetMode, params.mentions, params.onPosted, toastApi, diaryMutation]);

  const handleContentChange = useCallback((next: string) => {
    setContent(next.slice(0, MAX_LENGTH));
  }, []);

  const togglePlainView = useCallback(() => {
    setShowPlain((prev) => !prev);
  }, []);

  return {
    textareaRef,
    content,
    handleContentChange,
    remaining,
    placeholder,
    shouldBlurContent,
    showPlain,
    togglePlainView,
    holdReveal,
    setHoldReveal,
    canPost: canPost && !diaryMutation.isPending,
    isPosting: diaryMutation.isPending,
    error,
    submitDiary,
    composeBlurEnabled: diarySession.blurSettings.composeBlur,
  };
}
