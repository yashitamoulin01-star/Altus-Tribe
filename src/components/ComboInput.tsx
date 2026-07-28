"use client";

import { useId } from "react";

// A searchable, free-type dropdown built on the native <datalist>: members can
// pick from the suggestions or type their own value (spec §3/4/6 — "searchable
// where appropriate"). Native, lightweight, and accessible; keeps the existing
// PIN-code auto-fill working since the bound value is a plain string.
export default function ComboInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  autoComplete?: string;
}) {
  const listId = useId();
  return (
    <>
      <input
        className={className}
        list={listId}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}
