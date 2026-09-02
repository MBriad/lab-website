import type { Metadata } from "next";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = {
  title: "编辑项目",
};

export default async function AdminProjectsEditPage(
  props: PageProps<"/admin/projects/[id]">,
) {
  const { id } = await props.params;
  return <ProjectForm projectId={id} />;
}
