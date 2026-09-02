import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  /** Inline validation/error text; rendered with alert semantics. */
  error?: string | null;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Form field wrapper: label, control slot, then error (or hint) text. */
export function Field({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs leading-5 text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-5 text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
