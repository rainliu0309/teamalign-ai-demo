# TeamAlign AI · 协齐 AI 项目协作助手

> 面向互联网、电商中小团队的轻量化 B2B AI 项目管理与协作助手。<br />
> A lightweight B2B AI project management and collaboration assistant for internet and e-commerce teams.

[中文说明](#中文说明) · [English](#english)

---

## 中文说明

### 产品简介

TeamAlign AI（协齐 AI 项目协作助手）可以将会议录音或文字纪要转换为可执行的项目计划，自动完成任务拆解、岗位分配、风险识别和项目汇报。

产品聚焦以下团队协作痛点：

- 跨产品、研发、测试、运营团队的信息不同步；
- 会后依赖人工整理任务、负责人、工期和风险；
- 项目周报与客户汇报重复编写、效率较低；
- 多项目并行时容易出现资源冲突和交付风险。

### 核心功能

1. **会议智能解析**
   - 粘贴会议纪要或上传 MP3、M4A、WAV、WEBM 录音；
   - 支持本地 whisper.cpp 语音转文字；
   - AI 自动提炼会议摘要、关键决策和参与岗位。

2. **智能任务**
   - 按岗位自动拆解可执行任务；
   - 识别负责人、优先级、预计工时和截止时间；
   - 支持任务新增、编辑、删除和状态流转；
   - 响应式看板在中等屏幕显示两列、窄屏显示单列，无横向滚动。

3. **风险洞察**
   - 自动识别工期、资源、依赖、范围和质量风险；
   - 展示关联任务、风险原因与 AI 处理建议；
   - 支持风险已读、缓解和重新打开。

4. **汇报中心**
   - 一键生成团队内部复盘周报；
   - 一键生成客户进展简报；
   - 页面预览与下载的 DOCX 使用同一份 AI 生成内容；
   - 中英文报告独立管理，避免下载错误语言版本。

5. **多项目工作空间**
   - 每个项目独立保存会议、音频、任务、风险、成员和报告；
   - 项目切换保留当前功能页面；
   - 异步 AI 结果绑定项目 ID 和数据版本，避免切换期间串数据；
   - 支持创建新的独立项目空间。

6. **中英文界面**
   - 中文为主、英文为辅；
   - 支持界面即时切换；
   - 项目数据和报告语言分别管理。

### AI 工作流

```text
会议录音 / 文字纪要
        ↓
语音转写（本地 whisper.cpp 或云端转写 API）
        ↓
大模型结构化分析（Agnes / OpenAI 兼容接口）
        ↓
会议摘要 + 关键决策 + 岗位任务 + 项目风险
        ↓
团队复盘周报 / 客户进展简报
        ↓
DOCX 预览与下载
```

### 技术栈

- Next.js 16 + React 19
- TypeScript
- vinext + Vite
- Tailwind CSS 4
- OpenAI-compatible SDK
- Agnes AI 文本分析
- whisper.cpp 本地语音转写
- docx 文档生成
- IndexedDB：音频与 DOCX Blob
- localStorage：项目结构化状态
- Cloudflare Workers 兼容构建

### 环境要求

- Node.js `>= 22.13.0`
- npm
- Agnes API Key 或 OpenAI API Key
- 可选：本地 whisper.cpp 服务

### 本地启动

```bash
git clone <your-repository-url>
cd teamalign-ai
npm install
cp .env.example .env.local
```

在 `.env.local` 中至少配置一种文本分析服务：

```bash
AI_PROVIDER=agnes
AGNES_API_KEY=your-agnes-api-key
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_TEXT_MODEL=agnes-2.0-flash
```

启动网页：

```bash
npm run dev
```

浏览器访问终端显示的地址，通常为：

```text
http://localhost:3000
```

如果端口被占用，开发服务器会自动选择其他端口。

### 录音转写

#### 方案一：本地 whisper.cpp

本地 ASR 适合开发和演示，录音不会发送到第三方转写服务。

准备好 `.local/whisper.cpp`、`whisper-server` 和
`ggml-small-q5_1.bin` 后运行：

```bash
npm run asr
```

分别启动 ASR 与网页：

```bash
npm run asr
npm run dev
```

或者同时启动：

```bash
npm run dev:full
```

默认配置：

```bash
LOCAL_ASR_ENABLED=true
LOCAL_ASR_URL=http://127.0.0.1:8080
LOCAL_ASR_MODEL=small-q5_1
```

#### 方案二：云端语音转写

如果线上环境无法运行本地 whisper.cpp，可配置：

```bash
OPENAI_TRANSCRIPTION_API_KEY=your-transcription-api-key
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
```

> Agnes 当前在本项目中仅用于文本分析，不负责语音转写。

### 测试音频

项目提供两段可直接上传的 MP3 测试素材：

- [`test/teamalign-project-meeting-zh.mp3`](./test/teamalign-project-meeting-zh.mp3)
- [`test/teamalign-project-meeting-en.mp3`](./test/teamalign-project-meeting-en.mp3)

对应原文见 [`test/README.md`](./test/README.md)。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地网页开发服务器 |
| `npm run asr` | 启动本地 whisper.cpp 转写服务 |
| `npm run dev:full` | 同时启动本地 ASR 和网页 |
| `npm run build` | 构建生产版本 |
| `npm test` | 构建并运行全部测试 |
| `npm run lint` | 运行 ESLint |
| `npm run start` | 启动生产构建 |

### 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AI_PROVIDER` | 是 | `agnes` 或 `openai` |
| `AGNES_API_KEY` | 使用 Agnes 时 | Agnes API Key |
| `AGNES_BASE_URL` | 否 | Agnes OpenAI-compatible API 地址 |
| `AGNES_TEXT_MODEL` | 否 | Agnes 文本模型 |
| `OPENAI_API_KEY` | 使用 OpenAI 时 | OpenAI API Key |
| `OPENAI_TEXT_MODEL` | 否 | OpenAI 文本模型 |
| `LOCAL_ASR_ENABLED` | 否 | 是否启用本地语音转写 |
| `LOCAL_ASR_URL` | 否 | whisper.cpp 服务地址 |
| `LOCAL_ASR_MODEL` | 否 | 本地 Whisper 模型名称 |
| `OPENAI_TRANSCRIPTION_API_KEY` | 否 | 云端语音转写 API Key |
| `OPENAI_TRANSCRIPTION_MODEL` | 否 | 云端语音转写模型 |

完整示例见 [`.env.example`](./.env.example)。

### 数据存储

当前版本采用设备端持久化：

- 项目、任务、风险和文档状态：`localStorage`
- 上传音频和生成的 DOCX：`IndexedDB`
- API Key：仅保存在被 Git 忽略的 `.env.local`

这意味着当前版本适合本地演示、单设备使用和产品验证。浏览器数据不会自动同步到其他成员或设备。

### 上线部署前检查

项目已经可以生成 Cloudflare Workers 兼容构建：

```bash
npm run build
```

正式部署前建议完成：

1. 在托管平台配置环境变量，不要上传 `.env.local`；
2. 使用云端转写 API，或单独部署公网可访问的 Whisper 服务；
3. 将 `localStorage` 项目数据迁移到 D1、PostgreSQL 等数据库；
4. 将音频和报告迁移到 R2、S3 等对象存储；
5. 增加团队身份验证、工作空间权限和成员访问控制；
6. 配置域名、HTTPS、日志、错误监控和数据备份；
7. 在生产环境重新执行 `npm test` 和 `npm run build`。

> 本地 `127.0.0.1:8080` 的 Whisper 服务无法被线上 Worker 直接访问。

### API 路由

| 路由 | 方法 | 功能 |
| --- | --- | --- |
| `/api/health` | GET | 检查 AI 与 ASR 配置状态 |
| `/api/analyze` | POST | 转写并解析会议内容 |
| `/api/report` | POST | 生成报告预览和 DOCX |

### 项目结构

```text
teamalign-ai/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   ├── health/
│   │   └── report/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── browser-assets.ts
│   ├── openai.ts
│   ├── teamalign.ts
│   └── workspaces.ts
├── scripts/
│   ├── dev-with-local-asr.sh
│   └── start-local-asr.sh
├── test/
│   ├── README.md
│   ├── teamalign-project-meeting-en.mp3
│   └── teamalign-project-meeting-zh.mp3
├── tests/
├── .env.example
└── package.json
```

### 安全说明

- 不要在代码、README、Issue、截图或提交记录中公开真实 API Key；
- `.env.local`、`.local/`、构建目录和 Wrangler 本地状态已被 `.gitignore` 排除；
- 如果 Key 曾经被公开，请立即在服务商后台撤销并重新生成；
- 线上环境应通过托管平台的 Secrets 功能注入密钥。

---

## English

### Overview

TeamAlign AI turns meeting recordings or written notes into an actionable project plan. It automatically extracts decisions, breaks work down by role, detects delivery risks, and generates internal or client-ready reports.

It is designed for small and medium-sized internet and e-commerce teams that need to reduce:

- information gaps across product, engineering, QA, operations, and design;
- manual post-meeting task and ownership tracking;
- repetitive weekly and client reporting;
- schedule and resource conflicts across concurrent projects.

### Core features

1. **Meeting intelligence**
   - Paste meeting notes or upload MP3, M4A, WAV, or WEBM audio;
   - Transcribe recordings with local whisper.cpp;
   - Extract summaries, decisions, participants, and roles.

2. **Smart Tasks**
   - Break meeting outcomes into executable tasks by role;
   - Identify owners, priorities, estimates, and due dates;
   - Create, edit, delete, and move tasks through workflow states;
   - Use a responsive two-column or single-column board without horizontal scrolling.

3. **Risk Insights**
   - Detect schedule, resource, dependency, scope, and quality risks;
   - Connect risks to affected tasks and AI recommendations;
   - Mark risks as read, mitigated, or reopened.

4. **Reports**
   - Generate internal retrospective weekly reports;
   - Generate client-facing progress briefs;
   - Preview and download the same AI-generated report as DOCX;
   - Keep Chinese and English report versions separate.

5. **Multi-project workspaces**
   - Isolate meetings, audio, tasks, risks, members, and reports by project;
   - Preserve the active module when switching projects;
   - Bind asynchronous AI results to a project ID and data revision;
   - Create new isolated project workspaces.

6. **Bilingual interface**
   - Chinese-first interface with English support;
   - Instant language switching;
   - Language-aware project content and report generation.

### AI workflow

```text
Meeting audio / written notes
        ↓
Transcription (local whisper.cpp or cloud transcription API)
        ↓
Structured LLM analysis (Agnes / OpenAI-compatible API)
        ↓
Summary + decisions + role-based tasks + delivery risks
        ↓
Internal weekly report / client progress brief
        ↓
DOCX preview and download
```

### Tech stack

- Next.js 16 + React 19
- TypeScript
- vinext + Vite
- Tailwind CSS 4
- OpenAI-compatible SDK
- Agnes AI for text analysis
- whisper.cpp for local transcription
- docx for document generation
- IndexedDB for audio and DOCX blobs
- localStorage for structured project state
- Cloudflare Workers-compatible build

### Requirements

- Node.js `>= 22.13.0`
- npm
- An Agnes API Key or OpenAI API Key
- Optional local whisper.cpp service

### Local setup

```bash
git clone <your-repository-url>
cd teamalign-ai
npm install
cp .env.example .env.local
```

Configure at least one text analysis provider in `.env.local`:

```bash
AI_PROVIDER=agnes
AGNES_API_KEY=your-agnes-api-key
AGNES_BASE_URL=https://apihub.agnes-ai.com/v1
AGNES_TEXT_MODEL=agnes-2.0-flash
```

Start the application:

```bash
npm run dev
```

Open the URL shown in the terminal, usually:

```text
http://localhost:3000
```

The development server will select another port automatically if necessary.

### Audio transcription

#### Option 1: local whisper.cpp

Local ASR is intended for development and demos, keeping recordings off third-party transcription services.

After provisioning `.local/whisper.cpp`, `whisper-server`, and
`ggml-small-q5_1.bin`, run:

```bash
npm run asr
```

Run ASR and the web application separately:

```bash
npm run asr
npm run dev
```

Or start both:

```bash
npm run dev:full
```

Default configuration:

```bash
LOCAL_ASR_ENABLED=true
LOCAL_ASR_URL=http://127.0.0.1:8080
LOCAL_ASR_MODEL=small-q5_1
```

#### Option 2: cloud transcription

For hosted environments where local whisper.cpp is unavailable:

```bash
OPENAI_TRANSCRIPTION_API_KEY=your-transcription-api-key
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
```

> Agnes is used for text analysis in this project and does not provide the transcription path.

### Test audio

Two upload-ready MP3 fixtures are included:

- [`test/teamalign-project-meeting-zh.mp3`](./test/teamalign-project-meeting-zh.mp3)
- [`test/teamalign-project-meeting-en.mp3`](./test/teamalign-project-meeting-en.mp3)

See [`test/README.md`](./test/README.md) for their transcripts.

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local web development server |
| `npm run asr` | Start the local whisper.cpp server |
| `npm run dev:full` | Start local ASR and the web app together |
| `npm run build` | Create a production build |
| `npm test` | Build and run all tests |
| `npm run lint` | Run ESLint |
| `npm run start` | Start the production build |

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `AI_PROVIDER` | Yes | `agnes` or `openai` |
| `AGNES_API_KEY` | With Agnes | Agnes API Key |
| `AGNES_BASE_URL` | No | Agnes OpenAI-compatible API endpoint |
| `AGNES_TEXT_MODEL` | No | Agnes text model |
| `OPENAI_API_KEY` | With OpenAI | OpenAI API Key |
| `OPENAI_TEXT_MODEL` | No | OpenAI text model |
| `LOCAL_ASR_ENABLED` | No | Enable local transcription |
| `LOCAL_ASR_URL` | No | whisper.cpp service endpoint |
| `LOCAL_ASR_MODEL` | No | Local Whisper model name |
| `OPENAI_TRANSCRIPTION_API_KEY` | No | Cloud transcription API Key |
| `OPENAI_TRANSCRIPTION_MODEL` | No | Cloud transcription model |

See [`.env.example`](./.env.example) for a complete template.

### Data persistence

The current version uses device-local persistence:

- project, task, risk, and document state: `localStorage`;
- uploaded audio and generated DOCX files: `IndexedDB`;
- API keys: ignored `.env.local` only.

This setup is suitable for local demos, single-device usage, and product validation. Browser data is not synchronized across team members or devices.

### Production deployment checklist

The project already produces a Cloudflare Workers-compatible build:

```bash
npm run build
```

Before a production deployment:

1. Configure environment variables in the hosting platform; never upload `.env.local`;
2. Use a cloud transcription API or deploy a publicly reachable Whisper service;
3. Move structured project data from `localStorage` to D1, PostgreSQL, or another database;
4. Move audio and reports to R2, S3, or another object store;
5. Add authentication, workspace authorization, and member access control;
6. Configure a domain, HTTPS, logs, error monitoring, and backups;
7. Run `npm test` and `npm run build` in the production environment.

> A local Whisper service at `127.0.0.1:8080` cannot be reached by an online Worker.

### API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Check AI and ASR configuration |
| `/api/analyze` | POST | Transcribe and analyze meeting content |
| `/api/report` | POST | Generate report previews and DOCX files |

### Project structure

```text
teamalign-ai/
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   ├── health/
│   │   └── report/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── browser-assets.ts
│   ├── openai.ts
│   ├── teamalign.ts
│   └── workspaces.ts
├── scripts/
├── test/
├── tests/
├── .env.example
└── package.json
```

### Security

- Never expose real API keys in source code, README files, issues, screenshots, or commit history;
- `.env.local`, `.local/`, build output, and local Wrangler state are excluded by `.gitignore`;
- Revoke and rotate any key that has been exposed;
- Use the hosting platform's secret management for production credentials.
