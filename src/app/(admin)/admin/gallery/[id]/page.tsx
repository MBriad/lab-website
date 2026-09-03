import type { Metadata } from "next";
import { GalleryForm } from "../gallery-form";

export const metadata: Metadata = {
  title: "编辑影像记录",
};

interface AdminGalleryEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGalleryEditPage({
  params,
}: AdminGalleryEditPageProps) {
  const { id } = await params;
  return <GalleryForm galleryId={id} />;
}
