"use client";

import clsx from "clsx";
import { Input } from "ui/input";
import { Label } from "ui/label";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { useValidationStore } from "@/store/validation";
import { validateField } from "@/lib/validation";

export type BasicInputProps = {
  type: "text" | "textarea" | "select" | "file" | "email" | "image"; // tambahkan email
  name: string;
  label: string;
  value?: any;
  onChange?: (e: any) => void;
  placeholder?: string;
  options?: { label: string; value: any }[]; // untuk select
  isError?: boolean;
  isLoading?: boolean;
  colSpan?: number; // jumlah kolom grid yang ditempati
  onChooseImage?: () => void; // callback untuk buka modal
  isImageChange?: boolean; // callback untuk buka modal
  required?: boolean;
  validationRule?: string;
};

const BasicInput: React.FC<BasicInputProps> = ({
  type,
  name,
  label,
  value,
  onChange,
  placeholder,
  options,
  isError,
  isLoading,
  colSpan = 1, // default span 1
  onChooseImage,
  required = true,
  validationRule = "required",
}) => {
  const [isImgLoading, setIsImgLoading] = useState(Boolean(value));

  const [imgKey, setImgKey] = useState(0);

  const { errors } = useValidationStore();
  const fieldErrors = errors[name];

  // Quill core
  const editorHolderRef = React.useRef<HTMLDivElement | null>(null);
  const quillRef = React.useRef<any | null>(null);
  const onChangeRef = React.useRef(onChange);
  const validationRuleRef = React.useRef(validationRule);
  const lastHtmlRef = React.useRef<string | null>(null);
  const textChangeHandlerRef = React.useRef<((...args: any[]) => void) | null>(null);
  const labelRef = React.useRef(label);
  const placeholderRef = React.useRef(placeholder);
  const nameRef = React.useRef(name);
  const valueRef = React.useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    validationRuleRef.current = validationRule;
  }, [validationRule]);

  useEffect(() => {
    labelRef.current = label;
  }, [label]);

  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);

  const handleChange = (e: any) => {
    if (onChange) onChange(e);
    validateField(name, e?.target?.value ?? e, validationRule);
  };

  useEffect(() => {
    valueRef.current = value;
    nameRef.current = name;
    if (value) {
      // hanya tampilkan loading jika ada gambar
      setIsImgLoading(true);
    } else {
      setIsImgLoading(false);
    }
    // reset key supaya <Image> rerender saat src berubah
    setImgKey((prev) => prev + 1);
    validateField(name, value, validationRule);
  }, [value, name, validationRule]);

  const toolbarOptions = React.useMemo(() => [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video"],
    ["clean"],
  ], []);

  // Initialize Quill once for textarea, prevent re-init on each keystroke
  useEffect(() => {
    if (type !== "textarea") return;
    if (quillRef.current) return; // already initialized
    const holderEl = editorHolderRef.current;
    if (!holderEl) return;
    let isMounted = true;
    const init = async () => {
      const QuillCtor = (await import("quill")).default as any;
      if (!holderEl) return;
      const quill = new QuillCtor(holderEl, {
        theme: "snow",
        placeholder: placeholderRef.current || labelRef.current || "",
        modules: { toolbar: toolbarOptions },
      });
      if (!isMounted) return;
      quillRef.current = quill;
      // set initial value (assume HTML string)
      if (valueRef.current) {
        try {
          quill.clipboard.dangerouslyPasteHTML(String(valueRef.current));
        } catch {
          // ignore initial paste failure
        }
      }
      const handler = (_delta: any, _oldDelta: any, source: string) => {
        if (source !== "user") return; // only react to user edits
        const html = quill.root.innerHTML;
        lastHtmlRef.current = html;
        const fieldName = nameRef.current;
        const evt = { target: { name: fieldName, value: html } } as any;
        if (onChangeRef.current) onChangeRef.current(evt);
        const plain = quill.getText().trim();
        validateField(fieldName, plain, validationRuleRef.current!);
      };
      textChangeHandlerRef.current = handler;
      quill.on("text-change", handler);
    };
    init();
    return () => {
      isMounted = false;
      if (quillRef.current) {
        try {
          if (textChangeHandlerRef.current) {
            quillRef.current.off?.("text-change", textChangeHandlerRef.current);
          }
        } catch {
          // ignore cleanup failures
        }
        quillRef.current = null;
        textChangeHandlerRef.current = null;
      }
      // Clean DOM to avoid duplicated toolbar on re-mount
      if (holderEl) {
        holderEl.innerHTML = "";
      }
    };
  }, [type, toolbarOptions]);

  // Keep editor content in sync when "value" prop changes externally
  useEffect(() => {
    if (type !== "textarea") return;
    const quill = quillRef.current;
    if (!quill) return;
    // Only update if content differs to avoid cursor jumps while typing
    try {
      const currentHtml = quill.root.innerHTML;
      const nextHtml = String(value ?? "");
      // Skip if this update is the same HTML we just emitted from user input
      if (lastHtmlRef.current !== null && nextHtml === lastHtmlRef.current) return;
      if (nextHtml && currentHtml !== nextHtml) {
        const range = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(nextHtml);
        // try to restore caret reasonably
        if (range) {
          const len = quill.getLength();
          quill.setSelection(Math.min(range.index, len - 1), range.length || 0);
        }
      }
    } catch {
      // ignore sync failures
    }
  }, [value, type]);

  return (
    <div
      className={clsx("space-y-1", {
        "col-span-1": colSpan === 1,
        "col-span-2": colSpan === 2,
        "col-span-3": colSpan === 3,
        "col-span-4": colSpan === 4,
        "col-span-5": colSpan === 5,
        "col-span-6": colSpan === 6,
        "col-span-7": colSpan === 7,
        "col-span-8": colSpan === 8,
        "col-span-9": colSpan === 9,
        "col-span-10": colSpan === 10,
        "col-span-11": colSpan === 11,
        "col-span-12": colSpan === 12,
      })}
    >
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>

      {(type === "text" || type === "email") && (
        <Input
          id={name}
          name={name}
          type={type} // ini bakal otomatis text atau email
          value={value}
          onChange={handleChange}
          placeholder={placeholder || label}
          disabled={isLoading}
          className={clsx({ "border-red-500": isError || fieldErrors?.length })}
          required={required}
        />
      )}

      {type === "textarea" && (
        <div
          className={clsx(
            "rounded-md bg-white",
            {
              "ring-1 ring-inset ring-red-500": isError || fieldErrors?.length,
              "opacity-60 pointer-events-none": isLoading,
            }
          )}
        >
          <div ref={editorHolderRef} className="min-h-40" />
        </div>
      )}

      {type === "select" && (
        <Select
          value={value}
          onValueChange={(val) => {
            if (onChange) {
              onChange({ target: { name, value: val } });
            }
            validateField(name, val, validationRule);
          }}
          disabled={isLoading}
        >
          <SelectTrigger
            className={clsx({
              "border-red-500": isError || fieldErrors?.length,
            })}
          >
            <SelectValue placeholder={placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "file" && (
        <Input
          id={name}
          name={name}
          type="file"
          onChange={(e) => {
            handleChange(e);
          }}
          disabled={isLoading}
          className={clsx({ "border-red-500": isError || fieldErrors?.length })}
          required={required}
        />
      )}

      {type === "image" && (
        <div className="mt-2 flex items-center space-x-4 p-2 border border-slate-300 rounded-md relative">
          {isImgLoading && (
            <div className="absolute right-0 left-0 w-full inset-0 flex items-center justify-center bg-slate-200 animate-pulse rounded">
              <span className="text-xs text-slate-500">
                Load Preview Image...
              </span>
            </div>
          )}
          <Image
            key={imgKey} // ini penting, supaya Next/Image rerender saat src berubah
            width={100}
            height={80}
            src={
              value ||
              "https://ik.imagekit.io/kp6a40wnb/katalog/Screenshot_from_2025-08-19_16-36-00_SLctlcIXN.png"
            }
            alt="Preview"
            className="w-24 h-16 rounded object-cover bg-slate-100"
            onLoadingComplete={() => setIsImgLoading(false)}
          />
          <div className="flex-grow">
            <p className="text-xs text-slate-500 break-all">
              {value || "No image selected."}
            </p>
          </div>
          <button
            type="button"
            onClick={onChooseImage}
            className="flex-shrink-0 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700"
          >
            Choose Image
          </button>
        </div>
      )}

      {isLoading && <p className="text-xs text-slate-400">Loading...</p>}
      {(isError || fieldErrors?.length) && (
        <p className="text-xs text-red-500">{fieldErrors?.[0] || "Error!"}</p>
      )}
    </div>
  );
};

export default BasicInput;
