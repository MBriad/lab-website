import type { Metadata } from "next";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "仪表盘",
};

export default function AdminDashboardPage() {
  return <Dashboard />;
}
