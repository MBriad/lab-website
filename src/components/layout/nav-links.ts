export interface NavLinkItem {
  href: string;
  label: string;
  /** Mono index prefix shown in the HUD navigation. */
  code: string;
}

/** Primary public navigation, shared by the navbar and footer. */
export const NAV_LINKS: NavLinkItem[] = [
  { href: "/", label: "首页", code: "01" },
  { href: "/research", label: "研究方向", code: "02" },
  { href: "/projects", label: "项目", code: "03" },
  { href: "/awards", label: "荣誉", code: "04" },
  { href: "/news", label: "新闻", code: "05" },
];

/** Active-route check for nav highlighting. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
