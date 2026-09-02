import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { SiteSettingsPublic } from "@/lib/types/api";
import { NAV_LINKS } from "./nav-links";

export interface FooterProps {
  settings: SiteSettingsPublic;
}

/** Public footer: contact channels, quick links, admin entry, copyright. */
export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();

  const socials = [
    { label: "GitHub", hint: "开源仓库", href: settings.social_github },
    { label: "Bilibili", hint: "视频空间", href: settings.social_bilibili },
    {
      label: "Email",
      hint: "邮件联系",
      href: settings.social_email ? `mailto:${settings.social_email}` : null,
    },
  ].filter((item): item is { label: string; hint: string; href: string } =>
    Boolean(item.href),
  );

  return (
    <footer className="border-t border-hairline bg-surface/40">
      <Container width="wide" className="section-pad">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold">{settings.lab_name}</p>
            {settings.tagline ? (
              <p className="mt-2 font-mono text-xs tracking-[0.2em] text-accent uppercase">
                {settings.tagline}
              </p>
            ) : null}
            {settings.description ? (
              <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted line-clamp-4">
                {settings.description}
              </p>
            ) : null}
          </div>

          <nav aria-label="页脚导航">
            <p className="font-mono text-xs tracking-[0.3em] text-ink-faint uppercase">
              快速导航
            </p>
            <ul className="mt-4 space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-ink-faint uppercase">
              联系方式
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {settings.address ? <li>{settings.address}</li> : null}
              {settings.contact_email ? (
                <li>
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="transition-colors hover:text-accent"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              ) : null}
              {settings.contact_phone ? (
                <li>
                  <a
                    href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`}
                    className="transition-colors hover:text-accent"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs tracking-[0.3em] text-ink-faint uppercase">
              关注我们
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {socials.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={
                      item.href.startsWith("mailto:")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="group inline-flex items-baseline gap-2 text-ink-muted transition-colors hover:text-accent"
                  >
                    <span className="font-mono text-xs uppercase">{item.label}</span>
                    <span className="text-xs text-ink-faint group-hover:text-accent/70">
                      {item.hint}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink-faint">
            © {year} {settings.lab_name} · 保留所有权利
          </p>
          <Link
            href="/admin/login"
            className="font-mono text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink-muted hover:underline"
          >
            管理入口
          </Link>
        </div>
      </Container>
    </footer>
  );
}
