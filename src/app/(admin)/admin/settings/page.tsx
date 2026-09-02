import type { Metadata } from "next";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = {
  title: "站点设置",
};

export default function AdminSettingsPage() {
  return <SettingsForm />;
}
