import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { HudLink } from "@/components/ui/hud-link";
import { SectionHeader } from "@/components/ui/section-header";
import type { SiteSettingsPublic } from "@/lib/types/api";

export interface ContactSectionProps {
  settings: SiteSettingsPublic;
}

interface Channel {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

interface Action {
  label: string;
  href: string;
  variant: "primary" | "ghost";
  external?: boolean;
}

/** SEC.07 — contact channels from settings + editorial join invitation. */
export function ContactSection({ settings }: ContactSectionProps) {
  const contactEmail = settings.contact_email ?? settings.social_email;
  const channels: Channel[] = [];
  if (settings.address) {
    channels.push({ label: "地址", value: settings.address });
  }
  if (contactEmail) {
    channels.push({
      label: "邮箱",
      value: contactEmail,
      href: `mailto:${contactEmail}`,
    });
  }
  if (settings.contact_phone) {
    channels.push({
      label: "电话",
      value: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`,
    });
  }
  if (settings.social_github) {
    channels.push({
      label: "GitHub",
      value: "开源仓库 ↗",
      href: settings.social_github,
      external: true,
    });
  }
  if (settings.social_bilibili) {
    channels.push({
      label: "Bilibili",
      value: "视频空间 ↗",
      href: settings.social_bilibili,
      external: true,
    });
  }

  const actions: Action[] = [
    { label: "浏览项目", href: "/projects", variant: "primary" },
    { label: "查看研究方向", href: "/research", variant: "ghost" },
  ];
  if (settings.join_url || contactEmail) {
    actions.push({
      label: "加入实验室",
      href: settings.join_url ?? `mailto:${contactEmail}?subject=${encodeURIComponent("加入实验室咨询")}`,
      variant: "ghost",
      external: Boolean(settings.join_url),
    });
  }
  if (settings.papers_url) {
    actions.push({ label: "查看论文", href: settings.papers_url, variant: "ghost", external: true });
  }
  if (contactEmail) {
    actions.push({ label: "联系实验室", href: `mailto:${contactEmail}`, variant: "ghost" });
    actions.push({
      label: "科研合作",
      href: settings.cooperation_url ?? `mailto:${contactEmail}?subject=${encodeURIComponent("科研与产业合作咨询")}`,
      variant: "ghost",
      external: Boolean(settings.cooperation_url),
    });
  } else if (settings.cooperation_url) {
    actions.push({ label: "科研合作", href: settings.cooperation_url, variant: "ghost", external: true });
  }

  return (
    <section id="contact" className="section-pad border-t border-hairline">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Reveal variant="fade">
              <SectionHeader index="07" code="CONTACT" title="联系与加入" />
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-6 space-y-4 leading-8 text-ink-muted">
                <p>
                  我们长期欢迎对机器人研究充满热情的本科生、研究生与访问学者加入。无论你是想从第一行控制代码写起，还是已经带着自己的课题，这里都有真实的平台、完整的实验条件与一起攻关的伙伴。
                </p>
                <p>
                  实验室每学期开放科研训练名额，暑期举办面向全校的机器人训练营，并持续发布学科竞赛与毕业设计课题。感兴趣的同学请通过右侧任意渠道与我们联系，附上简单的自我介绍即可。
                </p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <ul className="mt-8 space-y-2 font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
                <li>OPEN // 科研训练 · 暑期训练营</li>
                <li>OPEN // 学科竞赛 · 毕业设计</li>
                <li>OPEN // 访问交流 · 联合培养</li>
              </ul>
            </Reveal>
            <Reveal delay={240}>
              <nav aria-label="实验室行动入口" className="mt-8 flex flex-wrap gap-3">
                {actions.map((action) => (
                    <HudLink key={action.label} href={action.href} variant={action.variant} external={action.external}>
                    {action.label}
                  </HudLink>
                ))}
              </nav>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <div className="hud-panel p-6 sm:p-8">
              <p className="font-mono text-xs tracking-[0.3em] text-accent uppercase">
                {"CHANNELS // 联系方式"}
              </p>
              <dl className="mt-6 space-y-5">
                {channels.map((channel) => (
                  <div key={channel.label}>
                    <dt className="font-mono text-[10px] tracking-[0.25em] text-ink-faint uppercase">
                      {channel.label}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-6 text-ink">
                      {channel.href ? (
                        <a
                          href={channel.href}
                          target={channel.external ? "_blank" : undefined}
                          rel={channel.external ? "noopener noreferrer" : undefined}
                          className="underline-offset-4 transition-colors hover:text-accent hover:underline"
                        >
                          {channel.value}
                        </a>
                      ) : (
                        channel.value
                      )}
                    </dd>
                  </div>
                ))}
                {channels.length === 0 ? (
                  <p className="text-sm text-ink-muted">联系方式整理中。</p>
                ) : null}
              </dl>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
