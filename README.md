# TeamAlign AI · 协齐 AI 项目协作助手

> A bilingual AI project management and collaboration assistant for internet and e-commerce teams.<br>
> 面向互联网、电商团队的中英双语 AI 项目管理与协作助手。

### [🚀 Live Demo · 在线体验]()

TeamAlign AI turns meeting recordings and written notes into an actionable project workspace. It combines meeting transcription, Agnes-powered structured analysis, role-based task planning, risk alerts, and report generation in one responsive web application.

TeamAlign AI 将会议录音与文字纪要转化为可执行的项目工作台，整合语音转写、基于 Agnes 的结构化分析、按岗位拆分任务、风险预警与项目汇报生成，适用于中小团队的日常协作。

## Highlights · 功能亮点

- **Meeting intelligence · 会议智能解析** — Paste notes or upload MP3, M4A, WAV, and WEBM recordings; transcribe with a local whisper.cpp service or a compatible cloud transcription API.<br>
  粘贴会议纪要或上传 MP3、M4A、WAV、WEBM 录音；可使用本地 whisper.cpp 或兼容的云端转写接口。
- **Role-based task planning · 按岗位拆分任务** — Convert meeting decisions into actionable tasks with roles, owners, priority, estimates, deadlines, status, and progress.<br>
  将会议结论拆解为包含岗位、负责人、优先级、预计工时、截止时间、状态与进度的可执行任务。
- **Risk insights · 项目风险洞察** — Detect schedule, resource, dependency, scope, and quality risks, then retain read, mitigated, and reopened states.<br>
  识别工期、资源、依赖、范围与质量风险，并支持已读、缓解和重新打开等处理状态。
- **Report center · 智能汇报中心** — Generate internal retrospective reports and client progress briefs, preview them in the browser, and download matching DOCX files.<br>
  一键生成团队复盘与客户进展简报，在网页中预览并下载同内容的 DOCX 文件。
- **Multi-project workspace · 多项目工作空间** — Keep meeting materials, tasks, risks, members, and reports isolated by project while switching projects without losing context.<br>
  按项目独立保存会议素材、任务、风险、成员与报告；切换项目时保留当前操作上下文。
- **Bilingual experience · 中英双语体验** — Use a Chinese-first interface with instant English switching and language-aware report generation.<br>
  以中文界面为主，支持即时切换英文，并按语言生成对应报告。
- **Privacy-aware · 隐私保护** — API keys, local ASR assets, browser runtime data, and build caches are excluded from Git by default.<br>
  API 密钥、本地 ASR 资源、浏览器运行时数据和构建缓存默认不会提交到 Git。

## Architecture · 项目架构

```text
Browser UI
   │
   ├── Meeting notes / audio upload / project interactions
   ▼
Next.js + vinext application
   ├── localStorage + IndexedDB workspace persistence
   ├── local whisper.cpp or cloud transcription API
   ├── Agnes OpenAI-compatible structured analysis
   └── report preview + DOCX generation
```

## Project Structure · 项目结构

```text
teamalign-ai-demo/
├── app/
│   ├── api/
│   │   ├── analyze/           # Meeting transcription and AI analysis / 转写与 AI 解析
│   │   ├── health/            # Service configuration health check / 服务配置检查
│   │   └── report/            # Report preview and DOCX export / 报告与 DOCX 导出
│   ├── globals.css            # Responsive UI styles / 响应式界面样式
│   └── page.tsx               # Main workspace / 主工作台
├── lib/
│   ├── browser-assets.ts      # IndexedDB audio and file helpers / 浏览器文件持久化
│   ├── openai.ts              # Agnes/OpenAI-compatible client / AI 客户端
│   ├── teamalign.ts           # Shared domain models / 项目领域模型
│   └── workspaces.ts          # Isolated project workspaces / 项目工作空间
├── scripts/                   # Local whisper.cpp launch scripts / 本地 ASR 启动脚本
├── test/                      # Upload-ready sample audio / 可上传的测试音频
├── tests/                     # Automated validation / 自动化测试
├── .env.example               # Safe configuration template / 安全配置模板
├── package.json
└── README.md
```

## Requirements · 环境要求

- Node.js `>= 22.13.0`
- npm
- An Agnes API key or OpenAI-compatible API key / Agnes API 密钥或兼容 OpenAI 协议的 API 密钥
- Optional: a local whisper.cpp service for free local transcription / 可选：用于免费本地转写的 whisper.cpp 服务

## Configuration · 环境配置

Create the local environment file:

创建本地环境配置文件：

```bash
cp .env.example .env.local
```

Then add your Agnes configuration to `.env.local`:

然后在 `.env.local` 中填写 Agnes 配置：

```dotenv
AI_PROVIDER=agnes
AGNES_API_KEY=your_agnes_api_key
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_TEXT_MODEL=agnes-2.0-flash
```

Never commit `.env.local`. It is already protected by `.gitignore`.

请勿提交 `.env.local`，该文件已被 `.gitignore` 排除。

## Quick Start · 快速启动

### 1. Install dependencies · 安装依赖

```bash
npm install
```

### 2. Configure environment variables · 配置环境变量

```bash
cp .env.example .env.local
```

Complete the required AI provider settings in `.env.local`.

在 `.env.local` 中完成所选 AI 服务的必填配置。

### 3. Start the web application · 启动网页应用

```bash
npm run dev
```

Open the URL shown in the terminal, normally `http://localhost:3000`.

在浏览器中打开终端显示的地址，通常为 `http://localhost:3000`。

### 4. Optional: start local transcription · 可选：启动本地语音转写

After placing `whisper-server` and the selected Whisper model under `.local/whisper.cpp`, run:

将 `whisper-server` 和选用的 Whisper 模型准备到 `.local/whisper.cpp` 后，运行：

```bash
npm run asr
```

To start the local ASR service and web application together:

同时启动本地 ASR 服务和网页应用：

```bash
npm run dev:full
```

> Agnes is used for structured text analysis in this project. It is not used as the transcription provider.<br>
> 本项目中的 Agnes 用于会议文本的结构化分析，不承担语音转写。

## Sample Audio · 测试音频

Two MP3 fixtures are ready to upload from the meeting analysis screen:

项目提供两段可直接在会议解析页面上传的 MP3 测试素材：

- [`teamalign-project-meeting-zh.mp3`](./test/teamalign-project-meeting-zh.mp3) — Chinese meeting sample / 中文会议示例
- [`teamalign-project-meeting-en.mp3`](./test/teamalign-project-meeting-en.mp3) — English meeting sample / 英文会议示例

Read the matching transcripts in [`test/README.md`](./test/README.md).

对应原文请查看 [`test/README.md`](./test/README.md)。

## Commands · 常用命令

| Command | Description / 说明 |
|---|---|
| `npm run dev` | Start the local web development server / 启动本地网页开发服务 |
| `npm run asr` | Start local whisper.cpp transcription / 启动本地 whisper.cpp 转写服务 |
| `npm run dev:full` | Start ASR and the web application together / 同时启动转写与网页服务 |
| `npm run build` | Create a production build / 构建生产版本 |
| `npm test` | Build and run automated tests / 构建并运行自动化测试 |
| `npm run lint` | Run ESLint / 运行 ESLint |
| `npm run start` | Start the production build / 启动生产构建 |

## Deployment · 部署说明

**Production URL · 线上地址:**

The project produces a Cloudflare Workers-compatible build:

项目可生成兼容 Cloudflare Workers 的构建产物：

```bash
npm run build
```

Before deployment, configure the production environment variables in your hosting platform. Do not upload `.env.local`.

部署前请在托管平台配置生产环境变量，不要上传 `.env.local`。

For a production-ready multi-user setup, replace browser-local persistence with a database and object storage, then add authentication and workspace authorization.

如需生产级多成员协作，请将浏览器本地数据迁移至数据库与对象存储，并补充登录认证和工作空间权限控制。

> **Transcription note / 转写说明:** A local service at `127.0.0.1:8080` cannot be accessed by an online deployment. Use a public Whisper service or a cloud transcription API for uploaded recordings in production.<br>
> 本地 `127.0.0.1:8080` 服务无法被线上部署访问。生产环境请使用公网 Whisper 服务或云端转写 API。

## API Reference · 接口说明

| Method | Endpoint | Description / 说明 |
|---|---|---|
| `GET` | `/api/health` | Check AI and ASR configuration / 检查 AI 与 ASR 配置状态 |
| `POST` | `/api/analyze` | Transcribe and analyze meeting content / 转写并分析会议内容 |
| `POST` | `/api/report` | Generate report previews and DOCX files / 生成报告预览与 DOCX 文件 |

## Security Notes · 安全说明

- Keep API keys in `.env.local` or your hosting platform's secret manager only. / API 密钥仅保存在 `.env.local` 或部署平台的密钥管理中。
- `.env.local`, `.local/`, build output, and local Wrangler state are excluded from Git. / `.env.local`、`.local/`、构建产物和本地 Wrangler 状态已被 Git 排除。
- Revoke and rotate any key that has ever been exposed. / 若密钥曾被公开，请立即撤销并重新生成。
- Review meeting content before sending it to an external AI or transcription provider. / 向外部 AI 或转写服务发送会议内容前，请确认内容允许被处理。

## Copyright · 版权声明

Copyright © 2026 Ruiying (Rain) Liu. **All Rights Reserved.**

This project is publicly available for viewing and evaluation only. No permission is granted to copy, modify, distribute, sublicense, sell, commercially use, or create derivative works without prior written permission from the copyright holder. This repository is **not open-source software**.

版权所有 © 2026 Ruiying (Rain) Liu。**保留所有权利。**

本项目仅供公开查看与评估。未经版权所有者事先书面许可，不得复制、修改、分发、再许可、出售、商业使用或创作衍生作品。本仓库**不属于开源软件**。
