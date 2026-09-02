import type { Metadata } from "next";
import { ProjectList } from "./project-list";

export const metadata: Metadata = {
  title: "项目管理",
};

export default function AdminProjectsPage() {
  return <ProjectList />;
}
