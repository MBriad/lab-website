import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PublicMotionField } from "@/components/motion/public-motion-field";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { api } from "@/lib/api";
import type { SiteSettingsPublic } from "@/lib/types/api";

/**
 * Public site shell: navbar + scroll progress + content + footer.
 *
 * Settings are fetched once per server render for the shell chrome. On
 * failure the navbar keeps a static fallback label and the footer is
 * omitted — page content handles its own error states.
 */
export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  let settings: SiteSettingsPublic | null = null;
  try {
    settings = await api.getSiteSettings();
  } catch {
    settings = null;
  }

  return (
    <PublicMotionField>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:border focus:border-accent focus:bg-white/90 focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-accent"
      >
        跳到主要内容
      </a>
      <ScrollProgress />
      <Navbar labName={settings?.lab_name ?? "星航机器人实验室"} logo={settings?.logo} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {settings ? <Footer settings={settings} /> : null}
    </PublicMotionField>
  );
}
