import type { Metadata } from "next";
import { ResearchForm } from "../research-form";

export const metadata: Metadata = {
  title: "新建研究方向",
};

export default function AdminResearchNewPage() {
  return <ResearchForm />;
}
