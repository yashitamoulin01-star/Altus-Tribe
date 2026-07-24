import type { ButtonHTMLAttributes } from "react";

// Canonical button primitive (UI-1 foundation). Red = primary accent, secondary =
// bordered white surface, ghost = quiet. Tokenized height/radius + accessible
// focus ring in both themes. Pages migrate to this in later checkpoints.
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-red text-white hover:bg-red-hover",
  secondary: "border border-hairline bg-surface text-ink hover:border-hairline-bright",
  ghost: "text-ink-secondary hover:text-ink hover:bg-surface-hover",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-[52px] px-6 text-[15px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 disabled:pointer-events-none disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...props}
    />
  );
}
