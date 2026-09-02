import type { Metadata } from "next";
import { NewsForm } from "../news-form";

export const metadata: Metadata = {
  title: "编辑新闻",
};

export default async function AdminNewsEditPage(
  props: PageProps<"/admin/news/[id]">,
) {
  const { id } = await props.params;
  return <NewsForm newsId={id} />;
}
