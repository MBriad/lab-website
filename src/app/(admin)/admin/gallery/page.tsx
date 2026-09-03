import type { Metadata } from "next";
import { GalleryLibrary } from "./gallery-library";

export const metadata: Metadata = {
  title: "影像记录",
};

export default function AdminGalleryPage() {
  return <GalleryLibrary />;
}
