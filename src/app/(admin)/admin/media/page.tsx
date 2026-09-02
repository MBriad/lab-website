import type { Metadata } from "next";
import { MediaLibrary } from "./media-library";

export const metadata: Metadata = {
  title: "素材库",
};

export default function AdminMediaPage() {
  return <MediaLibrary />;
}
