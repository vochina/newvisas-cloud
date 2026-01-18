# NewVisas Cloud - 现代化的移民签证服务平台

本项目是 `newvisas-asp` (Classic ASP + SQL Server) 的完全现代化重构版，迁移至 Cloudflare 全家桶 (Workers + D1 + R2) 架构，旨在提供更高性能、更易维护的服务。

---

## 🏗️ 架构与技术栈

| 类别 | 技术选型 |
|------|----------|
| **运行时** | [Cloudflare Workers](https://workers.cloudflare.com/) |
| **框架** | [Hono](https://hono.dev/) (高性能 Web 框架) |
| **语言** | [TypeScript](https://www.typescriptlang.org/) |
| **数据库** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **文件存储** | [Cloudflare R2](https://developers.cloudflare.com/r2/) (对象存储) |
| **渲染方式** | Hono JSX (服务端渲染 SSR) |
| **认证管理** | JWT (JSON Web Token) + HTTP-only Cookie |

---

## 📁 项目结构

```
newvisas-cloud/
├── src/
│   ├── index.tsx             # 应用主入口，路由分发
│   ├── routes/               # 路由模块
│   │   ├── public.tsx        # 前台展示页面 (首页, 项目, 新闻, 团队等)
│   │   ├── admin.tsx         # 后台管理系统 (认证, 内容管理)
│   │   ├── storage.ts        # R2 资源访问路由
│   │   └── upload.ts         # 文件上传路由
│   ├── db/
│   │   ├── schema.ts         # Drizzle 数据库 Schema 定义
│   │   └── client.ts         # 数据库客户端初始化
│   ├── components/           # Hono JSX 公共组件 (Layout, Pagination等)
│   ├── middleware/           # 中间件 (DB绑定, 认证鉴权)
│   ├── validations/          # Zod 数据表单验证
│   └── types/                # TypeScript 类型定义
├── static/                   # 静态资源 (CSS, JS, 图像)
├── drizzle/                  # 自动生成的数据库迁移文件
├── wrangler.jsonc            # Cloudflare 环境配置
├── drizzle.config.ts         # Drizzle 配置文件
└── package.json              # 项目依赖与脚本
```

---

## 🚀 快速开始

### 1. 安装依赖

推荐使用 `pnpm` 安装环境依赖：

```bash
pnpm install
```

### 2. 数据库配置

项目基于 Drizzle ORM，首先需要生成并应用本地迁移：

```bash
# 生成迁移文件
pnpm db:generate

# 应用迁移到本地开发数据库 (.wrangler/)
pnpm db:migrate:local
```

### 3. 本地开发

启动本地开发服务器，Wrangler 会模拟 Cloudflare Workers 环境（包括 D1 和 R2）：

```bash
pnpm dev
```

---

## 🚢 部署与 CI/CD

### 本地部署

通过 Wrangler 将项目手动部署至生产环境：

```bash
pnpm deploy
```

### GitHub Actions 自动部署

本项目已预配置 GitHub Actions 工作流，当代码推送至 `main` 分支时将自动触发部署。

**配置步骤：**

1. 在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN`: 您的 Cloudflare API 令牌（需具备 Workers 部署权限）。
2. 推送代码至 `main` 分支即可触发部署。

工作流定义文件位于：[.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml)

---

## 🛠️ 主要模块说明

### 前台功能 (`src/routes/public.tsx`)
- **首页**: 动态幻灯片、展示热门移民项目及最新资讯。
- **移民项目**: 按国家/地区展示，支持多维度过滤。
- **新闻资讯**: 行业动态与政策解读。
- **专家团队**: 资深顾问风采展示。
- **评估表单**: 在线移民意向收集与提交。

### 后台管理 (`src/routes/admin.tsx`)
- **内容管理**: 所有的项目、新闻、案例、团队成员的 CRUD 操作。
- **资源中心**: 集成文件上传功能，自动同步至 Cloudflare R2。
- **数据统计**: 移民评估申请记录查看与管理。

---

## 🧪 开发脚本

- `pnpm dev`: 启动本地开发环境。
- `pnpm deploy`: 部署生产环境。
- `pnpm db:generate`: 根据 `schema.ts` 生成 SQL 迁移。
- `pnpm db:migrate`: 同步生产环境 D1 数据库同步。
- `pnpm db:migrate:local`: 同步本地开发 D1 数据库同步。
- `pnpm db:studio`: 启动编辑器查看/修改本地数据。

---

## ⚠️ 迁移注意事项

1. **静态资源**: 原项目的 `attached` 和 `image` 目录已整体迁移至 R2 存储桶。
2. **SEO**: 所有页面均实现了服务端渲染 (SSR)，完全保留了原项目的 SEO 友好特性。
3. **安全**: 后台采用 JWT 认证，密码通过 Web Crypto API 进行加盐哈希存储。

---

## 📄 许可证

本项目基于原始 `newvisas-asp` 升级重构，版权归属于 重庆鑫嘉园出入境服务有限公司。

*最后更新: 2026-01-18*
