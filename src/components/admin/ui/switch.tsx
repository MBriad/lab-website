import { cn } from "@/lib/cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label next to the control. */
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/** Accessible on/off switch for contract booleans (is_visible, is_featured). */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-accent/70 bg-accent/30"
            : "border-hairline-strong bg-surface-2",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full transition-transform duration-150",
            checked ? "translate-x-4 bg-accent" : "translate-x-0 bg-ink-faint",
          )}
        />
      </button>
      {label ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-ink">{label}</span>
          {description ? (
            <span className="text-xs leading-5 text-ink-faint">
              {description}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
