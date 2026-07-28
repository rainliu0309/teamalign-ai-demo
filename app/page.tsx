"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileAudio,
  FileText,
  FolderPlus,
  Gauge,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Save,
  Settings,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  UploadCloud,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  deleteBrowserAsset,
  getBrowserAsset,
  saveBrowserAsset,
} from "../lib/browser-assets";
import { transcribeBrowserAudio } from "../lib/browser-transcription";
import {
  isGeneratedReport,
  normalizeMeetingTitle,
  type AnalysisResult,
} from "../lib/teamalign";
import {
  applyAnalysisToProject,
  cloneInitialWorkspace,
  createEmptyProject,
  localize,
  markDocumentsStale,
  normalizePersistedWorkspace,
  projectToAnalysis,
  recalculateProjectMetrics,
  type Language,
  type LocalizedText,
  type PersistedWorkspace,
  type ProjectWorkspace,
  type WorkspaceTask,
} from "../lib/workspaces";

type MeetingMode = "text" | "audio";
type AnalyzeState = "idle" | "running" | "done";
type DocType = "weekly" | "client";
type DocState = "idle" | "generating" | "ready";
type UtilityPanel =
  | "team"
  | "help"
  | "settings"
  | "account"
  | "project"
  | "task"
  | "risk"
  | null;

type TaskDraft = {
  id?: string;
  title: string;
  role: string;
  assignee: string;
  estimatedHours: number;
  dueDate: string;
  status: WorkspaceTask["status"];
  priority: WorkspaceTask["priority"];
  progress: number;
};

type ProjectDraft = {
  name: string;
  client: string;
  owner: string;
  startDate: string;
  endDate: string;
};

const WORKSPACE_STORAGE_KEY = "teamalign:workspace:v1";
const LANGUAGE_STORAGE_KEY = "teamalign:language";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function localDateValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

const i18n = {
  zh: {
    nav: ["项目总览", "智能任务", "风险洞察", "汇报中心"],
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
    supported: "支持 MP3、M4A、WAV、WEBM，浏览器本地转写，单个文件不超过 25 MB",
    choose: "选择音频文件",
    example: "已填入「6.18 大促上线评审会」示例纪要",
    analyse: "AI 开始解析",
    analysing: "正在识别与拆解…",
    analysed: "已完成解析",
    summaryReady: "AI 总结已生成",
    summaryDetail: "识别出 5 项关键决策，并同步生成任务、风险与汇报草稿。",
    decisions: "关键决策",
    assignments: "岗位任务",
    detectedRisks: "交付风险",
    taskTitle: "智能任务",
    taskSub: "AI 已按岗位与成员负载自动拆解 · 8 个任务",
    roleAssigned: "岗位智能分配",
    addTask: "添加任务",
    todo: "待开始",
    doing: "进行中",
    review: "待验收",
    hours: "小时",
    risksTitle: "风险洞察",
    risksSub: "AI 实时扫描交付隐患",
    autoScanning: "自动扫描中",
    high: "高风险",
    medium: "需关注",
    resolved: "已缓解",
    viewAll: "查看全部风险",
    docsTitle: "汇报中心",
    docsSub: "基于项目实时进度自动生成",
    weekly: "内部项目周报",
    client: "客户进展简报",
    ready: "真实报告已生成",
    download: "下载 DOCX",
    preview: "预览",
    generate: "一键生成",
    generating: "生成中…",
    generated: "已生成",
    sync: "已保存到本机",
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
    nav: ["Overview", "Smart Tasks", "Risk Insights", "Reports"],
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
    supported: "MP3, M4A, WAV or WEBM · browser-local transcription · up to 25 MB",
    choose: "Choose audio file",
    example: "Sample notes from the 6.18 launch review are ready",
    analyse: "Analyze with AI",
    analysing: "Transcribing & structuring…",
    analysed: "Analysis complete",
    summaryReady: "AI summary ready",
    summaryDetail: "5 decisions identified, with tasks, risks and a report draft created.",
    decisions: "Decisions",
    assignments: "Role tasks",
    detectedRisks: "Delivery risks",
    taskTitle: "Smart Tasks",
    taskSub: "Auto-split by role and team capacity · 8 tasks",
    roleAssigned: "Smart role assignment",
    addTask: "Add task",
    todo: "To do",
    doing: "In progress",
    review: "Review",
    hours: "hrs",
    risksTitle: "Risk Insights",
    risksSub: "AI scans delivery risks in real time",
    autoScanning: "Live scanning",
    high: "High risk",
    medium: "Watch",
    resolved: "Mitigated",
    viewAll: "View all risks",
    docsTitle: "Reports",
    docsSub: "Generated from live project activity",
    weekly: "Internal weekly report",
    client: "Client progress brief",
    ready: "Live report generated",
    download: "Download DOCX",
    preview: "Preview",
    generate: "Generate",
    generating: "Generating…",
    generated: "Generated",
    sync: "Saved on this device",
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

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const [activeNav, setActiveNav] = useState(0);
  const [workspace, setWorkspace] = useState<PersistedWorkspace>(
    cloneInitialWorkspace,
  );
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [apiProvider, setApiProvider] = useState<"openai" | "agnes">("agnes");
  const [transcriptionConfigured, setTranscriptionConfigured] = useState(true);
  const [transcriptionProvider, setTranscriptionProvider] = useState<
    "browser" | null
  >("browser");
  const [uiError, setUiError] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    name: "",
    client: "",
    owner: "",
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [projectSwitching, setProjectSwitching] = useState(false);
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const projectSwitcher = useRef<HTMLDivElement>(null);
  const projectButton = useRef<HTMLButtonElement>(null);
  const projectOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const searchWrapper = useRef<HTMLDivElement>(null);
  const noticeWrapper = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);
  const switchTimer = useRef<number | null>(null);
  const t = i18n[language];
  const currentProject = workspace.projects[workspace.activeProjectId];
  const projectOptions = Object.values(workspace.projects);
  const meetingMode = currentProject.meetingMode as MeetingMode;
  const notes = localize(currentProject.notes, language);
  const fileName = currentProject.audioFileMeta?.name ?? "";
  const docType = currentProject.documents.selectedType as DocType;
  const storedReport = currentProject.documents[docType];
  const reportLanguageMismatch =
    storedReport.status !== "idle" && storedReport.language !== language;
  const activeReport = reportLanguageMismatch
    ? {
        ...storedReport,
        status: "stale" as const,
        error: undefined,
        preview: undefined,
      }
    : storedReport;
  const reportPreview = activeReport.preview;
  const docState: DocState =
    activeReport.status === "generating"
      ? "generating"
      : activeReport.status === "ready"
        ? "ready"
        : "idle";
  const analyzeState: AnalyzeState =
    currentProject.analysisStatus === "running"
      ? "running"
      : currentProject.analysisStatus === "ready"
        ? "done"
        : "idle";
  const analysis =
    currentProject.analyzedAt && currentProject.tasks.length
      ? projectToAnalysis(currentProject, language)
      : null;
  const actionError =
    uiError ||
    currentProject.analysisError ||
    "";
  const teamMembers = currentProject.members.map((item) => ({
    ...item,
    name: localize(item.name, language),
    role: localize(item.role, language),
    initials: localize(item.initials, language),
  }));

  const updateProject = (
    projectId: string,
    updater: (project: ProjectWorkspace) => ProjectWorkspace,
  ) => {
    setWorkspace((current) => {
      const project = current.projects[projectId];
      if (!project) return current;
      return {
        ...current,
        projects: {
          ...current.projects,
          [projectId]: updater(project),
        },
      };
    });
  };

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2600);
  };

  const navigateToSection = (index: number) => {
    const sectionIds = ["overview", "tasks", "risks", "documents"];
    setActiveNav(index);
    setMobileNav(false);
    window.requestAnimationFrame(() => {
      document.getElementById(sectionIds[index])?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    let restoredWorkspace: PersistedWorkspace | null = null;
    const savedWorkspace = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (savedWorkspace) {
      try {
        restoredWorkspace = normalizePersistedWorkspace(
          JSON.parse(savedWorkspace),
        );
      } catch {
        window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    }

    if (!restoredWorkspace) {
      const initial = cloneInitialWorkspace();
      const legacyAnalysis = window.localStorage.getItem(
        "teamalign:last-analysis",
      );
      if (legacyAnalysis) {
        try {
          const result = JSON.parse(legacyAnalysis) as AnalysisResult;
          result.meetingTitle = normalizeMeetingTitle(result.meetingTitle);
          initial.projects[initial.activeProjectId] = applyAnalysisToProject(
            initial.projects[initial.activeProjectId],
            result,
            "zh",
          );
          window.localStorage.removeItem("teamalign:last-analysis");
        } catch {
          window.localStorage.removeItem("teamalign:last-analysis");
        }
      }
      restoredWorkspace = initial;
    }

    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const hydrationTimer = window.setTimeout(() => {
      if (savedLanguage === "zh" || savedLanguage === "en") {
        setLanguage(savedLanguage);
      }
      setWorkspace(restoredWorkspace);
      setWorkspaceHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!workspaceHydrated) return;
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(workspace),
    );
  }, [workspace, workspaceHydrated]);

  useEffect(() => {
    const refreshHealth = () => {
      fetch("/api/health")
        .then((response) => response.json())
        .then(
          (health: {
            configured?: boolean;
            provider?: "openai" | "agnes";
            transcriptionConfigured?: boolean;
            transcriptionProvider?: "browser" | null;
          }) => {
            setApiConfigured(Boolean(health.configured));
            setApiProvider(health.provider === "openai" ? "openai" : "agnes");
            setTranscriptionConfigured(
              Boolean(health.transcriptionConfigured),
            );
            setTranscriptionProvider(
              health.transcriptionProvider === "browser" ? "browser" : null,
            );
          },
        )
        .catch(() => setApiConfigured(false));
    };

    refreshHealth();
    const healthTimer = window.setInterval(refreshHealth, 5000);
    return () => window.clearInterval(healthTimer);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
        setSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setProjectMenuOpen(false);
        setSearchOpen(false);
        setMobileSearchOpen(false);
        setNoticeOpen(false);
        setUtilityPanel(null);
      }
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!projectSwitcher.current?.contains(target)) {
        setProjectMenuOpen(false);
      }
      if (!searchWrapper.current?.contains(target)) {
        setSearchOpen(false);
        setMobileSearchOpen(false);
      }
      if (!noticeWrapper.current?.contains(target)) {
        setNoticeOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("mousedown", closeOnOutsideClick);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      if (switchTimer.current) window.clearTimeout(switchTimer.current);
    };
  }, []);

  const changeLanguage = () => {
    const next = language === "zh" ? "en" : "zh";
    setLanguage(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    setUiError("");
  };

  const runAnalysis = async () => {
    const projectId = currentProject.id;
    const requestId = crypto.randomUUID();
    const sourceRevision = currentProject.revision;
    const projectName = localize(currentProject.name, language);
    setUiError("");

    if (meetingMode === "text" && notes.trim().length < 20) {
      setUiError(
        language === "zh"
          ? "请提供至少 20 个字符的会议纪要。"
          : "Enter at least 20 characters of meeting notes.",
      );
      return;
    }

    if (meetingMode === "audio" && !currentProject.audioFileMeta) {
      setUiError(
        language === "zh"
          ? "请先选择一个音频文件。"
          : "Choose an audio file first.",
      );
      return;
    }

    updateProject(projectId, (project) => ({
      ...project,
      analysisStatus: "running",
      analysisRequestId: requestId,
      analysisError: undefined,
    }));

    try {
      const formData = new FormData();
      formData.set("language", language);
      formData.set("projectId", projectId);
      formData.set("projectName", projectName);

      if (meetingMode === "audio" && currentProject.audioFileMeta) {
        const meta = currentProject.audioFileMeta;
        const stored = await getBrowserAsset(meta.assetKey);
        if (!stored) {
          throw new Error(
            language === "zh"
              ? "未找到原音频，请重新选择文件。"
              : "The original audio is unavailable. Choose the file again.",
          );
        }
        const audioFile = new File([stored], meta.name, {
          type: meta.type,
          lastModified: meta.lastModified,
        });
        const transcript = await transcribeBrowserAudio(audioFile, language);
        if (transcript.length < 20) {
          throw new Error(
            language === "zh"
              ? "录音转写内容过短，请改用更清晰的录音或直接粘贴会议纪要。"
              : "The transcript is too short. Use a clearer recording or paste meeting notes.",
          );
        }
        formData.set("notes", transcript);
      } else {
        formData.set("notes", notes);
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let payload: (AnalysisResult & { message?: string }) | null = null;
      try {
        payload = JSON.parse(responseText) as AnalysisResult & {
          message?: string;
        };
      } catch {
        // Some development-server and proxy errors are plain text, not JSON.
      }

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            language === "zh"
              ? "录音文件过大，请使用不超过 25 MB 的 MP3、M4A、WAV 或 WEBM 文件。"
              : "Audio file is too large. Use an MP3, M4A, WAV or WEBM file under 25 MB.",
          );
        }
        throw new Error(
          payload?.message ||
            (language === "zh"
              ? "AI 分析失败，请稍后重试。"
              : "AI analysis failed. Please try again."),
        );
      }

      if (!payload) {
        throw new Error(
          language === "zh"
            ? "服务返回格式异常，请稍后重试。"
            : "The service returned an unexpected response. Please try again.",
        );
      }

      payload.meetingTitle = normalizeMeetingTitle(payload.meetingTitle);
      setWorkspace((current) => {
        const project = current.projects[projectId];
        if (!project || project.analysisRequestId !== requestId) return current;
        if (project.revision !== sourceRevision) {
          return {
            ...current,
            projects: {
              ...current.projects,
              [projectId]: {
                ...project,
                analysisStatus: project.analyzedAt ? "stale" : "idle",
                analysisRequestId: undefined,
              },
            },
          };
        }
        return {
          ...current,
          projects: {
            ...current.projects,
            [projectId]: applyAnalysisToProject(project, payload, language),
          },
        };
      });
      setApiConfigured(true);
      showToast(
        language === "zh"
          ? `「${projectName}」AI 分析已完成`
          : `AI analysis completed for “${projectName}”`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "AI 分析失败，请稍后重试。"
            : "AI analysis failed. Please try again.";
      updateProject(projectId, (project) =>
        project.analysisRequestId === requestId
          ? {
              ...project,
              analysisStatus: project.analyzedAt ? "stale" : "error",
              analysisRequestId: undefined,
              analysisError: message,
            }
          : project,
      );
    }
  };

  const generateReport = async () => {
    const projectId = currentProject.id;
    const reportType = docType;
    const reportLanguage = language;
    const requestId = crypto.randomUUID();
    const sourceRevision = currentProject.revision;
    const currentAnalysis = projectToAnalysis(currentProject, language);

    if (!currentAnalysis.summary || !currentAnalysis.tasks.length) {
      const message =
        language === "zh"
          ? "请先上传并完成一次真实的会议分析。"
          : "Run a live meeting analysis before generating a report.";
      updateProject(projectId, (project) => ({
        ...project,
        documents: {
          ...project.documents,
          [reportType]: {
            status: "error",
            language: reportLanguage,
            error: message,
          },
        },
      }));
      setUiError("");
      return;
    }

    setUiError("");
    updateProject(projectId, (project) => ({
      ...project,
      documents: {
        ...project.documents,
        [reportType]: {
          status: "generating",
          language: reportLanguage,
          requestId,
          sourceRevision,
        },
      },
    }));

    try {
      const reportPayload = {
        projectId,
        projectName: localize(currentProject.name, reportLanguage),
        projectContext: {
          phase: localize(currentProject.phase, reportLanguage),
          health: currentProject.health,
          progress: currentProject.progress,
          teamLoad: currentProject.teamLoad,
        },
        analysis: currentAnalysis,
        type: reportType,
        language: reportLanguage,
        revision: sourceRevision,
      };
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportPayload,
          mode: "preview",
        }),
      });
      if (!response.ok) {
        const responseText = await response.text();
        let payload: { message?: string } | null = null;
        try {
          payload = JSON.parse(responseText) as { message?: string };
        } catch {
          // Development proxies may return a plain-text error page.
        }
        throw new Error(
          payload?.message ||
            (language === "zh"
              ? "周报生成失败，请稍后重试。"
              : "Report generation failed. Please try again."),
        );
      }

      const previewPayload = (await response.json()) as { report?: unknown };
      if (!isGeneratedReport(previewPayload.report)) {
        throw new Error(
          reportLanguage === "zh"
            ? "报告预览结构不完整，请重新生成。"
            : "The report preview is incomplete. Generate it again.",
        );
      }
      const report = previewPayload.report;
      const documentResponse = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          type: reportType,
          language: reportLanguage,
          mode: "docx",
        }),
      });
      if (!documentResponse.ok) {
        const responseText = await documentResponse.text();
        let payload: { message?: string } | null = null;
        try {
          payload = JSON.parse(responseText) as { message?: string };
        } catch {
          // Development proxies may return a plain-text error page.
        }
        throw new Error(
          payload?.message ||
            (reportLanguage === "zh"
              ? "DOCX 文件生成失败，请稍后重试。"
              : "DOCX generation failed. Please try again."),
        );
      }

      const blob = await documentResponse.blob();
      const assetKey = `report:${projectId}:${reportType}:${reportLanguage}`;
      const fileName = `${
        reportType === "weekly"
          ? "TeamAlign-team-weekly"
          : "TeamAlign-client-progress"
      }-${projectId}-${reportLanguage}.docx`;
      await saveBrowserAsset(assetKey, blob);

      setWorkspace((current) => {
        const project = current.projects[projectId];
        const slot = project?.documents[reportType];
        if (!project || slot?.requestId !== requestId) return current;
        const isStale = project.revision !== sourceRevision;
        return {
          ...current,
          projects: {
            ...current.projects,
            [projectId]: {
              ...project,
              documents: {
                ...project.documents,
                [reportType]: {
                  status: isStale ? "stale" : "ready",
                  language: reportLanguage,
                  assetKey,
                  fileName,
                  generatedAt: new Date().toISOString(),
                  sourceRevision,
                  preview: report,
                },
              },
            },
          },
        };
      });
      showToast(
        language === "zh" ? "真实 DOCX 报告已生成" : "DOCX report generated",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "周报生成失败，请稍后重试。"
            : "Report generation failed. Please try again.";
      updateProject(projectId, (project) => {
        const slot = project.documents[reportType];
        if (slot.requestId !== requestId) return project;
        return {
          ...project,
          documents: {
            ...project.documents,
            [reportType]: {
              status: "error",
              language: reportLanguage,
              error: message,
            },
          },
        };
      });
    }
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      setUiError(
        language === "zh"
          ? "音频文件不能超过 25 MB。"
          : "Audio files must be under 25 MB.",
      );
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase();
    const supportedMimeTypes = new Set([
      "audio/mpeg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
    ]);
    if (
      !["mp3", "m4a", "wav", "webm"].includes(extension ?? "") &&
      !supportedMimeTypes.has(file.type.toLowerCase())
    ) {
      setUiError(
        language === "zh"
          ? "请选择 MP3、M4A、WAV 或 WEBM 音频文件。"
          : "Choose an MP3, M4A, WAV or WEBM audio file.",
      );
      return;
    }

    const projectId = currentProject.id;
    const assetKey = `audio:${projectId}`;
    try {
      await saveBrowserAsset(assetKey, file);
      updateProject(projectId, (project) => ({
        ...project,
        meetingMode: "audio",
        audioFileMeta: {
          assetKey,
          name: file.name,
          size: file.size,
          type: file.type || "audio/mpeg",
          lastModified: file.lastModified,
        },
        analysisStatus: project.analyzedAt ? "stale" : "idle",
        documents: markDocumentsStale(project.documents),
        updatedAt: new Date().toISOString(),
        revision: project.revision + 1,
      }));
      setUiError("");
    } catch (error) {
      setUiError(
        error instanceof Error
          ? error.message
          : language === "zh"
            ? "音频保存失败，请重新选择。"
            : "Could not save the audio. Choose it again.",
      );
    }
  };

  const removeFile = async () => {
    const projectId = currentProject.id;
    const assetKey = currentProject.audioFileMeta?.assetKey;
    if (assetKey) await deleteBrowserAsset(assetKey).catch(() => undefined);
    updateProject(projectId, (project) => ({
      ...project,
      audioFileMeta: null,
      analysisStatus: project.analyzedAt ? "stale" : "idle",
      documents: markDocumentsStale(project.documents),
      updatedAt: new Date().toISOString(),
      revision: project.revision + 1,
    }));
    if (fileInput.current) fileInput.current.value = "";
  };

  const downloadReport = async () => {
    const failDownload = (message: string) => {
      updateProject(currentProject.id, (project) => ({
        ...project,
        documents: {
          ...project.documents,
          [docType]: {
            ...project.documents[docType],
            status: "stale",
            error: message,
          },
        },
      }));
    };

    if (!activeReport.assetKey) {
      const message =
        language === "zh"
          ? "当前报告已过期或文件不存在，请重新生成。"
          : "This report is stale or unavailable. Generate it again.";
      failDownload(message);
      return;
    }
    let blob: Blob | null = null;
    try {
      blob = await getBrowserAsset(activeReport.assetKey);
    } catch {
      failDownload(
        language === "zh"
          ? "无法读取本机报告文件，请重新生成。"
          : "The saved report could not be read. Generate it again.",
      );
      return;
    }
    if (!blob) {
      const message =
        language === "zh"
          ? "未找到报告文件，请重新生成。"
          : "The report file is unavailable. Generate it again.";
      failDownload(message);
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      activeReport.fileName ??
      `${docType === "weekly" ? "TeamAlign-team-weekly" : "TeamAlign-client-progress"}.docx`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const boardColumns = (["todo", "doing", "review"] as const).map((key) => ({
    key,
    items: currentProject.tasks
      .filter((task) => task.status === key)
      .map((task) => ({
        id: task.id,
        title: localize(task.title, language),
        tag: `${localize(task.role, language)} · ${task.priority}`,
        name: localize(task.assignee, language),
        initials: localize(task.assignee, language).slice(0, 2),
        time: task.estimatedHours,
        date: localize(task.dueDate, language),
        progress: task.progress,
      })),
  }));

  const riskItems = currentProject.risks.map((risk) => ({
    id: risk.id,
    level: risk.severity,
    title: localize(risk.title, language),
    text: localize(risk.description, language),
    meta: `${risk.type.toUpperCase()} · ${localize(risk.dueDate, language)} · ${localize(risk.suggestedAction, language)}`,
    read: risk.read,
  }));

  const switchProject = (projectId: string) => {
    if (projectId === currentProject.id) {
      setProjectMenuOpen(false);
      return;
    }
    const target = workspace.projects[projectId];
    if (!target) return;
    setProjectSwitching(true);
    setWorkspace((current) => ({ ...current, activeProjectId: projectId }));
    setProjectMenuOpen(false);
    setNoticeOpen(false);
    setUtilityPanel(null);
    setSearchQuery("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setUiError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (switchTimer.current) window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(
      () => setProjectSwitching(false),
      190,
    );
    showToast(
      language === "zh"
        ? `已切换至「${localize(target.name, language)}」`
        : `Switched to “${localize(target.name, language)}”`,
    );
  };

  const setMeetingModeForProject = (mode: MeetingMode) => {
    updateProject(currentProject.id, (project) => ({
      ...project,
      meetingMode: mode,
    }));
    setUiError("");
  };

  const updateNotes = (value: string) => {
    const projectId = currentProject.id;
    updateProject(projectId, (project) => ({
      ...project,
      notes: { ...project.notes, [language]: value },
      updatedAt: new Date().toISOString(),
      analysisStatus: project.analyzedAt ? "stale" : "idle",
      analysisError: undefined,
      documents: markDocumentsStale(project.documents),
      revision: project.revision + 1,
    }));
    setUiError("");
  };

  const selectDocumentType = (type: DocType) => {
    updateProject(currentProject.id, (project) => ({
      ...project,
      documents: { ...project.documents, selectedType: type },
    }));
    setUiError("");
  };

  const openTaskEditor = (
    taskId?: string,
    defaultStatus: WorkspaceTask["status"] = "todo",
  ) => {
    const task = taskId
      ? currentProject.tasks.find((item) => item.id === taskId)
      : undefined;
    setTaskDraft(
      task
        ? {
            id: task.id,
            title: localize(task.title, language),
            role: localize(task.role, language),
            assignee: localize(task.assignee, language),
            estimatedHours: task.estimatedHours,
            dueDate: localize(task.dueDate, language),
            status: task.status,
            priority: task.priority,
            progress: task.progress,
          }
        : {
            title: "",
            role: language === "zh" ? "待分配岗位" : "Unassigned role",
            assignee: language === "zh" ? "待分配" : "Unassigned",
            estimatedHours: 4,
            dueDate: "",
            status: defaultStatus,
            priority: "P1",
            progress: defaultStatus === "review" ? 100 : 0,
          },
    );
    setUtilityPanel("task");
    setUiError("");
  };

  const saveTask = () => {
    if (!taskDraft?.title.trim()) {
      setUiError(
        language === "zh" ? "请填写任务名称。" : "Enter a task title.",
      );
      return;
    }

    const projectId = currentProject.id;
    updateProject(projectId, (project) => {
      const existing = taskDraft.id
        ? project.tasks.find((item) => item.id === taskDraft.id)
        : undefined;
      const localized = (
        value: string,
        previous?: LocalizedText,
      ): LocalizedText =>
        previous
          ? { ...previous, [language]: value.trim() }
          : { zh: value.trim(), en: value.trim() };
      const nextTask: WorkspaceTask = {
        id: existing?.id ?? `task-${Date.now().toString(36)}`,
        title: localized(taskDraft.title, existing?.title),
        role: localized(taskDraft.role, existing?.role),
        assignee: localized(taskDraft.assignee, existing?.assignee),
        estimatedHours: Math.max(1, Number(taskDraft.estimatedHours) || 1),
        dueDate: localized(taskDraft.dueDate || "待确认", existing?.dueDate),
        status: taskDraft.status,
        priority: taskDraft.priority,
        rationale:
          existing?.rationale ??
          localized(
            language === "zh" ? "由项目成员手动添加" : "Added manually",
          ),
        progress:
          taskDraft.status === "review"
            ? 100
            : taskDraft.status === "todo"
              ? 0
              : Math.min(99, Math.max(1, taskDraft.progress || 1)),
        source: "manual",
      };
      return recalculateProjectMetrics({
        ...project,
        tasks: existing
          ? project.tasks.map((item) =>
              item.id === nextTask.id ? nextTask : item,
            )
          : [...project.tasks, nextTask],
        updatedAt: new Date().toISOString(),
        revision: project.revision + 1,
        documents: markDocumentsStale(project.documents),
      }, project);
    });
    setUtilityPanel(null);
    setTaskDraft(null);
    setUiError("");
    showToast(
      language === "zh"
        ? taskDraft.id
          ? "任务已更新"
          : "任务已添加"
        : taskDraft.id
          ? "Task updated"
          : "Task added",
    );
  };

  const deleteTask = () => {
    if (!taskDraft?.id) return;
    const confirmed = window.confirm(
      language === "zh"
        ? "确定删除这个任务吗？此操作无法撤销。"
        : "Delete this task? This cannot be undone.",
    );
    if (!confirmed) return;
    updateProject(currentProject.id, (project) => recalculateProjectMetrics({
      ...project,
      tasks: project.tasks.filter((item) => item.id !== taskDraft.id),
      risks: project.risks.map((item) => ({
        ...item,
        affectedTasks: item.affectedTasks.filter(
          (taskId) => taskId !== taskDraft.id,
        ),
      })),
      updatedAt: new Date().toISOString(),
      revision: project.revision + 1,
      documents: markDocumentsStale(project.documents),
    }, project));
    setUtilityPanel(null);
    setTaskDraft(null);
    showToast(language === "zh" ? "任务已删除" : "Task deleted");
  };

  const openRiskDetail = (riskId: string) => {
    setSelectedRiskId(riskId);
    setUtilityPanel("risk");
    updateProject(currentProject.id, (project) => ({
      ...project,
      risks: project.risks.map((risk) =>
        risk.id === riskId ? { ...risk, read: true } : risk,
      ),
    }));
  };

  const toggleRiskResolved = () => {
    if (!selectedRiskId) return;
    updateProject(currentProject.id, (project) => recalculateProjectMetrics({
      ...project,
      risks: project.risks.map((risk) =>
        risk.id === selectedRiskId
          ? {
              ...risk,
              severity:
                risk.severity === "resolved"
                  ? risk.previousSeverity ?? "medium"
                  : "resolved",
              previousSeverity:
                risk.severity === "resolved"
                  ? risk.previousSeverity
                  : risk.severity,
              read: true,
            }
          : risk,
      ),
      updatedAt: new Date().toISOString(),
      revision: project.revision + 1,
      documents: markDocumentsStale(project.documents),
    }, project));
    setUtilityPanel(null);
    showToast(
      language === "zh" ? "风险状态已更新" : "Risk status updated",
    );
  };

  const markAllNotificationsRead = () => {
    updateProject(currentProject.id, (project) => ({
      ...project,
      risks: project.risks.map((risk) => ({ ...risk, read: true })),
    }));
  };

  const openCreateProject = () => {
    setProjectDraft({
      name: "",
      client: "",
      owner: language === "zh" ? "林晓" : "Lin Xiao",
      startDate: localDateValue(),
      endDate: "",
    });
    setProjectMenuOpen(false);
    setUtilityPanel("project");
    setUiError("");
  };

  const handleProjectSwitcherKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setProjectMenuOpen(true);
    const selectedIndex = Math.max(
      0,
      projectOptions.findIndex((project) => project.id === currentProject.id),
    );
    const nextIndex =
      event.key === "ArrowUp" ? projectOptions.length : selectedIndex;
    window.requestAnimationFrame(() =>
      projectOptionRefs.current[nextIndex]?.focus(),
    );
  };

  const handleProjectMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const itemCount = projectOptions.length + 1;
    const activeIndex = projectOptionRefs.current.findIndex(
      (item) => item === document.activeElement,
    );
    let nextIndex = activeIndex;

    if (event.key === "ArrowDown") {
      nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % itemCount;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        activeIndex < 0
          ? itemCount - 1
          : (activeIndex - 1 + itemCount) % itemCount;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = itemCount - 1;
    } else if (event.key === "Escape") {
      event.preventDefault();
      setProjectMenuOpen(false);
      projectButton.current?.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    projectOptionRefs.current[nextIndex]?.focus();
  };

  const saveProject = () => {
    if (!projectDraft.name.trim() || !projectDraft.owner.trim()) {
      setUiError(
        language === "zh"
          ? "请填写项目名称和项目负责人。"
          : "Enter a project name and project lead.",
      );
      return;
    }
    if (
      projectDraft.startDate &&
      projectDraft.endDate &&
      projectDraft.endDate < projectDraft.startDate
    ) {
      setUiError(
        language === "zh"
          ? "目标日期不能早于开始日期。"
          : "The target date cannot be earlier than the start date.",
      );
      return;
    }
    const project = createEmptyProject(
      projectDraft.name,
      projectDraft.owner,
    );
    const client = projectDraft.client.trim();
    const nextProject: ProjectWorkspace = {
      ...project,
      client: client
        ? { zh: client, en: client }
        : project.client,
      startDate: projectDraft.startDate || project.startDate,
      endDate: projectDraft.endDate,
    };
    setWorkspace((current) => ({
      ...current,
      activeProjectId: nextProject.id,
      projects: { ...current.projects, [nextProject.id]: nextProject },
    }));
    setActiveNav(0);
    setUtilityPanel(null);
    setUiError("");
    showToast(
      language === "zh"
        ? `项目「${projectDraft.name.trim()}」已创建`
        : `Project “${projectDraft.name.trim()}” created`,
    );
  };

  const selectedRisk = selectedRiskId
    ? currentProject.risks.find((risk) => risk.id === selectedRiskId)
    : undefined;
  const unreadRiskCount = currentProject.risks.filter(
    (risk) => risk.severity !== "resolved" && !risk.read,
  ).length;
  const searchNeedle = searchQuery.trim().toLocaleLowerCase();
  const searchResults = searchNeedle
    ? [
        ...currentProject.tasks
          .filter((task) =>
            [
              localize(task.title, language),
              localize(task.role, language),
              localize(task.assignee, language),
            ]
              .join(" ")
              .toLocaleLowerCase()
              .includes(searchNeedle),
          )
          .map((task) => ({
            kind: "task" as const,
            id: task.id,
            title: localize(task.title, language),
            meta: `${localize(task.assignee, language)} · ${task.priority}`,
          })),
        ...currentProject.risks
          .filter((risk) =>
            [localize(risk.title, language), localize(risk.description, language)]
              .join(" ")
              .toLocaleLowerCase()
              .includes(searchNeedle),
          )
          .map((risk) => ({
            kind: "risk" as const,
            id: risk.id,
            title: localize(risk.title, language),
            meta:
              risk.severity === "resolved"
                ? t.resolved
                : risk.severity === "high"
                  ? t.high
                  : t.medium,
          })),
        ...currentProject.members
          .filter((member) =>
            [localize(member.name, language), localize(member.role, language)]
              .join(" ")
              .toLocaleLowerCase()
              .includes(searchNeedle),
          )
          .map((member) => ({
            kind: "member" as const,
            id: member.id,
            title: localize(member.name, language),
            meta: localize(member.role, language),
          })),
        ...(["weekly", "client"] as const)
          .map((type) => ({
            kind: "document" as const,
            id: type,
            title: type === "weekly" ? t.weekly : t.client,
            meta:
              currentProject.documents[type].status === "ready" &&
              currentProject.documents[type].language === language
                ? language === "zh"
                  ? "DOCX 已生成"
                  : "DOCX ready"
                : language === "zh"
                  ? "基于当前项目实时生成"
                  : "Generated from current project",
          }))
          .filter((document) =>
            `${document.title} ${document.meta} ${
              language === "zh" ? "文档 报告 周报 汇报" : "document report brief"
            }`
              .toLocaleLowerCase()
              .includes(searchNeedle),
          ),
      ].slice(0, 8)
    : [];

  const taskCount = boardColumns.reduce((total, column) => total + column.items.length, 0);
  const openRiskCount = riskItems.filter((risk) => risk.level !== "resolved").length;
  const highRiskCount = riskItems.filter((risk) => risk.level === "high").length;
  const focusedView = activeNav === 1
    ? {
        Icon: ClipboardList,
        eyebrow: language === "zh" ? "PROJECT EXECUTION · 项目执行" : "PROJECT EXECUTION",
        title: t.taskTitle,
        description: language === "zh"
          ? "按岗位、负责人和交付阶段管理 AI 拆解的执行任务。"
          : "Manage AI-generated work by role, owner and delivery stage.",
        metrics: [
          { value: String(taskCount), label: language === "zh" ? "已拆分任务" : "Generated tasks" },
          { value: String(new Set(currentProject.tasks.map((task) => localize(task.role, language))).size), label: language === "zh" ? "协作岗位" : "Active roles" },
          { value: `${currentProject.progress}%`, label: language === "zh" ? "整体进度" : "Progress" },
        ],
        tone: "teal",
      }
    : activeNav === 2
      ? {
          Icon: ShieldAlert,
          eyebrow: language === "zh" ? "DELIVERY CONTROL · 交付管控" : "DELIVERY CONTROL",
          title: t.risksTitle,
          description: language === "zh"
            ? "集中查看工期、资源与依赖风险，优先处理高影响事项。"
            : "Review schedule, resource and dependency risks by impact.",
          metrics: [
            { value: String(openRiskCount), label: language === "zh" ? "待处理风险" : "Open risks" },
            { value: String(highRiskCount), label: language === "zh" ? "高风险" : "High priority" },
            { value: language === "zh" ? "实时" : "Live", label: language === "zh" ? "扫描状态" : "Scan status" },
          ],
          tone: "coral",
        }
      : activeNav === 3
        ? {
            Icon: FileText,
            eyebrow: language === "zh" ? "REPORTING CENTER · 汇报中心" : "REPORTING CENTER",
            title: t.docsTitle,
            description: language === "zh"
              ? "基于最新项目进度生成内部复盘与客户进展简报。"
              : "Turn live project progress into internal and client-ready reports.",
            metrics: [
              { value: "2", label: language === "zh" ? "报告模板" : "Report types" },
              { value: "DOCX", label: language === "zh" ? "导出格式" : "Export format" },
              { value: activeReport.status === "ready" ? language === "zh" ? "已生成" : "Ready" : language === "zh" ? "实时" : "Live", label: language === "zh" ? "项目数据" : "Project data" },
            ],
            tone: "violet",
          }
        : null;
  const FocusedViewIcon = focusedView?.Icon ?? LayoutDashboard;
  const statusLabel =
    currentProject.status === "active"
      ? language === "zh"
        ? "进行中"
        : "Active"
      : currentProject.status === "planning"
        ? language === "zh"
          ? "规划中"
          : "Planning"
        : language === "zh"
          ? "已暂停"
          : "Paused";
  const highestLoadMember = [...teamMembers].sort(
    (a, b) => b.load - a.load,
  )[0];
  const utilityTitle =
    utilityPanel === "team"
      ? language === "zh"
        ? "项目成员"
        : "Project team"
      : utilityPanel === "help"
        ? language === "zh"
          ? "帮助中心"
          : "Help center"
        : utilityPanel === "settings"
          ? language === "zh"
            ? "设置"
            : "Settings"
          : utilityPanel === "project"
            ? language === "zh"
              ? "新建项目"
              : "Create project"
            : utilityPanel === "task"
              ? taskDraft?.id
                ? language === "zh"
                  ? "任务详情"
                  : "Task details"
                : language === "zh"
                  ? "添加任务"
                  : "Add task"
              : utilityPanel === "risk"
                ? language === "zh"
                  ? "风险详情"
                  : "Risk details"
                : language === "zh"
                  ? "账号信息"
                  : "Account";
  const draftAssigneeNeedsOption =
    Boolean(taskDraft?.assignee) &&
    taskDraft?.assignee !== (language === "zh" ? "待分配" : "Unassigned") &&
    !teamMembers.some((member) => member.name === taskDraft?.assignee);

  return (
    <div className={`app-shell active-view-${activeNav}`}>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-mark" aria-label="TeamAlign AI">
          <span className="brand-glyph"><i /><i /></span>
          <div className="brand-text">
            <div className="brand-name">
              <strong>TeamAlign</strong>
              <small>AI</small>
            </div>
            <span className="brand-subtitle">协齐 AI 项目协作助手</span>
          </div>
        </div>

        <nav className="primary-nav" aria-label={t.workspace}>
          {[LayoutDashboard, ClipboardList, ShieldAlert, FileText].map((Icon, index) => (
            <button
              className={`nav-item ${index === activeNav ? "active" : ""}`}
              key={t.nav[index]}
              onClick={() => navigateToSection(index)}
              aria-current={index === activeNav ? "page" : undefined}
            >
              <span className="nav-icon"><Icon size={19} strokeWidth={1.8} /></span>
              <span>{t.nav[index]}</span>
              {index === 2 && openRiskCount > 0 && <b className="nav-count">{openRiskCount}</b>}
            </button>
          ))}
        </nav>

        <button
          className="sidebar-project team-summary-button"
          onClick={() => setUtilityPanel("team")}
          aria-label={language === "zh" ? "查看项目成员" : "View project team"}
        >
          <p>{language === "zh" ? "项目成员" : "Project team"}</p>
          <div className="avatar-stack" aria-label="Team members">
            {teamMembers.slice(0, 3).map((member) => (
              <span className={`avatar ${member.tone}`} key={member.id}>{member.initials}</span>
            ))}
            {teamMembers.length > 3 && <span className="avatar more">+{teamMembers.length - 3}</span>}
          </div>
        </button>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setUtilityPanel("help")}><CircleHelp size={19} /><span>{language === "zh" ? "帮助中心" : "Help"}</span></button>
          <button className="nav-item" onClick={() => setUtilityPanel("settings")}><Settings size={19} /><span>{language === "zh" ? "设置" : "Settings"}</span></button>
          <button className="account" onClick={() => setUtilityPanel("account")} aria-label={language === "zh" ? "打开账号菜单" : "Open account menu"}>
            <span className="avatar owner">林</span>
            <div><strong>{language === "zh" ? "林晓" : "Lin Xiao"}</strong><small>{language === "zh" ? "项目负责人" : "Project lead"}</small></div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      {mobileNav && <button aria-label="Close menu" className="nav-scrim" onClick={() => setMobileNav(false)} />}

      {utilityPanel && (
        <div className="utility-backdrop" onMouseDown={() => setUtilityPanel(null)}>
          <section
            className="utility-panel"
            role="dialog"
            aria-modal="true"
            aria-label={utilityTitle}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="utility-panel-header">
              <div>
                <span>{language === "zh" ? "TeamAlign 工作空间" : "TeamAlign workspace"}</span>
                <h2>{utilityTitle}</h2>
              </div>
              <button onClick={() => setUtilityPanel(null)} aria-label={language === "zh" ? "关闭" : "Close"}><X size={18} /></button>
            </header>

            {utilityPanel === "team" && (
              <div className="member-list">
                {teamMembers.map((member) => (
                  <article className="member-row" key={member.name}>
                    <span className={`avatar ${member.tone}`}>{member.initials}</span>
                    <div><strong>{member.name}</strong><small>{member.role}</small></div>
                    <span className={`load-value ${member.load >= 90 ? "high" : ""}`}>{member.load}%</span>
                    <span className="member-load"><i style={{ width: `${member.load}%` }} /></span>
                  </article>
                ))}
                <p className="panel-note">
                  {highestLoadMember
                    ? language === "zh"
                      ? `${highestLoadMember.name}当前负载为 ${highestLoadMember.load}%${highestLoadMember.load >= 90 ? "，系统已在风险洞察中标记。" : "，团队资源仍处于可控范围。"}`
                      : `${highestLoadMember.name} is at ${highestLoadMember.load}% capacity${highestLoadMember.load >= 90 ? " and is flagged in Risk Insights." : "; team capacity remains manageable."}`
                    : language === "zh"
                      ? "当前项目尚未添加成员。"
                      : "No members have been added to this project."}
                </p>
              </div>
            )}

            {utilityPanel === "help" && (
              <div className="help-flow">
                {[
                  {
                    Icon: FileAudio,
                    title: language === "zh" ? "上传会议内容" : "Upload meeting content",
                    text: language === "zh" ? "粘贴会议纪要，或上传 MP3、M4A、WAV、WEBM 录音。" : "Paste notes or upload MP3, M4A, WAV or WEBM audio.",
                  },
                  {
                    Icon: Bot,
                    title: language === "zh" ? "运行 AI 解析" : "Run AI analysis",
                    text: language === "zh" ? "自动转写、总结，并按岗位拆分任务与负责人。" : "Transcribe, summarize and assign work by role.",
                  },
                  {
                    Icon: FileText,
                    title: language === "zh" ? "检查并导出" : "Review and export",
                    text: language === "zh" ? "在风险与文档视图检查结果，再导出团队或客户周报。" : "Review risks and export an internal or client report.",
                  },
                ].map(({ Icon, title, text }, index) => (
                  <article key={title}>
                    <span><Icon size={18} /></span>
                    <div><small>0{index + 1}</small><strong>{title}</strong><p>{text}</p></div>
                  </article>
                ))}
                <button className="primary-button panel-action" onClick={() => { setUtilityPanel(null); navigateToSection(0); }}>
                  <WandSparkles size={16} />{language === "zh" ? "开始会议分析" : "Start meeting analysis"}
                </button>
              </div>
            )}

            {utilityPanel === "settings" && (
              <div className="settings-list">
                <div className="settings-row">
                  <div><strong>{language === "zh" ? "界面语言" : "Interface language"}</strong><small>{language === "zh" ? "仅切换界面文案，不覆盖项目内容" : "Changes interface labels without overwriting project data"}</small></div>
                  <div className="settings-segmented">
                    <button className={language === "zh" ? "active" : ""} onClick={() => language !== "zh" && changeLanguage()}>中文</button>
                    <button className={language === "en" ? "active" : ""} onClick={() => language !== "en" && changeLanguage()}>EN</button>
                  </div>
                </div>
                <div className="settings-row">
                  <div><strong>{language === "zh" ? "浏览器本地转写" : "Browser-local transcription"}</strong><small>Whisper base · on this device</small></div>
                  <span className="service-pill ready">
                    <span />{language === "zh" ? "可用" : "Available"}
                  </span>
                </div>
                <div className="settings-row">
                  <div><strong>{language === "zh" ? "AI 文本分析" : "AI text analysis"}</strong><small>{apiProvider === "agnes" ? "Agnes · agnes-2.0-flash" : "OpenAI"}</small></div>
                  <span className={`service-pill ${apiConfigured ? "ready" : ""}`}>
                    <span />{apiConfigured ? language === "zh" ? "已连接" : "Connected" : language === "zh" ? "待配置" : "Needs setup"}
                  </span>
                </div>
                <div className="settings-row">
                  <div><strong>{language === "zh" ? "本地数据" : "Local data"}</strong><small>{language === "zh" ? "项目记录、音频与报告按项目独立保存" : "Project records, audio and reports are stored separately"}</small></div>
                  <span className="service-pill ready"><span />{language === "zh" ? "自动保存" : "Auto-saved"}</span>
                </div>
              </div>
            )}

            {utilityPanel === "account" && (
              <div className="account-panel">
                <span className="avatar owner account-avatar">林</span>
                <div><h3>{language === "zh" ? "林晓" : "Lin Xiao"}</h3><p>{language === "zh" ? `工作空间管理员 · ${localize(currentProject.client, language) || localize(currentProject.name, language)}` : `Workspace admin · ${localize(currentProject.client, language) || localize(currentProject.name, language)}`}</p></div>
                <dl>
                  <div><dt>{language === "zh" ? "当前项目" : "Current project"}</dt><dd>{localize(currentProject.name, language)}</dd></div>
                  <div><dt>{language === "zh" ? "团队角色" : "Workspace role"}</dt><dd>{language === "zh" ? "管理员" : "Admin"}</dd></div>
                </dl>
                <button className="secondary-button panel-action" onClick={() => setUtilityPanel("settings")}>
                  <Settings size={16} />{language === "zh" ? "打开偏好设置" : "Open preferences"}
                </button>
              </div>
            )}

            {utilityPanel === "project" && (
              <div className="editor-form">
                <div className="editor-intro">
                  <span className="editor-intro-icon"><FolderPlus size={20} /></span>
                  <div><strong>{language === "zh" ? "建立独立项目空间" : "Create an isolated workspace"}</strong><p>{language === "zh" ? "会议、任务、风险和文档都会单独保存。" : "Meetings, tasks, risks and documents stay separate."}</p></div>
                </div>
                <label><span>{language === "zh" ? "项目名称" : "Project name"}</span><input value={projectDraft.name} onChange={(event) => setProjectDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder={language === "zh" ? "例如：7月会员日增长项目" : "e.g. July Membership Growth"} autoFocus /></label>
                <label><span>{language === "zh" ? "客户 / 业务线" : "Client / business unit"}</span><input value={projectDraft.client} onChange={(event) => setProjectDraft((draft) => ({ ...draft, client: event.target.value }))} placeholder={language === "zh" ? "可选" : "Optional"} /></label>
                <label><span>{language === "zh" ? "项目负责人" : "Project lead"}</span><input value={projectDraft.owner} onChange={(event) => setProjectDraft((draft) => ({ ...draft, owner: event.target.value }))} /></label>
                <div className="editor-grid">
                  <label><span>{language === "zh" ? "开始日期" : "Start date"}</span><input type="date" value={projectDraft.startDate} onChange={(event) => setProjectDraft((draft) => ({ ...draft, startDate: event.target.value }))} /></label>
                  <label><span>{language === "zh" ? "目标日期" : "Target date"}</span><input type="date" value={projectDraft.endDate} onChange={(event) => setProjectDraft((draft) => ({ ...draft, endDate: event.target.value }))} /></label>
                </div>
                {uiError && <p className="editor-error"><AlertTriangle size={14} />{uiError}</p>}
                <button className="primary-button panel-action" onClick={saveProject}><FolderPlus size={16} />{language === "zh" ? "创建并进入项目" : "Create and open project"}</button>
              </div>
            )}

            {utilityPanel === "task" && taskDraft && (
              <div className="editor-form">
                <label><span>{language === "zh" ? "任务名称" : "Task title"}</span><input value={taskDraft.title} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, title: event.target.value } : draft)} autoFocus /></label>
                <div className="editor-grid">
                  <label><span>{language === "zh" ? "岗位" : "Role"}</span><input value={taskDraft.role} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, role: event.target.value } : draft)} /></label>
                  <label><span>{language === "zh" ? "负责人" : "Owner"}</span><select value={taskDraft.assignee} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, assignee: event.target.value } : draft)}><option value={language === "zh" ? "待分配" : "Unassigned"}>{language === "zh" ? "待分配" : "Unassigned"}</option>{draftAssigneeNeedsOption && <option value={taskDraft.assignee}>{taskDraft.assignee} · {language === "zh" ? "当前负责人" : "Current owner"}</option>}{teamMembers.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select></label>
                </div>
                <div className="editor-grid">
                  <label><span>{language === "zh" ? "状态" : "Status"}</span><select value={taskDraft.status} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, status: event.target.value as WorkspaceTask["status"] } : draft)}><option value="todo">{t.todo}</option><option value="doing">{t.doing}</option><option value="review">{t.review}</option></select></label>
                  <label><span>{language === "zh" ? "优先级" : "Priority"}</span><select value={taskDraft.priority} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, priority: event.target.value as WorkspaceTask["priority"] } : draft)}><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option></select></label>
                </div>
                <div className="editor-grid">
                  <label><span>{language === "zh" ? "预估工时" : "Estimated hours"}</span><input type="number" min="1" max="200" value={taskDraft.estimatedHours} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, estimatedHours: Number(event.target.value) } : draft)} /></label>
                  <label><span>{language === "zh" ? "截止日期" : "Due date"}</span><input value={taskDraft.dueDate} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, dueDate: event.target.value } : draft)} placeholder={language === "zh" ? "例如：6月18日" : "e.g. Jun 18"} /></label>
                </div>
                {taskDraft.status === "doing" && <label><span>{language === "zh" ? `完成进度 ${taskDraft.progress}%` : `Progress ${taskDraft.progress}%`}</span><input className="range-input" type="range" min="1" max="99" value={taskDraft.progress} onChange={(event) => setTaskDraft((draft) => draft ? { ...draft, progress: Number(event.target.value) } : draft)} /></label>}
                {uiError && <p className="editor-error"><AlertTriangle size={14} />{uiError}</p>}
                <div className="editor-actions">
                  {taskDraft.id && <button className="danger-button" onClick={deleteTask}><Trash2 size={15} />{language === "zh" ? "删除" : "Delete"}</button>}
                  <button className="primary-button" onClick={saveTask}><Save size={15} />{language === "zh" ? "保存任务" : "Save task"}</button>
                </div>
              </div>
            )}

            {utilityPanel === "risk" && selectedRisk && (
              <div className="risk-detail">
                <div className={`risk-detail-status ${selectedRisk.severity}`}>
                  <span className="risk-signal">{selectedRisk.severity === "high" ? <AlertTriangle size={16} /> : selectedRisk.severity === "medium" ? <Clock3 size={16} /> : <Check size={16} />}</span>
                  <div><small>{selectedRisk.type.toUpperCase()}</small><strong>{localize(selectedRisk.title, language)}</strong></div>
                </div>
                <section><span>{language === "zh" ? "风险说明" : "Risk description"}</span><p>{localize(selectedRisk.description, language)}</p></section>
                <section><span>{language === "zh" ? "影响任务" : "Affected tasks"}</span><div className="affected-task-list">{selectedRisk.affectedTasks.length ? selectedRisk.affectedTasks.map((taskId) => <button key={taskId} onClick={() => { const task = currentProject.tasks.find((item) => item.id === taskId); if (task) openTaskEditor(task.id); }}>{localize(currentProject.tasks.find((item) => item.id === taskId)?.title ?? { zh: taskId, en: taskId }, language)}</button>) : <p>{language === "zh" ? "暂无关联任务" : "No linked tasks"}</p>}</div></section>
                <section className="risk-advice"><span><Sparkles size={13} />{language === "zh" ? "AI 建议" : "AI recommendation"}</span><p>{localize(selectedRisk.suggestedAction, language)}</p><small>{language === "zh" ? "目标时间" : "Target"} · {localize(selectedRisk.dueDate, language)}</small></section>
                <button className={`panel-action ${selectedRisk.severity === "resolved" ? "secondary-button" : "primary-button"}`} onClick={toggleRiskResolved}>{selectedRisk.severity === "resolved" ? <><Clock3 size={16} />{language === "zh" ? "重新打开风险" : "Reopen risk"}</> : <><CheckCircle2 size={16} />{language === "zh" ? "标记为已缓解" : "Mark as mitigated"}</>}</button>
              </div>
            )}
          </section>
        </div>
      )}

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22} /></button>
            <span className="workspace-label">{t.workspace}</span>
            <span className="crumb">/</span>
            <div className="project-switcher-wrap" ref={projectSwitcher}>
              <button
                className={`project-switcher ${projectMenuOpen ? "open" : ""} ${projectSwitching ? "switching" : ""}`}
                onClick={() => setProjectMenuOpen((open) => !open)}
                onKeyDown={handleProjectSwitcherKeyDown}
                ref={projectButton}
                disabled={projectSwitching}
                aria-expanded={projectMenuOpen}
                aria-haspopup="menu"
              >
                {projectSwitching ? <LoaderCircle className="spin" size={15} /> : <span className="project-dot" style={{ background: currentProject.color }} />}
                <span>{localize(currentProject.name, language)}</span>
                <ChevronDown className={projectMenuOpen ? "rotated" : ""} size={15} />
              </button>
              {projectMenuOpen && (
                <div className="project-menu" role="menu" onKeyDown={handleProjectMenuKeyDown} aria-label={language === "zh" ? "项目列表" : "Project list"}>
                  <p>{language === "zh" ? "切换项目" : "Switch project"}</p>
                  {projectOptions.map((project, index) => (
                    <button
                      className={project.id === currentProject.id ? "selected" : ""}
                      key={project.id}
                      ref={(element) => { projectOptionRefs.current[index] = element; }}
                      onClick={() => switchProject(project.id)}
                      role="menuitemradio"
                      aria-checked={project.id === currentProject.id}
                    >
                      <span className="project-option-dot" style={{ background: project.color }} />
                      <span>
                        <strong>{localize(project.name, language)}</strong>
                        <small>
                          {project.status === "active" ? language === "zh" ? "进行中" : "Active" : project.status === "planning" ? language === "zh" ? "规划中" : "Planning" : language === "zh" ? "已暂停" : "Paused"}
                          {" · "}{project.progress}%
                          {" · "}{project.risks.filter((risk) => risk.severity !== "resolved").length}{language === "zh" ? " 项风险" : " risks"}
                        </small>
                      </span>
                      {project.id === currentProject.id && <Check size={15} />}
                    </button>
                  ))}
                  <button className="project-create-button" ref={(element) => { projectOptionRefs.current[projectOptions.length] = element; }} role="menuitem" onClick={openCreateProject}>
                    <span className="project-create-icon"><Plus size={14} /></span>
                    <span><strong>{language === "zh" ? "新建项目" : "Create project"}</strong><small>{language === "zh" ? "建立独立任务、风险与文档空间" : "Start an isolated project workspace"}</small></span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className={`searchbox ${mobileSearchOpen ? "mobile-open" : ""}`} ref={searchWrapper}>
              <Search size={17} />
              <input ref={searchInput} aria-label={t.search} placeholder={t.search} value={searchQuery} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true); }} />
              <kbd>⌘ K</kbd>
              {mobileSearchOpen && <button className="mobile-search-close" onClick={() => { setMobileSearchOpen(false); setSearchOpen(false); setSearchQuery(""); }} aria-label={language === "zh" ? "关闭搜索" : "Close search"}><X size={17} /></button>}
              {searchOpen && searchQuery.trim() && (
                <div className="search-results">
                  <div className="search-results-head"><span>{language === "zh" ? "当前项目内搜索" : "Search current project"}</span><small>{localize(currentProject.name, language)}</small></div>
                  {searchResults.length ? searchResults.map((result) => (
                    <button key={`${result.kind}-${result.id}`} onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      if (result.kind === "task") openTaskEditor(result.id);
                      if (result.kind === "risk") openRiskDetail(result.id);
                      if (result.kind === "member") setUtilityPanel("team");
                      if (result.kind === "document") {
                        selectDocumentType(result.id as DocType);
                        navigateToSection(3);
                      }
                    }}>
                      <span className={`search-result-icon ${result.kind}`}>{result.kind === "task" ? <ClipboardList size={15} /> : result.kind === "risk" ? <ShieldAlert size={15} /> : result.kind === "document" ? <FileText size={15} /> : <Users size={15} />}</span>
                      <span><strong>{result.title}</strong><small>{result.meta}</small></span>
                    </button>
                  )) : <div className="search-empty"><Search size={18} /><span>{language === "zh" ? "没有匹配的任务、风险或成员" : "No matching tasks, risks or members"}</span></div>}
                </div>
              )}
            </div>
            <button className="mobile-search-button icon-button" onClick={() => { setMobileSearchOpen(true); window.requestAnimationFrame(() => searchInput.current?.focus()); }} aria-label={language === "zh" ? "搜索当前项目" : "Search current project"}><Search size={18} /></button>
            <button className="language-button" onClick={changeLanguage} aria-label="Switch language">
              <Languages size={17} />
              <span>{language === "zh" ? "中 / EN" : "EN / 中"}</span>
            </button>
            <div className="notice-wrap" ref={noticeWrapper}>
              <button className="icon-button" onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Notifications">
                <Bell size={19} />
                {unreadRiskCount > 0 && <i className="notice-dot" />}
              </button>
              {noticeOpen && (
                <div className="notice-popover notice-list">
                  <div className="notice-header"><div><strong>{language === "zh" ? "项目提醒" : "Project alerts"}</strong><p>{localize(currentProject.name, language)}</p></div>{unreadRiskCount > 0 && <button onClick={markAllNotificationsRead}>{language === "zh" ? "全部已读" : "Mark read"}</button>}</div>
                  {currentProject.risks.filter((risk) => risk.severity !== "resolved").slice(0, 3).map((risk) => (
                    <button className={`notice-item ${risk.read ? "" : "unread"}`} key={risk.id} onClick={() => { setNoticeOpen(false); openRiskDetail(risk.id); }}>
                      <span className="notice-popover-icon"><ShieldAlert size={16} /></span>
                      <span><strong>{localize(risk.title, language)}</strong><p>{localize(risk.description, language)}</p></span>
                      <ChevronDown className="risk-chevron" size={14} />
                    </button>
                  ))}
                  {!openRiskCount && <div className="notice-empty"><CheckCircle2 size={20} /><span>{language === "zh" ? "当前没有待处理风险" : "No open risks"}</span></div>}
                </div>
              )}
            </div>
            <button className="avatar owner top-avatar" onClick={() => setUtilityPanel("account")} aria-label={language === "zh" ? "打开账号信息" : "Open account"}>林</button>
          </div>
        </header>

        <div className={`content ${projectSwitching ? "project-switching" : ""}`}>
          {focusedView && (
            <section className={`view-header ${focusedView.tone}`}>
              <div className="view-heading-copy">
                <span className="view-heading-icon"><FocusedViewIcon size={20} /></span>
                <div>
                  <small>{focusedView.eyebrow}</small>
                  <h1>{focusedView.title}</h1>
                  <p>{focusedView.description}</p>
                </div>
              </div>
              <div className="view-metrics" aria-label={language === "zh" ? "当前视图摘要" : "Current view summary"}>
                {focusedView.metrics.map((metric) => (
                  <div key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="welcome-row" id="overview">
            <div>
              <div className="date-row">
                <span>{statusLabel} · {localize(currentProject.phase, language)}</span>
                <span className="sync-badge"><Check size={12} />{workspaceHydrated ? t.sync : language === "zh" ? "正在加载" : "Loading"}</span>
              </div>
              <h1>{t.greeting}<span>。</span></h1>
              <p>{localize(currentProject.overview, language)}</p>
            </div>
            <div className="health-strip">
              <div className="health-score">
                <span className="score-ring" style={{ background: `conic-gradient(var(--teal) ${currentProject.health}%, #e6eeec 0)` }}><strong>{currentProject.health}</strong></span>
                <div><small>{t.health}</small><b>{currentProject.health >= 85 ? language === "zh" ? "稳健" : "Strong" : currentProject.health >= 75 ? language === "zh" ? "良好" : "Healthy" : language === "zh" ? "需关注" : "Attention"}</b></div>
              </div>
              <div className="metric">
                <small>{t.progress}</small>
                <strong>{currentProject.progress}%</strong>
                <div className="progress-indicator" aria-label={`${t.progress} ${currentProject.progress}%`}>
                  <span className="progress-icon"><TrendingUp size={16} /></span>
                  <span className="mini-line" aria-hidden="true"><i style={{ width: `${currentProject.progress}%` }} /></span>
                </div>
              </div>
              <div className="metric">
                <small>{t.teamLoad}</small>
                <strong>{currentProject.teamLoad}%</strong>
                <div className="team-load-indicator" aria-label={`${t.teamLoad} ${currentProject.teamLoad}%`}>
                  <span className="team-load-icon"><Users size={16} /></span>
                  <span className="team-load-scale" aria-hidden="true"><i style={{ width: `${currentProject.teamLoad}%` }} /></span>
                </div>
              </div>
            </div>
          </section>

          <section className="capability-flow" aria-label={language === "zh" ? "核心 AI 工作流" : "Core AI workflow"}>
            {[
              {
                Icon: FileAudio,
                eyebrow: language === "zh" ? "01 · 输入" : "01 · Input",
                title: language === "zh" ? "录音 / 文字一键上传" : "Upload audio or notes",
                desc: language === "zh" ? "自动转写并提炼会议结论" : "Transcribe and summarize",
                tone: "blue",
              },
              {
                Icon: Users,
                eyebrow: language === "zh" ? "02 · 执行" : "02 · Execute",
                title: language === "zh" ? "按岗位拆解分配" : "Assign tasks by role",
                desc: language === "zh" ? "匹配岗位、成员与预估工时" : "Match roles, owners and effort",
                tone: "teal",
              },
              {
                Icon: ShieldAlert,
                eyebrow: language === "zh" ? "03 · 预警" : "03 · Detect",
                title: language === "zh" ? "工期 / 资源风险预警" : "Flag delivery risks",
                desc: language === "zh" ? "持续扫描冲突与依赖阻塞" : "Scan conflicts and blockers",
                tone: "coral",
              },
              {
                Icon: FileText,
                eyebrow: language === "zh" ? "04 · 交付" : "04 · Deliver",
                title: language === "zh" ? "一键生成双版本周报" : "Generate two report views",
                desc: language === "zh" ? "内部复盘与客户汇报分离" : "Internal and client-ready",
                tone: "violet",
              },
            ].map(({ Icon, eyebrow, title, desc, tone }, index) => (
              <div className="capability-item" key={title}>
                <span className={`capability-icon ${tone}`}><Icon size={17} /></span>
                <div><small>{eyebrow}</small><strong>{title}</strong><p>{desc}</p></div>
                {index < 3 && <span className="flow-arrow">→</span>}
              </div>
            ))}
          </section>

          <section className="top-grid">
            <article className="card meeting-card">
              <div className="card-heading">
                <div className="title-icon blue"><MessageSquareText size={19} /></div>
                <div><h2>{t.uploadTitle}</h2><p>{t.uploadSub}</p></div>
                <span className={`ai-badge ${apiConfigured === false ? "needs-key" : "connected"}`}>
                  <span className="api-status-dot" />
                  {apiConfigured === false
                    ? language === "zh" ? "需配置 API Key" : "API key required"
                    : apiConfigured === true
                      ? language === "zh"
                        ? `${apiProvider === "agnes" ? "Agnes" : "OpenAI"} 已连接`
                        : `${apiProvider === "agnes" ? "Agnes" : "OpenAI"} connected`
                      : language === "zh" ? "检测 AI…" : "Checking AI…"}
                </span>
              </div>

              <div className="meeting-tabs" role="tablist">
                <button className={meetingMode === "text" ? "active" : ""} onClick={() => setMeetingModeForProject("text")}><FileText size={15} />{t.paste}</button>
                <button className={meetingMode === "audio" ? "active" : ""} onClick={() => setMeetingModeForProject("audio")}><FileAudio size={15} />{t.upload}</button>
              </div>

              {meetingMode === "text" ? (
                <div className="notes-input">
                  <textarea value={notes} maxLength={10000} onChange={(event) => updateNotes(event.target.value)} placeholder={t.textarea} />
                  <div className="input-foot">
                    <span><ClipboardList size={14} />{language === "zh" ? "内容自动保存到当前项目" : "Saved automatically to this project"}</span>
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInput.current?.click();
                    }
                  }}
                >
                  <input ref={fileInput} type="file" accept=".mp3,.m4a,.wav,.webm,audio/*" onChange={(event) => chooseFile(event.target.files?.[0])} />
                  <span className="upload-icon">{fileName ? <FileAudio size={23} /> : <UploadCloud size={23} />}</span>
                  <div>
                    <strong>{fileName || t.choose}</strong>
                    <p>
                      {fileName
                        ? `${((currentProject.audioFileMeta?.size ?? 0) / 1024 / 1024).toFixed(1)} MB · ${language === "zh" ? "已安全保存到本机" : "Saved securely on this device"}`
                        : transcriptionProvider === "browser"
                          ? language === "zh"
                            ? "浏览器本地转写 · 音频不会发送至第三方转写服务"
                            : "Browser-local transcription · audio is not sent to a transcription service"
                        : !transcriptionConfigured && apiProvider === "agnes"
                          ? language === "zh"
                            ? "Agnes 不含语音转写；本地转写尚未配置"
                            : "Agnes has no transcription API; local ASR is not configured"
                          : t.supported}
                    </p>
                  </div>
                  {fileName && <button className="remove-upload" onClick={(event) => { event.stopPropagation(); void removeFile(); }} aria-label={language === "zh" ? "移除音频" : "Remove audio"}><X size={15} /></button>}
                </div>
              )}

              {currentProject.analysisStatus === "stale" && (
                <div className="stale-notice"><Clock3 size={14} /><span>{language === "zh" ? "会议内容或项目数据已变化，请重新运行 AI 解析。" : "Meeting or project data changed. Run AI analysis again."}</span></div>
              )}

              {analyzeState === "done" && (
                <div className="analysis-result" role="status">
                  <span className="result-check"><Check size={15} /></span>
                  <div className="result-copy"><strong>{t.summaryReady}</strong><p>{language === "zh" ? `已生成 ${analysis?.tasks.length ?? 0} 项任务、${analysis?.risks.length ?? 0} 项风险与汇报草稿。` : `${analysis?.tasks.length ?? 0} tasks, ${analysis?.risks.length ?? 0} risks and a report draft are ready.`}</p></div>
                  <div className="result-stats">
                    <span><b>{analysis?.decisions.length ?? 0}</b>{t.decisions}</span>
                    <span><b>{analysis?.tasks.length ?? 0}</b>{t.assignments}</span>
                    <span><b>{analysis?.risks.length ?? 0}</b>{t.detectedRisks}</span>
                  </div>
                </div>
              )}

              {actionError && (
                <div className="action-error" role="alert">
                  <AlertTriangle size={15} />
                  <span>{actionError}</span>
                  {apiConfigured === false && (
                    <code>{apiProvider === "agnes" ? "AGNES_API_KEY" : "OPENAI_API_KEY"}</code>
                  )}
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
                <button className={`primary-button ${analyzeState}`} onClick={runAnalysis} disabled={analyzeState === "running" || (meetingMode === "text" ? notes.trim().length < 20 : !currentProject.audioFileMeta)}>
                  {analyzeState === "running" ? <LoaderCircle className="spin" size={17} /> : analyzeState === "done" ? <Check size={17} /> : <WandSparkles size={17} />}
                  {analyzeState === "running" ? t.analysing : analyzeState === "done" ? t.analysed : currentProject.analyzedAt ? language === "zh" ? "重新解析" : "Analyze again" : t.analyse}
                </button>
              </div>
            </article>

            <article className="card risks-card" id="risks">
              <div className="card-heading">
                <div className="title-icon coral"><ShieldAlert size={19} /></div>
                <div><h2>{t.risksTitle}</h2><p>{t.risksSub}</p></div>
                <div className="risk-head-meta">
                  <span className="scan-status"><span className="live-dot" />{t.autoScanning}</span>
                <span className="risk-total">{riskItems.filter((risk) => risk.level !== "resolved").length}</span>
                </div>
              </div>
              <div className="risk-list">
                {riskItems.map((risk) => (
                  <button className={`risk-item ${risk.level}`} key={risk.id} onClick={() => openRiskDetail(risk.id)}>
                    <span className="risk-signal">{risk.level === "high" ? <AlertTriangle size={15} /> : risk.level === "medium" ? <Clock3 size={15} /> : <Check size={15} />}</span>
                    <span className="risk-copy"><span><strong>{risk.title}</strong><em>{t[risk.level as "high" | "medium" | "resolved"]}</em></span><p>{risk.text}</p><small>{risk.meta}</small></span>
                    <ChevronDown className="risk-chevron" size={15} />
                  </button>
                ))}
                {!riskItems.length && <div className="module-empty"><span><CheckCircle2 size={22} /></span><strong>{language === "zh" ? "暂无项目风险" : "No project risks"}</strong><p>{language === "zh" ? "完成一次会议解析后，AI 会持续扫描工期、资源和依赖冲突。" : "After the first analysis, AI will scan schedule, resource and dependency conflicts."}</p></div>}
              </div>
              {activeNav !== 2 && <button className="text-button" onClick={() => navigateToSection(2)}>{t.viewAll}<span>→</span></button>}
            </article>
          </section>

          <section className="bottom-grid">
            <article className="card board-card" id="tasks">
              <div className="card-heading board-heading">
                <div className="title-icon teal"><ClipboardList size={19} /></div>
                <div>
                  <h2>{t.taskTitle}</h2>
                  <p>
                    {analysis
                      ? `${language === "zh" ? "来自真实会议分析" : "From live meeting analysis"} · ${analysis.tasks.length} ${language === "zh" ? "个任务" : "tasks"}`
                      : currentProject.tasks.length
                        ? `${language === "zh" ? "手动维护" : "Manually managed"} · ${currentProject.tasks.length} ${language === "zh" ? "个任务" : "tasks"}`
                        : language === "zh"
                          ? "尚未拆分任务，可上传会议或手动添加"
                          : "No tasks yet. Upload a meeting or add one manually."}
                  </p>
                </div>
                <div className="board-actions">
                  <span className="automation-chip"><Bot size={13} />{t.roleAssigned}</span>
                  <div className="avatar-stack mini">
                    {teamMembers.slice(0, 3).map((member) => (
                      <span className={`avatar ${member.tone}`} key={member.id}>{member.initials}</span>
                    ))}
                    {teamMembers.length > 3 && <span className="avatar more">+{teamMembers.length - 3}</span>}
                  </div>
                  <button className="secondary-button" onClick={() => openTaskEditor()}><Plus size={15} />{t.addTask}</button>
                </div>
              </div>
              <div className="board-columns">
                {boardColumns.map((column, columnIndex) => (
                  <div className="task-column" key={column.key}>
                    <div className="column-head">
                      <span className={`status-dot s${columnIndex}`} />
                      <strong>{t[column.key as "todo" | "doing" | "review"]}</strong>
                      <b>{column.items.length}</b>
                    </div>
                    <div className="task-list">
                      {column.items.map((task) => (
                        <button className="task-card" key={task.id} onClick={() => openTaskEditor(task.id)}>
                          <div className="task-top"><span className={`task-tag tag${columnIndex}`}>{task.tag}</span><MoreHorizontal size={15} /></div>
                          <strong>{task.title}</strong>
                          {typeof task.progress === "number" && (
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
                      {!column.items.length && <button className="empty-task-column" onClick={() => openTaskEditor(undefined, column.key)}><Plus size={16} /><span>{language === "zh" ? "此阶段暂无任务" : "No tasks in this stage"}</span></button>}
                    </div>
                    <button className="quick-add" onClick={() => openTaskEditor(undefined, column.key)}><Plus size={14} />{t.addTask}</button>
                  </div>
                ))}
              </div>
            </article>

            <article className="card docs-card" id="documents">
              <div className="card-heading">
                <div className="title-icon violet"><FileText size={19} /></div>
                <div><h2>{t.docsTitle}</h2><p>{t.docsSub}</p></div>
              </div>
              <div className="doc-tabs">
                <button className={docType === "weekly" ? "active" : ""} onClick={() => selectDocumentType("weekly")}>{t.weekly}</button>
                <button className={docType === "client" ? "active" : ""} onClick={() => selectDocumentType("client")}>{t.client}</button>
              </div>
              <div className="doc-sources">
                <p>{language === "zh" ? "报告自动汇总" : "Included automatically"}</p>
                {[
                  language === "zh" ? "项目任务与完成进度" : "Tasks and delivery progress",
                  language === "zh" ? "关键决策与待办事项" : "Decisions and action items",
                  language === "zh" ? "风险状态与 AI 建议" : "Risk status and AI advice",
                ].map((item) => (
                  <span key={item}><i><Check size={11} /></i>{item}</span>
                ))}
              </div>
              <div className="document-preview">
                <div className="document-top">
                  <div className="doc-logo"><span className="brand-glyph mini-glyph"><i /><i /></span><strong>TeamAlign</strong></div>
                  <span>{docType === "weekly" ? "WEEKLY" : "CLIENT BRIEF"}</span>
                </div>
                <p className="document-date">{reportPreview?.subtitle || `${localize(currentProject.name, language)} · ${localize(currentProject.phase, language)}`}</p>
                <h3>{reportPreview?.title || (docType === "weekly" ? localize(currentProject.meetingTitle, language) || (language === "zh" ? "等待首次会议分析" : "Awaiting first meeting analysis") : language === "zh" ? `${localize(currentProject.name, language)}阶段进展简报` : `${localize(currentProject.name, language)} Progress Brief`)}</h3>
                <p className="document-body">{reportPreview?.executiveSummary || (docType === "weekly" ? localize(currentProject.summary, language) || localize(currentProject.overview, language) : localize(currentProject.overview, language))}</p>
                <div className="doc-stats">
                  <div><strong>{reportPreview ? reportPreview.completed.length : currentProject.tasks.filter((task) => task.status === "review").length}</strong><span>{language === "zh" ? "已完成事项" : "Completed"}</span></div>
                  <div><strong>{reportPreview ? reportPreview.inProgress.length : currentProject.tasks.filter((task) => task.status === "doing").length}</strong><span>{language === "zh" ? "进行中事项" : "In progress"}</span></div>
                  <div><strong>{reportPreview ? reportPreview.risks.length : openRiskCount}</strong><span>{language === "zh" ? "关注风险" : "Risks"}</span></div>
                </div>
                <div className="ai-note"><Sparkles size={14} /><div><strong>{t.aiNote}</strong><p>{reportPreview?.recommendations[0] || (docType === "client" ? language === "zh" ? "当前关键风险均已纳入跟进计划，后续将按里程碑同步处理进展。" : "Key risks are tracked with mitigation plans and will be updated at each milestone." : currentProject.risks[0] ? localize(currentProject.risks[0].suggestedAction, language) : language === "zh" ? "当前未发现需要优先处理的项目风险。" : "No priority risks are currently detected.")}</p></div></div>
              </div>
              {activeReport.error && (
                <div className="doc-error" role="alert">
                  <AlertTriangle size={15} />
                  <span>{activeReport.error}</span>
                </div>
              )}
              <div className="doc-footer">
                <span aria-live="polite"><span className={`live-dot ${docState === "generating" ? "pulse" : ""}`} />{docState === "generating" ? t.generating : activeReport.status === "ready" ? t.ready : activeReport.status === "error" ? language === "zh" ? "生成失败，请检查后重试" : "Generation failed; try again" : reportLanguageMismatch ? language === "zh" ? "当前语言需重新生成报告" : "Regenerate for the current language" : activeReport.status === "stale" ? language === "zh" ? "项目数据已更新，请重新生成" : "Project data changed; regenerate" : language === "zh" ? "等待生成" : "Ready to generate"}</span>
                <div>
                  <button className="secondary-button generate-button" onClick={generateReport} disabled={docState === "generating"}>
                    {docState === "generating" ? <LoaderCircle className="spin" size={15} /> : docState === "ready" ? <Sparkles size={15} /> : <WandSparkles size={15} />}
                    {docState === "generating" ? t.generating : activeReport.status === "ready" ? t.generated : activeReport.status === "stale" ? language === "zh" ? "重新生成" : "Regenerate" : t.generate}
                  </button>
                  <button className="primary-button" onClick={downloadReport} disabled={activeReport.status !== "ready"}><ArrowDownToLine size={16} />{t.download}</button>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
      {toast && <div className="workspace-toast" role="status"><CheckCircle2 size={17} /><span>{toast}</span></div>}
    </div>
  );
}
