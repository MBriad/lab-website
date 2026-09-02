import type { Metadata } from "next";
import { NewsList } from "./news-list";

export const metadata: Metadata = {
  title: "新闻管理",
};

export default function AdminNewsPage() {
  return <NewsList />;
}
