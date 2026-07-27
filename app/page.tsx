"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileAudio,
  FileText,
  Gauge,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

type Language = "zh" | "en";
type MeetingMode = "text" | "audio";
type AnalyzeState = "idle" | "running" | "done";
type DocType = "weekly" | "client";

const i18n = {
  zh: {
    nav: ["总览", "AI 任务", "风险预警", "文档中心"],
    workspace: "工作空间",
    project: "云舟电商 6.18 增长项目",
    search: "搜索任务、成员或文档",
    greeting: "下午好，林晓",
    overview: "AI 已完成本周第 2 次协同分析，3 项更新需要你关注。",
    health: "项目健康度",
    progress: "整体进度",
    teamLoad: "团队负载",
    uploadTitle: "会议智能解析",
    uploadSub: "输入会议内容，让 AI Agent 自动生成可执行计划",
    paste: "粘贴纪要",
    upload: "上传录音",
    textarea: "粘贴会议纪要、聊天记录或需求说明…",
    supported: "支持 MP3、M4A、WAV，单个文件不超过 200 MB",
    choose: "选择音频文件",
    example: "已填入「6.18 大促上线评审会」示例纪要",
    analyse: "AI 开始解析",
    analysing: "正在识别与拆解…",
    analysed: "已完成解析",
    taskTitle: "AI 任务看板",
    taskSub: "基于最新会议纪要 · 8 个任务",
    addTask: "添加任务",
    todo: "待开始",
    doing: "进行中",
    review: "待验收",
    hours: "小时",
    risksTitle: "风险雷达",
    risksSub: "AI 实时扫描交付隐患",
    high: "高风险",
    medium: "需关注",
    resolved: "已缓解",
    viewAll: "查看全部风险",
    docsTitle: "智能文档",
    docsSub: "基于项目实时进度自动生成",
    weekly: "内部项目周报",
    client: "客户进展简报",
    ready: "刚刚更新",
    download: "下载 DOCX",
    preview: "预览",
    sync: "数据已同步",
    week: "第 24 周 · 6月10日—6月16日",
    docHeadline: "核心链路已进入联调，整体进度符合预期",
    docBody: "本周完成营销会场主视觉、优惠券接口与埋点方案评审。下周重点推进全链路压测及客户端兼容性验收。",
    aiNote: "AI 建议",
    aiNoteText: "将支付回归测试提前 1 天，可释放发布窗口缓冲。",
    notification: "AI 刚刚识别到 1 个新风险",
    notificationSub: "测试资源在 6 月 14 日存在冲突",
    fileName: "评审会录音_0612.m4a",
  },
  en: {
    nav: ["Overview", "AI Tasks", "Risk Alerts", "Documents"],
    workspace: "Workspace",
    project: "Yunzhou 6.18 Growth Campaign",
    search: "Search tasks, members or documents",
    greeting: "Good afternoon, Lin",
    overview: "AI finished its second alignment scan this week. 3 updates need attention.",
    health: "Project health",
    progress: "Progress",
    teamLoad: "Team load",
    uploadTitle: "Meeting intelligence",
    uploadSub: "Turn meeting content into an actionable plan with AI agents",
    paste: "Paste notes",
    upload: "Upload audio",
    textarea: "Paste meeting notes, chat history or a requirement brief…",
    supported: "MP3, M4A or WAV · up to 200 MB per file",
    choose: "Choose audio file",
    example: "Sample notes from the 6.18 launch review are ready",
    analyse: "Analyze with AI",
    analysing: "Transcribing & structuring…",
    analysed: "Analysis complete",
    taskTitle: "AI task board",
    taskSub: "From the latest meeting · 8 tasks",
    addTask: "Add task",
    todo: "To do",
    doing: "In progress",
    review: "Review",
    hours: "hrs",
    risksTitle: "Risk radar",
    risksSub: "AI scans delivery risks in real time",
    high: "High risk",
    medium: "Watch",
    resolved: "Mitigated",
    viewAll: "View all risks",
    docsTitle: "Smart documents",
    docsSub: "Generated from live project activity",
    weekly: "Internal weekly report",
    client: "Client progress brief",
    ready: "Updated just now",
    download: "Download DOCX",
    preview: "Preview",
    sync: "All data synced",
    week: "Week 24 · Jun 10—Jun 16",
    docHeadline: "Core integration is underway and delivery remains on track",
    docBody: "This week the team completed campaign creative, coupon API and analytics reviews. Next week focuses on load testing and client compatibility sign-off.",
    aiNote: "AI suggestion",
    aiNoteText: "Move payment regression testing forward by one day to protect the release buffer.",
    notification: "AI detected a new delivery risk",
    notificationSub: "QA capacity conflicts on June 14",
    fileName: "launch-review_0612.m4a",
  },
} as const;

const taskData = {
  zh: [
    {
      key: "todo",
      items: [
        { title: "确认大促会场最终文案", tag: "内容运营", name: "周冉", initials: "周", time: 3, date: "6月13日" },
        { title: "补充退款场景埋点", tag: "数据产品", name: "陈默", initials: "陈", time: 5, date: "6月14日" },
        { title: "整理商家侧上线通知", tag: "客户成功", name: "沈琪", initials: "沈", time: 2, date: "6月14日" },
      ],
    },
    {
      key: "doing",
      items: [
        { title: "优惠券服务接口联调", tag: "后端研发", name: "顾屿", initials: "顾", time: 12, date: "6月13日", progress: 68 },
        { title: "主会场移动端适配", tag: "前端研发", name: "张予", initials: "张", time: 10, date: "6月15日", progress: 45 },
        { title: "全链路压测脚本编写", tag: "测试工程", name: "许宁", initials: "许", time: 8, date: "6月16日", progress: 32 },
      ],
    },
    {
      key: "review",
      items: [
        { title: "会员日主视觉设计", tag: "视觉设计", name: "唐可", initials: "唐", time: 6, date: "今天" },
        { title: "营销落地页交互走查", tag: "产品经理", name: "林晓", initials: "林", time: 4, date: "今天" },
      ],
    },
  ],
  en: [
    {
      key: "todo",
      items: [
        { title: "Finalize campaign copy", tag: "Content Ops", name: "Ran Zhou", initials: "RZ", time: 3, date: "Jun 13" },
        { title: "Add refund event tracking", tag: "Data Product", name: "Mo Chen", initials: "MC", time: 5, date: "Jun 14" },
        { title: "Prepare merchant launch notice", tag: "Customer Success", name: "Qi Shen", initials: "QS", time: 2, date: "Jun 14" },
      ],
    },
    {
      key: "doing",
      items: [
        { title: "Integrate coupon service API", tag: "Backend", name: "Yu Gu", initials: "YG", time: 12, date: "Jun 13", progress: 68 },
        { title: "Adapt mobile campaign hub", tag: "Frontend", name: "Yu Zhang", initials: "YZ", time: 10, date: "Jun 15", progress: 45 },
        { title: "Build load-test scripts", tag: "QA", name: "Ning Xu", initials: "NX", time: 8, date: "Jun 16", progress: 32 },
      ],
    },
    {
      key: "review",
      items: [
        { title: "Membership-day key visual", tag: "Design", name: "Ke Tang", initials: "KT", time: 6, date: "Today" },
        { title: "Review landing-page interactions", tag: "Product", name: "Lin Xiao", initials: "LX", time: 4, date: "Today" },
      ],
    },
  ],
};

const risks = {
  zh: [
    {
      level: "high",
      title: "测试资源冲突",
      text: "许宁同时被分配至 2 个 P0 项目，预计压测延期 1 天。",
      meta: "影响 2 个任务 · 6月14日",
    },
    {
      level: "medium",
      title: "接口依赖可能阻塞",
      text: "优惠券服务尚缺异常码说明，联调缓冲仅剩 8 小时。",
      meta: "影响 1 个里程碑 · 6月15日",
    },
    {
      level: "resolved",
      title: "视觉稿交付已恢复",
      text: "主视觉已通过品牌审核，比计划提前 3 小时。",
      meta: "AI 于 14:32 自动更新",
    },
  ],
  en: [
    {
      level: "high",
      title: "QA capacity conflict",
      text: "Ning Xu is assigned to two P0 projects; load testing may slip by one day.",
      meta: "2 tasks impacted · Jun 14",
    },
    {
      level: "medium",
      title: "API dependency may block",
      text: "Coupon service error codes are missing, leaving only an 8-hour buffer.",
      meta: "1 milestone impacted · Jun 15",
    },
    {
      level: "resolved",
      title: "Creative delivery recovered",
      text: "The key visual passed brand review three hours ahead of plan.",
      meta: "Updated by AI at 14:32",
    },
  ],
};

const sampleNotes = {
  zh: `6.18 大促上线评审会｜6月12日 10:00
参会：产品、研发、测试、运营、设计

1. 优惠券接口周四前完成联调，顾屿负责；异常码说明由产品补充。
2. 主会场移动端适配预计 10 小时，张予周六前完成。
3. 测试本周同时支持会员项目，压测资源存在冲突，需要调整排期。
4. 主视觉已经通过品牌审核，运营今天确认最终文案。
5. 下周一前输出客户版进展简报。`,
  en: `6.18 Campaign Launch Review | Jun 12, 10:00
Attendees: Product, Engineering, QA, Operations and Design

1. Coupon API integration is due Thursday, owned by Yu Gu. Product will add error code definitions.
2. Mobile campaign adaptation is estimated at 10 hours and due Saturday.
3. QA is supporting another P0 project this week, creating a load-test capacity conflict.
4. The key visual passed brand review. Operations will finalize copy today.
5. A client-ready progress brief is due next Monday.`,
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const [meetingMode, setMeetingMode] = useState<MeetingMode>("text");
  const [notes, setNotes] = useState(sampleNotes.zh);
  const [fileName, setFileName] = useState("");
  const [analyzeState, setAnalyzeState] = useState<AnalyzeState>("idle");
  const [docType, setDocType] = useState<DocType>("weekly");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const t = i18n[language];

  const changeLanguage = () => {
    const next = language === "zh" ? "en" : "zh";
    setLanguage(next);
    setNotes(sampleNotes[next]);
  };

  const runAnalysis = () => {
    setAnalyzeState("running");
    window.setTimeout(() => setAnalyzeState("done"), 1500);
  };

  const chooseFile = (file?: File) => {
    if (file) {
      setFileName(file.name);
      setAnalyzeState("idle");
    }
  };

  const downloadReport = () => {
    const content = `${docType === "weekly" ? t.weekly : t.client}\n${t.week}\n\n${t.docHeadline}\n\n${t.docBody}\n\n${t.aiNote}: ${t.aiNoteText}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${docType === "weekly" ? "TeamAlign-weekly" : "TeamAlign-client-brief"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-mark" aria-label="TeamAlign AI">
          <span className="brand-glyph"><i /><i /></span>
          <div className="brand-text">
            <strong>TeamAlign</strong>
            <small>AI</small>
          </div>
        </div>

        <nav className="primary-nav" aria-label={t.workspace}>
          {[LayoutDashboard, ClipboardList, ShieldAlert, FileText].map((Icon, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} key={t.nav[index]}>
              <span className="nav-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span>{t.nav[index]}</span>
              {index === 2 && <b className="nav-count">2</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-project">
          <p>{language === "zh" ? "项目成员" : "Project team"}</p>
          <div className="avatar-stack" aria-label="Team members">
            <span className="avatar a1">林</span>
            <span className="avatar a2">顾</span>
            <span className="avatar a3">唐</span>
            <span className="avatar more">+8</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item"><CircleHelp size={19} /><span>{language === "zh" ? "帮助中心" : "Help"}</span></button>
          <button className="nav-item"><Settings size={19} /><span>{language === "zh" ? "设置" : "Settings"}</span></button>
          <div className="account">
            <span className="avatar owner">林</span>
            <div><strong>{language === "zh" ? "林晓" : "Lin Xiao"}</strong><small>{language === "zh" ? "项目负责人" : "Project lead"}</small></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {mobileNav && <button aria-label="Close menu" className="nav-scrim" onClick={() => setMobileNav(false)} />}

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22} /></button>
            <span className="workspace-label">{t.workspace}</span>
            <span className="crumb">/</span>
            <button className="project-switcher">
              <span className="project-dot" />
              <span>{t.project}</span>
              <ChevronDown size={15} />
            </button>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Search size={17} />
              <input aria-label={t.search} placeholder={t.search} />
              <kbd>⌘ K</kbd>
            </label>
            <button className="language-button" onClick={changeLanguage} aria-label="Switch language">
              <Languages size={17} />
              <span>{language === "zh" ? "中 / EN" : "EN / 中"}</span>
            </button>
            <div className="notice-wrap">
              <button className="icon-button" onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Notifications">
                <Bell size={19} />
                <i className="notice-dot" />
              </button>
              {noticeOpen && (
                <div className="notice-popover">
                  <div className="notice-popover-icon"><ShieldAlert size={18} /></div>
                  <div><strong>{t.notification}</strong><p>{t.notificationSub}</p></div>
                  <button onClick={() => setNoticeOpen(false)} aria-label="Close"><X size={15} /></button>
                </div>
              )}
            </div>
            <span className="avatar owner top-avatar">林</span>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="date-row">
                <span>{language === "zh" ? "2026年6月12日 · 星期五" : "Friday · June 12, 2026"}</span>
                <span className="sync-badge"><Check size={12} />{t.sync}</span>
              </div>
              <h1>{t.greeting}<span>。</span></h1>
              <p>{t.overview}</p>
            </div>
            <div className="health-strip">
              <div className="health-score">
                <span className="score-ring"><strong>82</strong></span>
                <div><small>{t.health}</small><b>{language === "zh" ? "良好" : "Healthy"}</b></div>
              </div>
              <div className="metric">
                <small>{t.progress}</small>
                <strong>64%</strong>
                <span className="mini-line"><i style={{ width: "64%" }} /></span>
              </div>
              <div className="metric">
                <small>{t.teamLoad}</small>
                <strong>78%</strong>
                <div className="bars"><i /><i /><i /><i /><i /></div>
              </div>
            </div>
          </section>

          <section className="top-grid">
            <article className="card meeting-card">
              <div className="card-heading">
                <div className="title-icon blue"><MessageSquareText size={19} /></div>
                <div><h2>{t.uploadTitle}</h2><p>{t.uploadSub}</p></div>
                <span className="ai-badge"><Sparkles size={13} /> AI Agent</span>
              </div>

              <div className="meeting-tabs" role="tablist">
                <button className={meetingMode === "text" ? "active" : ""} onClick={() => setMeetingMode("text")}><FileText size={15} />{t.paste}</button>
                <button className={meetingMode === "audio" ? "active" : ""} onClick={() => setMeetingMode("audio")}><FileAudio size={15} />{t.upload}</button>
              </div>

              {meetingMode === "text" ? (
                <div className="notes-input">
                  <textarea value={notes} onChange={(event) => { setNotes(event.target.value); setAnalyzeState("idle"); }} placeholder={t.textarea} />
                  <div className="input-foot">
                    <span><Paperclip size={14} />{t.example}</span>
                    <span>{notes.length} / 10,000</span>
                  </div>
                </div>
              ) : (
                <div
                  className={`upload-zone ${fileName ? "has-file" : ""}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}
                  onClick={() => fileInput.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => event.key === "Enter" && fileInput.current?.click()}
                >
                  <input ref={fileInput} type="file" accept=".mp3,.m4a,.wav,audio/*" onChange={(event) => chooseFile(event.target.files?.[0])} />
                  <span className="upload-icon">{fileName ? <FileAudio size={23} /> : <UploadCloud size={23} />}</span>
                  <div><strong>{fileName || t.choose}</strong><p>{fileName ? t.fileName : t.supported}</p></div>
                </div>
              )}

              <div className="meeting-footer">
                <div className="agent-steps">
                  <span><i className="step-icon"><FileAudio size={13} /></i>{language === "zh" ? "语音转写" : "Transcribe"}</span>
                  <b />
                  <span><i className="step-icon"><Bot size={13} /></i>{language === "zh" ? "任务拆解" : "Tasks"}</span>
                  <b />
                  <span><i className="step-icon"><Gauge size={13} /></i>{language === "zh" ? "风险识别" : "Risks"}</span>
                </div>
                <button className={`primary-button ${analyzeState}`} onClick={runAnalysis} disabled={analyzeState === "running"}>
                  {analyzeState === "running" ? <LoaderCircle className="spin" size={17} /> : analyzeState === "done" ? <Check size={17} /> : <WandSparkles size={17} />}
                  {analyzeState === "running" ? t.analysing : analyzeState === "done" ? t.analysed : t.analyse}
                </button>
              </div>
            </article>

            <article className="card risks-card">
              <div className="card-heading">
                <div className="title-icon coral"><ShieldAlert size={19} /></div>
                <div><h2>{t.risksTitle}</h2><p>{t.risksSub}</p></div>
                <span className="risk-total">2</span>
              </div>
              <div className="risk-list">
                {risks[language].map((risk) => (
                  <button className={`risk-item ${risk.level}`} key={risk.title}>
                    <span className="risk-signal">{risk.level === "high" ? <AlertTriangle size={15} /> : risk.level === "medium" ? <Clock3 size={15} /> : <Check size={15} />}</span>
                    <span className="risk-copy"><span><strong>{risk.title}</strong><em>{t[risk.level as "high" | "medium" | "resolved"]}</em></span><p>{risk.text}</p><small>{risk.meta}</small></span>
                    <ChevronDown className="risk-chevron" size={15} />
                  </button>
                ))}
              </div>
              <button className="text-button">{t.viewAll}<span>→</span></button>
            </article>
          </section>

          <section className="bottom-grid">
            <article className="card board-card">
              <div className="card-heading board-heading">
                <div className="title-icon teal"><ClipboardList size={19} /></div>
                <div><h2>{t.taskTitle}</h2><p>{t.taskSub}</p></div>
                <div className="board-actions">
                  <div className="avatar-stack mini">
                    <span className="avatar a1">林</span><span className="avatar a2">顾</span><span className="avatar a3">唐</span><span className="avatar more">+5</span>
                  </div>
                  <button className="secondary-button"><Plus size={15} />{t.addTask}</button>
                  <button className="ghost-icon"><MoreHorizontal size={18} /></button>
                </div>
              </div>
              <div className="board-columns">
                {taskData[language].map((column, columnIndex) => (
                  <div className="task-column" key={column.key}>
                    <div className="column-head">
                      <span className={`status-dot s${columnIndex}`} />
                      <strong>{t[column.key as "todo" | "doing" | "review"]}</strong>
                      <b>{column.items.length}</b>
                      <button aria-label="Column menu"><MoreHorizontal size={16} /></button>
                    </div>
                    <div className="task-list">
                      {column.items.map((task) => (
                        <button className="task-card" key={task.title}>
                          <div className="task-top"><span className={`task-tag tag${columnIndex}`}>{task.tag}</span><MoreHorizontal size={15} /></div>
                          <strong>{task.title}</strong>
                          {"progress" in task && (
                            <div className="task-progress"><span><i style={{ width: `${task.progress}%` }} /></span><em>{task.progress}%</em></div>
                          )}
                          <div className="task-meta">
                            <span className="avatar task-avatar">{task.initials}</span>
                            <span>{task.name}</span>
                            <span className="spacer" />
                            <span><CalendarDays size={12} />{task.date}</span>
                            <span><Clock3 size={12} />{task.time}{t.hours}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {columnIndex === 0 && <button className="quick-add"><Plus size={14} />{t.addTask}</button>}
                  </div>
                ))}
              </div>
            </article>

            <article className="card docs-card">
              <div className="card-heading">
                <div className="title-icon violet"><FileText size={19} /></div>
                <div><h2>{t.docsTitle}</h2><p>{t.docsSub}</p></div>
              </div>
              <div className="doc-tabs">
                <button className={docType === "weekly" ? "active" : ""} onClick={() => setDocType("weekly")}>{t.weekly}</button>
                <button className={docType === "client" ? "active" : ""} onClick={() => setDocType("client")}>{t.client}</button>
              </div>
              <div className="document-preview">
                <div className="document-top">
                  <div className="doc-logo"><span className="brand-glyph mini-glyph"><i /><i /></span><strong>TeamAlign</strong></div>
                  <span>{docType === "weekly" ? "WEEKLY" : "CLIENT BRIEF"}</span>
                </div>
                <p className="document-date">{t.week}</p>
                <h3>{t.docHeadline}</h3>
                <p className="document-body">{t.docBody}</p>
                <div className="doc-stats">
                  <div><strong>8</strong><span>{language === "zh" ? "进行中任务" : "Active tasks"}</span></div>
                  <div><strong>3</strong><span>{language === "zh" ? "本周已完成" : "Completed"}</span></div>
                  <div><strong>2</strong><span>{language === "zh" ? "待处理风险" : "Open risks"}</span></div>
                </div>
                <div className="ai-note"><Sparkles size={14} /><div><strong>{t.aiNote}</strong><p>{t.aiNoteText}</p></div></div>
              </div>
              <div className="doc-footer">
                <span><span className="live-dot" />{t.ready}</span>
                <div><button className="secondary-button">{t.preview}</button><button className="primary-button" onClick={downloadReport}><ArrowDownToLine size={16} />{t.download}</button></div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
