import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export type TableProps = HTMLAttributes<HTMLTableElement>;

/**
 * Admin data table: horizontally scrollable on narrow screens so rows stay
 * usable at mobile widths (tables scroll instead of collapsing).
 */
export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="admin-table-wrap hairline overflow-x-auto rounded-panel bg-surface/40">
      <table
        className={cn("admin-table w-full min-w-[720px] border-collapse text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export type ThProps = ThHTMLAttributes<HTMLTableCellElement>;

export function Th({ className, ...props }: ThProps) {
  return (
    <th
      className={cn(
        "border-b border-hairline bg-surface/80 px-3 py-2.5 text-left",
        "font-mono text-[11px] font-normal tracking-[0.15em] whitespace-nowrap text-ink-faint uppercase",
        className,
      )}
      {...props}
    />
  );
}

export type TdProps = TdHTMLAttributes<HTMLTableCellElement>;

export function Td({ className, ...props }: TdProps) {
  return (
    <td
      className={cn("border-b border-hairline px-3 py-3 align-middle", className)}
      {...props}
    />
  );
}
