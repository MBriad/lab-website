# 东莞理工学院机器人创新实验室

这是一个面向大学机器人实验室的宣传网站与内容管理系统，包含公开官网、管理员后台、FastAPI CMS 接口和 PostgreSQL 数据库。网站以机器人研发、竞赛成果和实验室动态为核心内容，提供沉浸式首页、研究方向、项目、荣誉、新闻和影像记录页面。

![机器人实验室标志](public/robotlab/robotlab-wordmark.png)

## 界面与内容预览

首页和详情页通过统一的数据层读取 CMS 内容；影像记录页支持横向浏览和分页归档。仓库内已保留一组脱敏后的媒体快照，克隆后即可看到与当前项目一致的基础内容。

| 竞赛现场 | 荣誉证书 | 实验室成果 |
| --- | --- | --- |
| ![竞赛现场](backend/data/media/3961/2541b3d6dbd95b8d502d9c409b2f8d49.jpg) | ![荣誉证书](backend/data/media/20d5/a2db93b2c2da69c2fe81a176be578125.jpg) | ![实验室成果](backend/data/media/404b/7454901809aaa4a2446c1e4330e33ad8.jpg) |

## 主要功能

- 官网：`/`、`/research`、`/projects`、`/awards`、`/news`、`/gallery`
- 管理后台：`/admin/login`、`/admin`、新闻、项目、研究方向、荣誉、影像记录、素材库和网站设置
- 荣誉和影像记录支持媒体关联、排序、显示/隐藏和首页精选数量配置
- 首页精选荣誉与影像记录数量可在后台分别设置，范围为 1–20 条
- 图片通过素材库上传和复用，内容记录只保存媒体 ID，不直接保存文件
- OpenAPI 契约位于 [`contracts/openapi.json`](contracts/openapi.json)，是前后端唯一正式接口约定

## 技术栈

- Next.js 16、React 19、TypeScript
- Tailwind CSS 4
- FastAPI、SQLAlchemy 2、Alembic
- PostgreSQL（部署）/ SQLite（本地测试）
- Docker Compose：前端、后端、数据库分别运行在私有网络中
- pnpm、Vitest、Pytest

## 本地运行前端

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

默认实时模式需要后端服务运行。如果只进行前端视觉开发，可以在 `.env.local` 中显式设置：

```dotenv
NEXT_PUBLIC_API_MODE=mock
```

Mock 模式使用确定性测试数据；管理员登录账号为 `admin`，密码为 `admin123`。需要验证后台修改同步到官网时，请使用实时 API 模式。

## 本地运行后端

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:DATABASE_URL = "sqlite:///./backend/data/cms.local.db"
alembic -c backend/alembic.ini upgrade head
python backend/scripts/create_admin.py admin "use-a-local-password"
uvicorn app.main:app --app-dir backend --reload
```

后端公开接口统一位于 `/api/v1`，管理接口位于 `/api/v1/admin`，具体请求和响应以 OpenAPI 契约为准。

## Docker 部署

从仓库根目录执行：

```powershell
Copy-Item infra/.env.example infra/.env
# 编辑 infra/.env，替换密钥和数据库密码
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build -d
```

浏览器访问 `http://localhost:3000`，或使用主机的局域网地址和 `FRONTEND_PORT`。三个容器分别为：

| 服务 | 容器端口 | 说明 |
| --- | ---: | --- |
| `frontend` | 3000 | 官网和后台，代理 `/api/v1` |
| `backend` | 8000 | FastAPI CMS，不默认暴露主机端口 |
| `postgres` | 5432 | PostgreSQL，仅在 Docker 私有网络中可访问 |

数据库和上传媒体分别使用 Docker volume 持久化。停止服务时不要使用 `down -v`，除非确定要删除数据卷：

```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml ps
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f frontend backend
docker compose --env-file infra/.env -f infra/docker-compose.yml down
```

## 质量检查

前端：

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm audit:contract
pnpm build
```

后端：

```powershell
python backend/scripts/check_contract.py
python -m pytest backend/tests
```

## 目录说明

- `src/`：Next.js 官网、后台和组件
- `backend/app/`：FastAPI、模型、服务和 API 路由
- `backend/alembic/`：数据库迁移
- `backend/data/media/`：随仓库提供的脱敏媒体快照
- `contracts/`：OpenAPI API Contract
- `infra/`：Docker Compose、镜像和启动脚本
- `public/`：网站标志、工具图标和 Mock 图片

## 许可与内容说明

仓库中的媒体快照仅用于本项目展示和部署初始化。生产环境请通过后台素材库替换或补充实际媒体，并妥善配置管理员密码、`SECRET_KEY` 和数据库密码。不要提交 `.env`、访问令牌或其他敏感信息。
