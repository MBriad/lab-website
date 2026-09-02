import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlClasses } from "./input";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/** Native select (dark color-scheme inherited from the global tokens). */
export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <select className={cn(controlClasses(invalid), className)} {...props}>
      {children}
    </select>
  );
}
