import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
export const inputClass =
  "w-full rounded-xl border border-[#E8BAC0] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE757C]/40";
export const buttonClass =
  "rounded-full bg-[#BE757C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#A9636A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-[#5C4A45]">{label}</span>
      {children}
    </label>
  );
}
export function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {error}
    </p>
  ) : null;
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    document.addEventListener("keydown", keys, true);
    return () => {
      document.removeEventListener("keydown", keys, true);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  function keys(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close.current();
    }
    if (e.key === "Tab") {
      const elements = [
        ...(ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) || []),
      ].filter((el) => el.offsetParent !== null);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first) {
        e.preventDefault();
        return;
      }
      const outside = !ref.current?.contains(document.activeElement);
      if (
        e.shiftKey &&
        (outside ||
          document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (outside ||
          document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#FFF9F9] shadow-2xl outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-[#5C423E] px-5 py-4 text-white">
          <h2 className="font-display text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
