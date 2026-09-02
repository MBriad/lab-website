import type { Metadata, Viewport } from "next";
import { api } from "@/lib/api";
import "./globals.css";

/**
 * Metadata is derived from site settings (`api.getSiteSettings()`) with a
 * static fallback that mirrors the mock fixture defaults, so the shell
 * still builds when the data layer is unreachable.
 *
 * Fonts are system stacks defined in `globals.css` (`--lab-font-*`) so the
 * build never depends on network font fetches; next/font can be swapped in
 * later by pointing those variables at generated font variables.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await api.getSiteSettings();
    return {
      title: {
        default: settings.site_title,
        template: `%s | ${settings.site_title}`,
      },
      description: settings.description ?? settings.tagline ?? undefined,
    };
  } catch {
    return {
      title: {
        default: "星航机器人实验室 | 智能机器人与具身智能",
        template: "%s | 星航机器人实验室",
      },
      description:
        "星航机器人实验室（临江理工大学）官方网站——聚焦足式机器人、多智能体系统、具身感知与人机交互方向的科研与育人平台。",
    };
  }
}

export const viewport: Viewport = {
  themeColor: "#05070d",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background font-sans text-ink">
        {props.children}
      </body>
    </html>
  );
}
