import type { Metadata } from "next";
import { GalleryForm } from "../gallery-form";

export const metadata: Metadata = {
  title: "新建影像记录",
};

export default function AdminGalleryNewPage() {
  return <GalleryForm />;
}
