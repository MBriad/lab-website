import type { Metadata } from "next";
import { AwardForm } from "../award-form";

export const metadata: Metadata = {
  title: "新建荣誉",
};

export default function AdminAwardsNewPage() {
  return <AwardForm />;
}
