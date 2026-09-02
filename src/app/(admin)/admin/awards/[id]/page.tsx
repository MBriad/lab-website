import type { Metadata } from "next";
import { AwardForm } from "../award-form";

export const metadata: Metadata = {
  title: "编辑荣誉",
};

export default async function AdminAwardsEditPage(
  props: PageProps<"/admin/awards/[id]">,
) {
  const { id } = await props.params;
  return <AwardForm awardId={id} />;
}
