import type { Metadata } from "next";
import { NewsForm } from "../news-form";

export const metadata: Metadata = {
  title: "新建新闻",
};

export default function AdminNewsNewPage() {
  return <NewsForm />;
}
