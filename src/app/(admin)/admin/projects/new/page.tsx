import type { Metadata } from "next";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = {
  title: "新建项目",
};

export default function AdminProjectsNewPage() {
  return <ProjectForm />;
}
