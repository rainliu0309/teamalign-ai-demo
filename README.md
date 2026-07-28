# TeamAlign AI

> A lightweight AI project tool that turns meetings into tasks, risk alerts, and reports.<br>
> 将会议内容转化为任务、风险预警和项目报告的轻量化 AI 项目协作工具。

### [🚀 Live Demo · 在线体验](https://teamalign-ai-demo.onrender.com/)

TeamAlign AI turns meeting recordings and written notes into tasks, risk alerts, and standardized project reports in one responsive workspace.

TeamAlign AI 将会议录音与文字纪要转化为任务、风险预警和标准化项目报告，并提供响应式项目协作工作台。

## Highlights · 功能亮点

- **Meeting intelligence · 会议智能解析** — Paste notes or upload MP3, M4A, WAV, and WEBM recordings; choose Chinese or English for browser-local transcription with no extra API key.<br>
  粘贴会议纪要或上传 MP3、M4A、WAV、WEBM 录音；选择中文或英文录音语言，在浏览器本地完成转写，无需额外 API Key。
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
   ├── browser-local Whisper transcription
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
│   ├── browser-transcription.ts # Browser-local audio decoding / 浏览器本地音频解析
│   ├── browser-transcription.worker.ts # Browser-local Whisper worker / 浏览器本地 Whisper Worker
│   ├── openai.ts              # Agnes/OpenAI-compatible client / AI 客户端
│   ├── teamalign.ts           # Shared domain models / 项目领域模型
│   └── workspaces.ts          # Isolated project workspaces / 项目工作空间
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
- A modern desktop browser; Chrome or Edge is recommended for faster local transcription / 现代桌面浏览器；推荐 Chrome 或 Edge 以获得更快的本地转写体验

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

### 4. Browser-local transcription · 浏览器本地转写

Upload a recording from the meeting analysis screen and choose the language spoken in it. TeamAlign downloads and caches a multilingual Whisper Small model in the browser, transcribes the audio locally, then sends only the transcript to Agnes for task, risk, and report generation.

在会议解析页上传录音后，请选择录音实际使用的语言。TeamAlign 会在浏览器中下载并缓存多语言 Whisper Small 模型，在本机完成转写；中文转写会自动统一为简体中文。随后仅将转写文本发送给 Agnes，用于生成任务、风险和报告。

No OpenAI, Groq, or separate transcription key is required.

无需 OpenAI、Groq 或独立的语音转写 Key。

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
| `npm run build` | Create a production build / 构建生产版本 |
| `npm test` | Build and run automated tests / 构建并运行自动化测试 |
| `npm run lint` | Run ESLint / 运行 ESLint |
| `npm run start` | Start the production build / 启动生产构建 |

## Deployment · 部署说明

**Production URL · 线上地址:** [https://teamalign-ai-demo.onrender.com/](https://teamalign-ai-demo.onrender.com/)

The repository includes a Render Blueprint in [`render.yaml`](./render.yaml). It creates a free Node web service that builds the application, starts it with `npm run start`, and checks `/api/health`.

仓库已包含 Render Blueprint 配置文件 [`render.yaml`](./render.yaml)，会创建一个免费的 Node Web Service，构建应用、通过 `npm run start` 启动，并以 `/api/health` 作为健康检查。

To deploy on Render:

在 Render 部署时：

1. Create a new **Blueprint** from this GitHub repository. / 从此 GitHub 仓库新建 **Blueprint**。
2. Enter `AGNES_API_KEY` when Render prompts for secrets. / 在 Render 提示时填写 `AGNES_API_KEY`。
3. After the first deployment succeeds, add the generated URL to the blank demo link at the top of this README. / 首次部署成功后，将生成的网址补到 README 顶部的空白体验链接。

The project also produces a Cloudflare Workers-compatible build:

项目可生成兼容 Cloudflare Workers 的构建产物：

```bash
npm run build
```

Before deployment, configure the production environment variables in your hosting platform. Do not upload `.env.local`.

部署前请在托管平台配置生产环境变量，不要上传 `.env.local`。

For a production-ready multi-user setup, replace browser-local persistence with a database and object storage, then add authentication and workspace authorization.

如需生产级多成员协作，请将浏览器本地数据迁移至数据库与对象存储，并补充登录认证和工作空间权限控制。

> **Transcription note / 转写说明:** Choose the language actually spoken in the recording; it is independent from the interface language. The first audio transcription downloads a browser-local Whisper Small model and can take longer, especially on a slower device. Later uses reuse the browser cache. The uploaded audio is not sent to a third-party transcription API.<br>
> 请按录音实际语言选择中文或英文，它独立于网页界面语言。首次录音转写需要下载浏览器本地 Whisper Small 模型，性能较弱设备耗时会更长；后续会复用浏览器缓存。上传的音频不会发送到第三方转写 API。

## API Reference · 接口说明

| Method | Endpoint | Description / 说明 |
|---|---|---|
| `GET` | `/api/health` | Check AI and browser-transcription availability / 检查 AI 与浏览器转写状态 |
| `POST` | `/api/analyze` | Analyze a transcript into project actions / 将会议文字分析为项目行动项 |
| `POST` | `/api/report` | Generate report previews and DOCX files / 生成报告预览与 DOCX 文件 |

## Security Notes · 安全说明

- Keep API keys in `.env.local` or your hosting platform's secret manager only. / API 密钥仅保存在 `.env.local` 或部署平台的密钥管理中。
- `.env.local`, `.local/`, build output, and local Wrangler state are excluded from Git. / `.env.local`、`.local/`、构建产物和本地 Wrangler 状态已被 Git 排除。
- Revoke and rotate any key that has ever been exposed. / 若密钥曾被公开，请立即撤销并重新生成。
- Audio transcription runs in the browser; only the resulting transcript is sent to the configured AI provider. / 音频在浏览器本地转写；仅生成的文字会发送至已配置的 AI 服务。

## Copyright · 版权声明

Copyright © 2026 Ruiying (Rain) Liu. **All Rights Reserved.**

This project is publicly available for viewing and evaluation only. No permission is granted to copy, modify, distribute, sublicense, sell, commercially use, or create derivative works without prior written permission from the copyright holder. This repository is **not open-source software**.

版权所有 © 2026 Ruiying (Rain) Liu。**保留所有权利。**

本项目仅供公开查看与评估。未经版权所有者事先书面许可，不得复制、修改、分发、再许可、出售、商业使用或创作衍生作品。本仓库**不属于开源软件**。
