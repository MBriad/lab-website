import type {
  AdminPublic,
  AwardAdmin,
  GalleryItemAdmin,
  MediaAdmin,
  MediaPublic,
  NewsAdmin,
  ProjectAdmin,
  ResearchAreaAdmin,
  SiteSettingsAdmin,
} from "@/lib/types/api";

/**
 * Deterministic fixture database for the mock API client.
 *
 * - Shapes mirror `contracts/openapi.json` exactly (admin views, embedded
 *   `MediaPublic | null` references, nullability included).
 * - `createSeedDb()` builds fresh object literals on every call, so each
 *   mock client instance owns an isolated, coherent copy of the state.
 * - NO Math.random anywhere: ids, dates, and copy are fixed literals.
 */

/* ------------------------------------------------------------------ */
/* Fixed actors                                                        */
/* ------------------------------------------------------------------ */

export const MOCK_ADMIN: AdminPublic = {
  id: "66666666-0000-4000-8000-000000000001",
  username: "admin",
  is_active: true,
  created_at: "2024-09-01T08:00:00Z",
  updated_at: "2026-08-01T08:00:00Z",
};

/** Placeholder served for mock media uploads (see mock/client.ts). */
export const MOCK_UPLOAD_URL = "/mock-media/upload.svg";

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

function media(
  seq: string,
  originalName: string,
  width: number | null,
  height: number | null,
  sizeBytes: number,
  createdAt: string,
): MediaAdmin {
  return {
    id: `11111111-0000-4000-8000-0000000000${seq}`,
    original_name: originalName,
    mime_type: "image/svg+xml",
    size_bytes: sizeBytes,
    width,
    height,
    url: `/mock-media/m${seq}.svg`,
    storage_key: `media/m${seq}.svg`,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function buildMedia(): MediaAdmin[] {
  return [
    media("01", "key-visual.svg", 1600, 900, 4821, "2024-09-10T08:00:00Z"),
    media("02", "robot-leg-platform.svg", 1200, 800, 4106, "2024-11-02T08:00:00Z"),
    media("03", "swarm-patrol.svg", 1200, 800, 4098, "2025-01-15T08:00:00Z"),
    media("04", "dexter-arm.svg", 1200, 800, 4132, "2025-03-08T08:00:00Z"),
    media("05", "campus-rover.svg", 1200, 800, 4117, "2025-05-20T08:00:00Z"),
    media("06", "hri-bench.svg", 1200, 800, 4124, "2025-07-01T08:00:00Z"),
    media("07", "tactile-skin.svg", 800, 800, 3542, "2025-09-12T08:00:00Z"),
    media("08", "certificate.svg", 1000, 1400, 4260, "2025-10-05T08:00:00Z"),
    media("09", "ceremony.svg", 1200, 800, 4189, "2025-12-18T08:00:00Z"),
    media("10", "lab-logo.svg", 800, 800, 3411, "2024-09-01T08:00:00Z"),
  ];
}

/** Admin media view -> embedded public view (contract shape). */
export function toPublicMedia(m: MediaAdmin): MediaPublic {
  return {
    id: m.id,
    original_name: m.original_name,
    mime_type: m.mime_type,
    size_bytes: m.size_bytes,
    width: m.width,
    height: m.height,
    url: m.url,
  };
}

/* ------------------------------------------------------------------ */
/* Seed builder                                                        */
/* ------------------------------------------------------------------ */

export interface MockDb {
  settings: SiteSettingsAdmin;
  researchAreas: ResearchAreaAdmin[];
  news: NewsAdmin[];
  projects: ProjectAdmin[];
  awards: AwardAdmin[];
  galleryItems: GalleryItemAdmin[];
  media: MediaAdmin[];
}

export function createSeedDb(): MockDb {
  const mediaList = buildMedia();
  const byName = new Map(mediaList.map((m) => [m.original_name, m]));
  const pick = (name: string): MediaAdmin => {
    const found = byName.get(name);
    if (!found) throw new Error(`mock fixture media missing: ${name}`);
    return found;
  };

  const logo = pick("lab-logo.svg");
  const keyVisual = pick("key-visual.svg");
  const legged = pick("robot-leg-platform.svg");
  const swarm = pick("swarm-patrol.svg");
  const arm = pick("dexter-arm.svg");
  const rover = pick("campus-rover.svg");
  const bench = pick("hri-bench.svg");
  const tactile = pick("tactile-skin.svg");
  const certificate = pick("certificate.svg");
  const ceremony = pick("ceremony.svg");

  const settings: SiteSettingsAdmin = {
    key: "default",
    site_title: "星航机器人实验室",
    lab_name: "星航机器人实验室",
    tagline: "构建可靠的机器人智能",
    description:
      "星航机器人实验室依托临江理工大学机械与智能工程学院，聚焦足式机器人、多智能体系统、具身感知与人机交互方向，致力于机器人基础研究与本科生创新实践平台建设。实验室现有研究人员 30 余人，配备动作捕捉、整机测试与多智能体仿真等实验条件。",
    contact_email: "xinghang.lab@lijiangtech.edu.cn",
    contact_phone: "+86-555-8600-1234",
    address: "临江理工大学 机械与智能工程学院 实验楼 4 层 405 室",
    hero_title: "以机器人智能，构筑未来",
    hero_subtitle:
      "足式机器人 · 多智能体协同 · 具身感知 —— 持续拓展机器系统的工程边界",
    lab_positioning: "面向真实场景的机器人智能研究与工程验证平台",
    founded_year: 2018,
    founding_background:
      "实验室由机械与智能工程学院于 2018 年发起，连接基础研究、工程试验与本科生科研训练。",
    core_platforms: ["动作捕捉系统", "整机测试场", "多智能体仿真平台"],
    paper_count: 28,
    patent_count: 11,
    active_project_count: 8,
    trained_student_count: 126,
    papers_url: "https://example.com/xinghang/publications",
    join_url: "https://example.com/xinghang/join",
    cooperation_url: "https://example.com/xinghang/cooperation",
    logo: toPublicMedia(logo),
    logo_media_id: logo.id,
    contact_qr_primary: null,
    contact_qr_secondary: null,
    contact_qr_primary_media_id: null,
    contact_qr_secondary_media_id: null,
    social_github: "https://github.com/xinghang-robotics",
    social_bilibili: "https://space.bilibili.com/xinghang-robotics",
    social_email: "xinghang.lab@lijiangtech.edu.cn",
    created_at: "2024-09-01T08:00:00Z",
    updated_at: "2026-08-20T09:30:00Z",
  };

  const researchAreas: ResearchAreaAdmin[] = [
    {
      id: "22222222-0000-4000-8000-000000000001",
      slug: "legged-robots",
      title: "足式机器人",
      description:
        "面向非结构化地形的动态运动规划与全身控制，研究四足平台的感知-决策-控制闭环，探索高机动跳跃、攀爬与负载行走能力。",
      problem_statement: "如何让足式机器人在未知地形中稳定感知、规划并完成动态运动？",
      application_scenarios: ["校园与园区复杂地形巡检", "野外越障与应急搜救"],
      representative_project_id: "44444444-0000-4000-8000-000000000001",
      representative_project: null,
      sort_order: 1,
      created_at: "2024-09-05T08:00:00Z",
      updated_at: "2026-03-10T08:00:00Z",
      is_visible: true,
    },
    {
      id: "22222222-0000-4000-8000-000000000002",
      slug: "multi-agent-systems",
      title: "多智能体系统",
      description:
        "分布式协同定位与建图、任务分配与编队控制，研究异构机器人群体在巡检、搜救等场景下的自组织协作机制。",
      problem_statement: "如何在通信受限与节点失效时保持机器人群体的协同与任务连续性？",
      application_scenarios: ["园区多机协同巡检", "灾害现场分布式搜救"],
      representative_project_id: "44444444-0000-4000-8000-000000000002",
      representative_project: null,
      sort_order: 2,
      created_at: "2024-09-05T08:00:00Z",
      updated_at: "2026-01-22T08:00:00Z",
      is_visible: true,
    },
    {
      id: "22222222-0000-4000-8000-000000000003",
      slug: "embodied-perception",
      title: "具身感知与操作",
      description:
        "多模态感知融合与视触协同的灵巧操作，研究机械臂在开放环境下的抓取、装配与工具使用能力。",
      problem_statement: "如何让机器人从视觉与触觉中形成可迁移的操作判断，并处理未见物体？",
      application_scenarios: ["柔性物体抓取与装配", "开放环境中的工具使用"],
      representative_project_id: "44444444-0000-4000-8000-000000000003",
      representative_project: null,
      sort_order: 3,
      created_at: "2024-09-05T08:00:00Z",
      updated_at: "2025-11-30T08:00:00Z",
      is_visible: true,
    },
    {
      id: "22222222-0000-4000-8000-000000000004",
      slug: "human-robot-interaction",
      title: "人机交互",
      description:
        "意图识别、安全合规控制与人机协同装配，研究人与机器人在共享工作空间中的自然协作与信任建立。",
      problem_statement: "如何在共享工作空间中兼顾协作效率、安全边界与人的自然意图？",
      application_scenarios: ["人机协同装配", "实验室与制造现场安全交互"],
      representative_project_id: null,
      representative_project: null,
      sort_order: 4,
      created_at: "2024-09-05T08:00:00Z",
      updated_at: "2025-10-18T08:00:00Z",
      is_visible: true,
    },
  ];

  const projects: ProjectAdmin[] = [
    {
      id: "44444444-0000-4000-8000-000000000001",
      slug: "xuanniao-legged-platform",
      title: "足式机器人平台“玄鸟”",
      summary:
        "自研四足机器人平台，支持复杂地形下的动态平衡与自主导航，是实验室足式方向的核心实验载体。",
      description:
        "“玄鸟”是实验室自研的第三代四足机器人平台，整机重量 32kg，负载能力 8kg。\n\n平台采用自研关节驱动与分布式控制架构，支持草地、碎石、楼梯等复杂地形的稳定行走，并集成了激光雷达与视觉融合导航模块。2026 年 3 月完成校园 5 公里越野测试。\n\n相关代码与硬件设计正逐步在实验室开源仓库发布。",
      cover: toPublicMedia(legged),
      cover_media_id: legged.id,
      demo_url: "https://example.com/xinghang/xuanniao-demo",
      sort_order: 1,
      published_at: "2026-03-12T02:00:00Z",
      created_at: "2025-04-02T08:00:00Z",
      updated_at: "2026-03-12T02:00:00Z",
      is_visible: true,
    },
    {
      id: "44444444-0000-4000-8000-000000000002",
      slug: "swarm-sentinel",
      title: "多智能体协同巡检系统",
      summary:
        "由 6 台地面机器人组成的协同巡检系统，实现分布式建图、任务动态分配与故障自恢复。",
      description:
        "系统面向园区巡检场景，由 6 台异构地面机器人组成。\n\n通过分布式协同 SLAM 与基于拍卖的任务分配算法，系统可在部分节点失效时自动重组任务，巡检覆盖率保持在 95% 以上。\n\n2025 年获中国机器人大赛二等奖，并在两个合作园区开展试点运行。",
      cover: toPublicMedia(swarm),
      cover_media_id: swarm.id,
      demo_url: "https://example.com/xinghang/swarm-demo",
      sort_order: 2,
      published_at: "2025-11-05T02:00:00Z",
      created_at: "2025-02-14T08:00:00Z",
      updated_at: "2025-11-05T02:00:00Z",
      is_visible: true,
    },
    {
      id: "44444444-0000-4000-8000-000000000003",
      slug: "dexter-arm-qiming",
      title: "具身感知操作臂“启明”",
      summary:
        "七自由度协作机械臂与视触融合灵巧手，研究开放环境下的抓取与精细装配。",
      description:
        "“启明”平台由七自由度协作机械臂与自研三指灵巧手组成。\n\n通过视觉-触觉融合的抓取策略学习，平台在未见物体类别上的抓取成功率达到 87%。\n\n该平台同时支撑本科生毕业设计课题两项。",
      cover: toPublicMedia(arm),
      cover_media_id: arm.id,
      demo_url: null,
      sort_order: 3,
      published_at: "2025-06-18T02:00:00Z",
      created_at: "2024-12-20T08:00:00Z",
      updated_at: "2025-06-18T02:00:00Z",
      is_visible: true,
    },
    {
      id: "44444444-0000-4000-8000-000000000004",
      slug: "campus-rover-sentinel",
      title: "校园自主巡检车",
      summary:
        "面向校园安防的轮式巡检平台，具备全天候自主导航与异常事件上报能力。",
      description:
        "巡检车采用轮式底盘与固态激光雷达，支持雨雪天气下的全天候运行。\n\n系统接入校园物联网平台，可自动上报路灯故障、积水等异常事件，已在校园西区累计运行超过 800 小时。",
      cover: toPublicMedia(rover),
      cover_media_id: rover.id,
      demo_url: null,
      sort_order: 4,
      published_at: "2024-12-02T02:00:00Z",
      created_at: "2024-10-08T08:00:00Z",
      updated_at: "2024-12-02T02:00:00Z",
      is_visible: true,
    },
    {
      id: "44444444-0000-4000-8000-000000000005",
      slug: "hri-workbench",
      title: "人机协同实验台",
      summary:
        "共享工作空间下的人机协同装配实验平台（草稿：内容补充中）。",
      description:
        "实验台由协作机械臂、深度相机与力觉传感工作台组成，用于研究共享工作空间中的安全交互与协同装配。\n\n页面内容整理中，暂不对外发布。",
      cover: toPublicMedia(bench),
      cover_media_id: bench.id,
      demo_url: null,
      sort_order: 5,
      published_at: null,
      created_at: "2025-08-25T08:00:00Z",
      updated_at: "2026-05-14T08:00:00Z",
      is_visible: false,
    },
    {
      id: "44444444-0000-4000-8000-000000000006",
      slug: "tactile-skin-array",
      title: "柔性触觉传感阵列",
      summary:
        "高密度柔性触觉传感阵列与指端集成方案（草稿：待发布）。",
      description:
        "自研柔性触觉传感阵列空间分辨率 1.2mm，支持法向力与剪切力同步测量，已集成于“启明”灵巧手指端。\n\n论文撰写中，项目页面暂不对外发布。",
      cover: toPublicMedia(tactile),
      cover_media_id: tactile.id,
      demo_url: null,
      sort_order: 6,
      published_at: null,
      created_at: "2025-10-11T08:00:00Z",
      updated_at: "2026-06-30T08:00:00Z",
      is_visible: false,
    },
  ];

  const projectById = new Map(projects.map((project) => [project.id, project]));
  for (const area of researchAreas) {
    const project = area.representative_project_id
      ? projectById.get(area.representative_project_id)
      : undefined;
    area.representative_project = project
      ? {
          id: project.id,
          slug: project.slug,
          title: project.title,
          summary: project.summary,
          cover: project.cover,
          demo_url: project.demo_url,
        }
      : null;
  }

  const awards: AwardAdmin[] = [
    {
      id: "55555555-0000-4000-8000-000000000001",
      title: "四足机器人野外挑战赛 一等奖",
      category: "competition",
      level: "national",
      issuer: "中国机器人产业联盟",
      competition_name: "中国机器人暨技能大赛",
      description:
        "“玄鸟”平台在野外越障科目中以全场最快成绩夺冠，综合评分位列 48 支参赛队伍之首。",
      award_date: "2026-05-18",
      year: 2026,
      certificate_media_id: certificate.id,
      cover_media_id: ceremony.id,
      certificate: toPublicMedia(certificate),
      cover: toPublicMedia(ceremony),
      sort_order: 1,
      is_featured: true,
      created_at: "2026-05-20T08:00:00Z",
      updated_at: "2026-05-20T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000002",
      title: "全国大学生机器人大赛 一等奖",
      category: "competition",
      level: "national",
      issuer: "全国大学生机器人大赛组委会",
      competition_name: "全国大学生机器人大赛",
      description:
        "多智能体协同巡检系统在总决赛对抗赛中全胜出线，获全国一等奖与最佳技术创新奖。",
      award_date: "2025-11-22",
      year: 2025,
      certificate_media_id: null,
      cover_media_id: ceremony.id,
      certificate: null,
      cover: toPublicMedia(ceremony),
      sort_order: 2,
      is_featured: true,
      created_at: "2025-11-25T08:00:00Z",
      updated_at: "2025-11-25T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000003",
      title: "省机器人创新大赛 最佳项目奖",
      category: "research",
      level: "provincial",
      issuer: "省科学技术协会",
      competition_name: "省机器人创新大赛",
      description:
        "视触融合灵巧操作项目从 120 个科研项目中脱颖而出，获评最佳项目奖。",
      award_date: "2025-07-10",
      year: 2025,
      certificate_media_id: certificate.id,
      cover_media_id: null,
      certificate: toPublicMedia(certificate),
      cover: null,
      sort_order: 3,
      is_featured: true,
      created_at: "2025-07-12T08:00:00Z",
      updated_at: "2025-07-12T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000004",
      title: "全国大学生创新训练计划 优秀项目",
      category: "innovation",
      level: "national",
      issuer: "教育部高等教育司",
      competition_name: "全国大学生创新训练计划年会",
      description:
        "校园自主巡检车项目获评国家级优秀结题项目，并入选年会现场展示。",
      award_date: "2024-10-15",
      year: 2024,
      certificate_media_id: certificate.id,
      cover_media_id: null,
      certificate: toPublicMedia(certificate),
      cover: null,
      sort_order: 4,
      is_featured: false,
      created_at: "2024-10-20T08:00:00Z",
      updated_at: "2024-10-20T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000005",
      title: "市机器人挑战赛 二等奖",
      category: "competition",
      level: "municipal",
      issuer: "市科学技术局",
      competition_name: "市智能机器人挑战赛",
      description: "实验室本科生梯队首次参赛即获二等奖。",
      award_date: "2024-05-26",
      year: 2024,
      certificate_media_id: null,
      cover_media_id: null,
      certificate: null,
      cover: null,
      sort_order: 5,
      is_featured: false,
      created_at: "2024-05-28T08:00:00Z",
      updated_at: "2024-05-28T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000006",
      title: "校园十大学生创新团队",
      category: "honor",
      level: "university",
      issuer: "临江理工大学",
      competition_name: "校园创新之星评选",
      description: "实验室学生团队获评年度校园十大学生创新团队。",
      award_date: "2023-12-08",
      year: 2023,
      certificate_media_id: null,
      cover_media_id: null,
      certificate: null,
      cover: null,
      sort_order: 6,
      is_featured: false,
      created_at: "2023-12-10T08:00:00Z",
      updated_at: "2023-12-10T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000007",
      title: "开源硬件峰会 优秀展示项目",
      category: "other",
      level: "other",
      issuer: "开源硬件联盟",
      competition_name: "开源硬件峰会",
      description: "关节驱动器开源设计获峰会优秀展示项目。",
      award_date: "2022-09-30",
      year: 2022,
      certificate_media_id: null,
      cover_media_id: null,
      certificate: null,
      cover: null,
      sort_order: 7,
      is_featured: false,
      created_at: "2022-10-08T08:00:00Z",
      updated_at: "2022-10-08T08:00:00Z",
      is_visible: true,
    },
    {
      id: "55555555-0000-4000-8000-000000000008",
      title: "校内机器人竞技赛 三等奖",
      category: "competition",
      level: "university",
      issuer: "机械与智能工程学院",
      competition_name: "校内机器人竞技赛",
      description: "面向新生的校内选拔赛成绩记录（暂不在官网展示）。",
      award_date: "2022-06-15",
      year: 2022,
      certificate_media_id: null,
      cover_media_id: null,
      certificate: null,
      cover: null,
      sort_order: 8,
      is_featured: false,
      created_at: "2022-06-20T08:00:00Z",
      updated_at: "2022-06-20T08:00:00Z",
      is_visible: false,
    },
  ];

  const galleryItems: GalleryItemAdmin[] = [
    {
      id: keyVisual.id,
      title: "实验室视觉档案",
      description: "实验室年度招新与研究展示的视觉记录。",
      media: toPublicMedia(keyVisual),
      media_id: keyVisual.id,
      sort_order: 1,
      is_visible: true,
      created_at: "2025-09-15T08:00:00Z",
      updated_at: "2026-02-12T08:00:00Z",
    },
    {
      id: tactile.id,
      title: "具身感知实验记录",
      description: "视触融合操作平台的阶段性实验影像。",
      media: toPublicMedia(tactile),
      media_id: tactile.id,
      sort_order: 2,
      is_visible: true,
      created_at: "2025-09-18T08:00:00Z",
      updated_at: "2025-12-20T08:00:00Z",
    },
  ];

  const news: NewsAdmin[] = [
    {
      id: "33333333-0000-4000-8000-000000000001",
      slug: "crc-2026-first-prize",
      title: "实验室团队在中国机器人大赛中斩获一等奖",
      excerpt:
        "“玄鸟”四足平台在四足机器人野外挑战赛中以全场最快成绩夺得一等奖。",
      content:
        "5 月 18 日，中国机器人暨技能大赛四足机器人野外挑战赛落幕。实验室“玄鸟”团队在 48 支参赛队伍中以综合评分第一的成绩夺得一等奖。\n\n本次赛事设置了碎石坡、独木桥与负重运输三个科目。“玄鸟”平台在全部科目中零人工干预完赛，其中负重运输科目领先第二名 47 秒。\n\n参赛队员由 6 名本科生与 2 名研究生组成，指导教师获优秀指导教师奖。",
      cover: toPublicMedia(ceremony),
      cover_media_id: ceremony.id,
      published_at: "2026-05-20T02:00:00Z",
      created_at: "2026-05-19T10:00:00Z",
      updated_at: "2026-05-20T02:00:00Z",
      sort_order: 1,
      is_visible: true,
    },
    {
      id: "33333333-0000-4000-8000-000000000002",
      slug: "xuanniao-campus-run",
      title: "“玄鸟”足式机器人完成校园越野测试",
      excerpt:
        "四足平台“玄鸟”完成 5 公里校园越野测试，全程零人工干预。",
      content:
        "3 月 12 日，实验室自研四足机器人平台“玄鸟”完成校园 5 公里越野测试。\n\n测试路线涵盖沥青路、草地、台阶与碎石路四种地形，全程零人工干预，平均行进速度 1.4m/s。\n\n本次测试验证了新版全身控制器在地形切换时的稳定性，为后续野外场景应用打下基础。",
      cover: toPublicMedia(legged),
      cover_media_id: legged.id,
      published_at: "2026-03-14T02:00:00Z",
      created_at: "2026-03-13T09:00:00Z",
      updated_at: "2026-03-14T02:00:00Z",
      sort_order: 2,
      is_visible: true,
    },
    {
      id: "33333333-0000-4000-8000-000000000003",
      slug: "multi-agent-paper-accepted",
      title: "多智能体协同论文被国际会议录用",
      excerpt:
        "关于分布式协同建图的论文被 IEEE 机器人领域国际会议录用。",
      content:
        "实验室多智能体方向的最新论文《通信受限下的分布式协同建图》被 IEEE 机器人领域国际会议录用。\n\n论文提出了一种基于事件触发的通信调度机制，在带宽下降 60% 的条件下仍保持建图精度。\n\n该工作由实验室研究生与本科生合作完成，将在会议上作口头报告。",
      cover: toPublicMedia(swarm),
      cover_media_id: swarm.id,
      published_at: "2025-11-08T02:00:00Z",
      created_at: "2025-11-06T08:00:00Z",
      updated_at: "2025-11-08T02:00:00Z",
      sort_order: 3,
      is_visible: true,
    },
    {
      id: "33333333-0000-4000-8000-000000000004",
      slug: "new-lab-opening",
      title: "实验室新实验空间正式启用",
      excerpt:
        "800 平方米整机测试区投入使用，配备动作捕捉与多机协同测试环境。",
      content:
        "经过一年建设，实验室位于实验楼四层的新实验空间正式启用。\n\n新空间包括整机测试区、多智能体协同测试区与人机交互实验区，配备光学动作捕捉系统与安全防护设施。\n\n实验室将于下学期面向本科生开放预约参观。",
      cover: toPublicMedia(keyVisual),
      cover_media_id: keyVisual.id,
      published_at: "2025-06-30T02:00:00Z",
      created_at: "2025-06-28T08:00:00Z",
      updated_at: "2025-06-30T02:00:00Z",
      sort_order: 4,
      is_visible: true,
    },
    {
      id: "33333333-0000-4000-8000-000000000005",
      slug: "summer-camp-2026",
      title: "2026 暑期机器人训练营报名启动（草稿）",
      excerpt: "面向全校本科生的暑期训练营报名即将开始。",
      content:
        "2026 暑期机器人训练营将于 7 月中旬开营，为期四周，涵盖足式机器人、多智能体与视觉感知三个方向。\n\n报名通知待教务处审批后发布。",
      cover: null,
      cover_media_id: null,
      published_at: null,
      created_at: "2026-06-15T08:00:00Z",
      updated_at: "2026-06-15T08:00:00Z",
      sort_order: 5,
      is_visible: false,
    },
    {
      id: "33333333-0000-4000-8000-000000000006",
      slug: "industry-joint-lab",
      title: "实验室与合作企业签署联合创新实验室协议（草稿）",
      excerpt: "联合创新实验室协议签署仪式举行。",
      content:
        "实验室与本地机器人企业签署联合创新实验室共建协议，将在关节驱动与触觉传感方向开展联合攻关。\n\n新闻稿待宣传部门审核后发布。",
      cover: null,
      cover_media_id: null,
      published_at: null,
      created_at: "2026-07-22T08:00:00Z",
      updated_at: "2026-07-22T08:00:00Z",
      sort_order: 6,
      is_visible: false,
    },
  ];

  return {
    settings,
    researchAreas,
    news,
    projects,
    awards,
    galleryItems,
    media: mediaList,
  };
}
