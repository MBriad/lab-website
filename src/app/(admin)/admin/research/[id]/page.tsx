import type { Metadata } from "next";
import { ResearchForm } from "../research-form";

export const metadata: Metadata = {
  title: "编辑研究方向",
};

export default async function AdminResearchEditPage(
  props: PageProps<"/admin/research/[id]">,
) {
  const { id } = await props.params;
  return <ResearchForm areaId={id} />;
}
