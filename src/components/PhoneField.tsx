"use client";

import { COUNTRIES, parsePhone, composePhone } from "@/lib/phone";

// Country-code + national-number input. Value is the stored E.164 string; onChange
// emits the composed E.164. Default country India (+91).
export default function PhoneField({
  value,
  onChange,
  placeholder = "Phone number",
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const { dial, national } = parsePhone(value);

  return (
    <div className="flex items-stretch gap-2">
      <select
        aria-label="Country code"
        value={dial}
        onChange={(e) => onChange(composePhone(e.target.value, national))}
        className="rounded-lg border border-hairline bg-surface-sunk px-2 py-3 text-[15px] text-ink focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.code} +{c.dial}
          </option>
        ))}
      </select>
      <input
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={national}
        onChange={(e) => onChange(composePhone(dial, e.target.value.replace(/[^0-9]/g, "")))}
        className="w-full rounded-lg border border-hairline bg-surface-sunk px-4 py-3 text-[16px] text-ink placeholder:text-ink-muted focus:border-red/50 focus:outline-none focus:ring-4 focus:ring-red/10"
      />
    </div>
  );
}
