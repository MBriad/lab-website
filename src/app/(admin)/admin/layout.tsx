import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Admin route group layout: wraps every `/admin/**` route in the guarded
 * admin chrome. The login route renders bare (the shell detects it).
 * Noindex: the console should never appear in search results.
 */
export const metadata: Metadata = {
  title: {
    default: "管理后台",
    template: "%s | 管理后台",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
