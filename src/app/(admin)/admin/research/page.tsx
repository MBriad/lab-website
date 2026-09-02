import type { Metadata } from "next";
import { ResearchList } from "./research-list";

export const metadata: Metadata = {
  title: "研究方向管理",
};

export default function AdminResearchPage() {
  return <ResearchList />;
}
