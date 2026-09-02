import type { Metadata } from "next";
import { AwardList } from "./award-list";

export const metadata: Metadata = {
  title: "荣誉管理",
};

export default function AdminAwardsPage() {
  return <AwardList />;
}
