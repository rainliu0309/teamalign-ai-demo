import type {
  AnalysisResult,
  GeneratedReport,
  ProjectRisk,
  ProjectTask,
} from "./teamalign";

export type Language = "zh" | "en";
export type LocalizedText = { zh: string; en: string };
export type ProjectStatus = "active" | "planning" | "paused";
export type AnalysisStatus =
  | "idle"
  | "running"
  | "ready"
  | "stale"
  | "error";
export type ReportStatus =
  | "idle"
  | "generating"
  | "ready"
  | "stale"
  | "error";

export type AudioFileMeta = {
  assetKey: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type WorkspaceMember = {
  id: string;
  name: LocalizedText;
  role: LocalizedText;
  initials: LocalizedText;
  load: number;
  tone: "a1" | "a2" | "a3";
};

export type WorkspaceTask = {
  id: string;
  title: LocalizedText;
  role: LocalizedText;
  assignee: LocalizedText;
  estimatedHours: number;
  dueDate: LocalizedText;
  status: ProjectTask["status"];
  priority: ProjectTask["priority"];
  rationale: LocalizedText;
  progress: number;
  source: "ai" | "manual";
};

export type WorkspaceRisk = {
  id: string;
  type: ProjectRisk["type"];
  severity: ProjectRisk["severity"];
  title: LocalizedText;
  description: LocalizedText;
  affectedTasks: string[];
  suggestedAction: LocalizedText;
  dueDate: LocalizedText;
  read: boolean;
  previousSeverity?: "high" | "medium";
};

export type ReportSlot = {
  status: ReportStatus;
  language?: Language;
  requestId?: string;
  assetKey?: string;
  fileName?: string;
  generatedAt?: string;
  sourceRevision?: number;
  error?: string;
  preview?: GeneratedReport;
};

export type ProjectDocuments = {
  selectedType: "weekly" | "client";
  weekly: ReportSlot;
  client: ReportSlot;
};

export type ProjectWorkspace = {
  id: string;
  name: LocalizedText;
  client: LocalizedText;
  owner: LocalizedText;
  status: ProjectStatus;
  phase: LocalizedText;
  overview: LocalizedText;
  color: string;
  health: number;
  progress: number;
  teamLoad: number;
  startDate: string;
  endDate: string;
  updatedAt: string;
  meetingMode: "text" | "audio";
  notes: LocalizedText;
  audioFileMeta: AudioFileMeta | null;
  analysisStatus: AnalysisStatus;
  analysisRequestId?: string;
  analysisError?: string;
  meetingTitle: LocalizedText;
  summary: LocalizedText;
  decisions: LocalizedText[];
  participants: LocalizedText[];
  transcript: LocalizedText;
  analyzedAt?: string;
  tasks: WorkspaceTask[];
  risks: WorkspaceRisk[];
  documents: ProjectDocuments;
  revision: number;
  members: WorkspaceMember[];
};

export type PersistedWorkspace = {
  version: 1;
  activeProjectId: string;
  projects: Record<string, ProjectWorkspace>;
};

const lt = (zh: string, en: string): LocalizedText => ({ zh, en });
const emptyReports = (): ProjectDocuments => ({
  selectedType: "weekly",
  weekly: { status: "idle" },
  client: { status: "idle" },
});

const member = (
  id: string,
  zhName: string,
  enName: string,
  zhRole: string,
  enRole: string,
  zhInitials: string,
  enInitials: string,
  load: number,
  tone: WorkspaceMember["tone"],
): WorkspaceMember => ({
  id,
  name: lt(zhName, enName),
  role: lt(zhRole, enRole),
  initials: lt(zhInitials, enInitials),
  load,
  tone,
});

const task = (
  id: string,
  title: LocalizedText,
  role: LocalizedText,
  assignee: LocalizedText,
  estimatedHours: number,
  dueDate: LocalizedText,
  status: ProjectTask["status"],
  priority: ProjectTask["priority"],
  progress = 0,
): WorkspaceTask => ({
  id,
  title,
  role,
  assignee,
  estimatedHours,
  dueDate,
  status,
  priority,
  rationale: lt("来自项目会议的明确行动项", "Action item confirmed in the project meeting"),
  progress,
  source: "ai",
});

const risk = (
  id: string,
  type: ProjectRisk["type"],
  severity: ProjectRisk["severity"],
  title: LocalizedText,
  description: LocalizedText,
  affectedTasks: string[],
  suggestedAction: LocalizedText,
  dueDate: LocalizedText,
  read = false,
): WorkspaceRisk => ({
  id,
  type,
  severity,
  title,
  description,
  affectedTasks,
  suggestedAction,
  dueDate,
  read,
});

const yunzhou: ProjectWorkspace = {
  id: "yunzhou-618",
  name: lt("云舟电商 6.18 增长项目", "Yunzhou 6.18 Growth"),
  client: lt("云舟电商", "Yunzhou Commerce"),
  owner: lt("林晓", "Lin Xiao"),
  status: "active",
  phase: lt("交付冲刺", "Delivery sprint"),
  overview: lt(
    "核心链路已进入联调，当前需优先解决测试资源与接口依赖问题。",
    "Core integration is underway; QA capacity and API dependencies need attention.",
  ),
  color: "#5573eb",
  health: 82,
  progress: 64,
  teamLoad: 78,
  startDate: "2026-05-20",
  endDate: "2026-06-18",
  updatedAt: "2026-06-12T14:32:00.000Z",
  meetingMode: "text",
  notes: lt(
    `6.18 大促上线评审会｜6月12日 10:00
参会：产品、研发、测试、运营、设计

1. 优惠券接口周四前完成联调，顾屿负责；异常码说明由产品补充。
2. 主会场移动端适配预计 10 小时，张予周六前完成。
3. 测试本周同时支持会员项目，压测资源存在冲突，需要调整排期。
4. 主视觉已经通过品牌审核，运营今天确认最终文案。
5. 下周一前输出客户版进展简报。`,
    `6.18 Campaign Launch Review | Jun 12, 10:00
Attendees: Product, Engineering, QA, Operations and Design

1. Coupon API integration is due Thursday, owned by Yu Gu.
2. Mobile campaign adaptation is estimated at 10 hours and due Saturday.
3. QA capacity conflicts with another P0 project and needs rescheduling.
4. The key visual passed brand review; Operations will finalize copy today.
5. A client progress brief is due next Monday.`,
  ),
  audioFileMeta: null,
  analysisStatus: "ready",
  meetingTitle: lt("6.18 大促上线评审会", "6.18 Campaign Launch Review"),
  summary: lt(
    "本周完成主视觉评审并进入优惠券接口与移动端联调阶段。测试资源冲突和接口异常码缺失是当前主要交付风险。",
    "Creative review is complete and coupon/mobile integration is underway. QA capacity and missing error-code definitions are the main delivery risks.",
  ),
  decisions: [
    lt("优惠券接口本周完成联调", "Complete coupon API integration this week"),
    lt("主会场移动端适配周六前完成", "Finish mobile adaptation by Saturday"),
    lt("优先协调压测资源", "Prioritize load-test capacity"),
  ],
  participants: [
    lt("产品", "Product"),
    lt("研发", "Engineering"),
    lt("测试", "QA"),
    lt("运营", "Operations"),
    lt("设计", "Design"),
  ],
  transcript: lt("", ""),
  analyzedAt: "2026-06-12T14:30:00.000Z",
  tasks: [
    task("yz-t1", lt("确认大促会场最终文案", "Finalize campaign copy"), lt("内容运营", "Content Ops"), lt("周冉", "Ran Zhou"), 3, lt("6月13日", "Jun 13"), "todo", "P1"),
    task("yz-t2", lt("补充退款场景埋点", "Add refund event tracking"), lt("数据产品", "Data Product"), lt("陈默", "Mo Chen"), 5, lt("6月14日", "Jun 14"), "todo", "P1"),
    task("yz-t3", lt("优惠券服务接口联调", "Integrate coupon service API"), lt("后端研发", "Backend"), lt("顾屿", "Yu Gu"), 12, lt("6月13日", "Jun 13"), "doing", "P0", 68),
    task("yz-t4", lt("主会场移动端适配", "Adapt mobile campaign hub"), lt("前端研发", "Frontend"), lt("张予", "Yu Zhang"), 10, lt("6月15日", "Jun 15"), "doing", "P0", 45),
    task("yz-t5", lt("全链路压测脚本编写", "Build load-test scripts"), lt("测试工程", "QA"), lt("许宁", "Ning Xu"), 8, lt("6月16日", "Jun 16"), "doing", "P0", 32),
    task("yz-t6", lt("会员日主视觉验收", "Approve membership key visual"), lt("视觉设计", "Design"), lt("唐可", "Ke Tang"), 6, lt("今天", "Today"), "review", "P1", 100),
  ],
  risks: [
    risk("yz-r1", "resource", "high", lt("测试资源冲突", "QA capacity conflict"), lt("许宁同时被分配至两个 P0 项目，预计压测延期 1 天。", "Ning Xu is assigned to two P0 projects; load testing may slip one day."), ["yz-t5"], lt("协调临时测试支持并调整回归范围。", "Add temporary QA support and narrow the regression scope."), lt("6月14日", "Jun 14")),
    risk("yz-r2", "dependency", "medium", lt("接口依赖可能阻塞", "API dependency may block"), lt("优惠券服务缺少异常码说明，联调缓冲仅剩 8 小时。", "Coupon error-code definitions are missing, leaving an eight-hour buffer."), ["yz-t3"], lt("由产品在今日下班前补齐异常码说明。", "Product should complete error-code definitions today."), lt("6月15日", "Jun 15")),
    risk("yz-r3", "quality", "resolved", lt("视觉稿交付已恢复", "Creative delivery recovered"), lt("主视觉已通过品牌审核，比计划提前 3 小时。", "The key visual passed review three hours early."), ["yz-t6"], lt("保持当前验收节奏。", "Maintain the current review cadence."), lt("已完成", "Completed"), true),
  ],
  documents: emptyReports(),
  revision: 1,
  members: [
    member("m-lin", "林晓", "Lin Xiao", "项目负责人", "Project lead", "林", "LX", 72, "a1"),
    member("m-gu", "顾屿", "Yu Gu", "后端研发", "Backend engineer", "顾", "YG", 86, "a2"),
    member("m-tang", "唐可", "Ke Tang", "视觉设计", "Visual designer", "唐", "KT", 64, "a3"),
    member("m-zhang", "张予", "Yu Zhang", "前端研发", "Frontend engineer", "张", "YZ", 78, "a1"),
    member("m-xu", "许宁", "Ning Xu", "测试工程师", "QA engineer", "许", "NX", 94, "a3"),
  ],
};

const membership: ProjectWorkspace = {
  id: "membership-20",
  name: lt("会员中心 2.0 升级", "Membership Center 2.0"),
  client: lt("内部产品平台", "Internal Product Platform"),
  owner: lt("唐宁", "Ning Tang"),
  status: "planning",
  phase: lt("方案确认", "Solution planning"),
  overview: lt(
    "信息架构和等级权益方案已完成首轮评审，等待数据口径确认后进入开发。",
    "Information architecture and tier benefits passed first review; development awaits data definitions.",
  ),
  color: "#38a18a",
  health: 91,
  progress: 32,
  teamLoad: 61,
  startDate: "2026-06-01",
  endDate: "2026-08-30",
  updatedAt: "2026-06-11T17:10:00.000Z",
  meetingMode: "text",
  notes: lt(
    `会员中心 2.0 方案评审｜6月11日 15:00
1. 等级体系采用成长值与近 12 个月消费额双维度。
2. 数据团队周五前确认历史成长值回算口径。
3. 设计下周三交付首页与权益页高保真稿。
4. 老会员迁移需要补充灰度与回滚方案。`,
    `Membership Center 2.0 Review | Jun 11, 15:00
1. Tiers use both growth points and trailing-12-month spend.
2. Data team will confirm historical recalculation rules by Friday.
3. Design delivers high-fidelity Home and Benefits screens next Wednesday.
4. Legacy-member migration needs rollout and rollback plans.`,
  ),
  audioFileMeta: null,
  analysisStatus: "ready",
  meetingTitle: lt("会员中心 2.0 方案评审", "Membership Center 2.0 Review"),
  summary: lt(
    "会员等级体系和核心页面范围已确认，当前重点是统一历史数据口径并补全迁移方案。",
    "The tier model and core page scope are aligned. Historical data definitions and migration planning are the next priorities.",
  ),
  decisions: [
    lt("采用双维度会员等级体系", "Adopt a two-factor tier model"),
    lt("首期覆盖首页、权益和任务中心", "Phase one covers Home, Benefits and Missions"),
  ],
  participants: [lt("产品", "Product"), lt("数据", "Data"), lt("设计", "Design"), lt("研发", "Engineering")],
  transcript: lt("", ""),
  analyzedAt: "2026-06-11T17:05:00.000Z",
  tasks: [
    task("mc-t1", lt("确认历史成长值回算口径", "Confirm historical point recalculation"), lt("数据产品", "Data Product"), lt("苏雅", "Ya Su"), 8, lt("6月13日", "Jun 13"), "todo", "P0"),
    task("mc-t2", lt("补充老会员迁移回滚方案", "Draft legacy-member rollback plan"), lt("产品经理", "Product"), lt("唐宁", "Ning Tang"), 6, lt("6月16日", "Jun 16"), "todo", "P0"),
    task("mc-t3", lt("会员首页信息架构", "Membership home information architecture"), lt("体验设计", "UX Design"), lt("方予", "Yu Fang"), 10, lt("6月17日", "Jun 17"), "doing", "P1", 55),
    task("mc-t4", lt("等级权益配置模型", "Tier-benefit configuration model"), lt("后端研发", "Backend"), lt("陆川", "Chuan Lu"), 14, lt("6月19日", "Jun 19"), "doing", "P1", 30),
    task("mc-t5", lt("会员数据字段清单", "Membership data dictionary"), lt("数据工程", "Data Engineering"), lt("高远", "Yuan Gao"), 5, lt("今天", "Today"), "review", "P1", 100),
  ],
  risks: [
    risk("mc-r1", "scope", "medium", lt("历史数据口径未锁定", "Historical data definitions are open"), lt("成长值回算范围仍有两个版本，可能影响迁移评估。", "Two recalculation scopes remain, which may delay migration sizing."), ["mc-t1", "mc-t2"], lt("由产品与数据在周五前完成书面确认。", "Product and Data should sign off by Friday."), lt("6月13日", "Jun 13")),
    risk("mc-r2", "dependency", "resolved", lt("设计资源已确认", "Design capacity confirmed"), lt("体验设计已锁定下周交付档期。", "UX capacity is reserved for next week's delivery."), ["mc-t3"], lt("按计划推进双周评审。", "Continue with biweekly design reviews."), lt("已完成", "Completed"), true),
  ],
  documents: emptyReports(),
  revision: 1,
  members: [
    member("mc-m1", "唐宁", "Ning Tang", "项目负责人", "Project lead", "唐", "NT", 58, "a1"),
    member("mc-m2", "苏雅", "Ya Su", "数据产品", "Data Product", "苏", "YS", 65, "a2"),
    member("mc-m3", "方予", "Yu Fang", "体验设计", "UX designer", "方", "YF", 62, "a3"),
    member("mc-m4", "陆川", "Chuan Lu", "后端研发", "Backend engineer", "陆", "CL", 70, "a1"),
    member("mc-m5", "高远", "Yuan Gao", "数据工程", "Data engineer", "高", "YG", 52, "a2"),
  ],
};

const brandGrowth: ProjectWorkspace = {
  id: "q3-brand",
  name: lt("Q3 品牌增长计划", "Q3 Brand Growth Plan"),
  client: lt("品牌增长中心", "Brand Growth Center"),
  owner: lt("周冉", "Ran Zhou"),
  status: "active",
  phase: lt("内容生产", "Content production"),
  overview: lt(
    "首轮达人内容已经开拍，但媒介排期和法务审核窗口偏紧，需要提前锁定资源。",
    "The first creator wave is in production; media scheduling and legal review windows are tight.",
  ),
  color: "#9a72d6",
  health: 76,
  progress: 47,
  teamLoad: 86,
  startDate: "2026-05-28",
  endDate: "2026-09-15",
  updatedAt: "2026-06-12T09:48:00.000Z",
  meetingMode: "text",
  notes: lt(
    `Q3 品牌增长周会｜6月12日 09:30
1. 首轮 6 位达人中已有 4 位完成脚本确认。
2. 信息流投放计划提前到 6 月 20 日，媒介需重新协调档期。
3. 两条内容涉及功效表达，必须增加法务预审。
4. 本周完成品牌搜索基线数据整理。`,
    `Q3 Brand Growth Weekly | Jun 12, 09:30
1. Four of six creators have approved scripts.
2. Paid media launch moves to June 20, requiring schedule changes.
3. Two concepts contain efficacy claims and require legal pre-review.
4. Complete branded-search baseline analysis this week.`,
  ),
  audioFileMeta: null,
  analysisStatus: "ready",
  meetingTitle: lt("Q3 品牌增长周会", "Q3 Brand Growth Weekly"),
  summary: lt(
    "达人内容生产整体推进正常，但投放日期提前后，媒介与法务资源成为主要风险。",
    "Creator production is on track, but the accelerated media date creates scheduling and legal-review risks.",
  ),
  decisions: [
    lt("信息流投放提前至 6 月 20 日", "Move paid media launch to June 20"),
    lt("功效类脚本增加法务预审", "Add legal pre-review for efficacy claims"),
  ],
  participants: [lt("品牌", "Brand"), lt("内容", "Content"), lt("媒介", "Media"), lt("法务", "Legal")],
  transcript: lt("", ""),
  analyzedAt: "2026-06-12T09:45:00.000Z",
  tasks: [
    task("bg-t1", lt("完成剩余达人脚本确认", "Approve remaining creator scripts"), lt("内容运营", "Content Ops"), lt("周冉", "Ran Zhou"), 6, lt("6月14日", "Jun 14"), "todo", "P0"),
    task("bg-t2", lt("锁定信息流投放档期", "Lock paid media schedule"), lt("媒介投放", "Paid Media"), lt("贺川", "Chuan He"), 5, lt("6月13日", "Jun 13"), "todo", "P0"),
    task("bg-t3", lt("功效类脚本法务预审", "Legal pre-review for efficacy scripts"), lt("法务", "Legal"), lt("叶青", "Qing Ye"), 7, lt("6月15日", "Jun 15"), "doing", "P0", 25),
    task("bg-t4", lt("品牌搜索基线分析", "Analyze branded-search baseline"), lt("增长分析", "Growth Analytics"), lt("陈默", "Mo Chen"), 8, lt("6月16日", "Jun 16"), "doing", "P1", 62),
    task("bg-t5", lt("首轮达人素材拍摄", "Shoot first creator wave"), lt("内容制作", "Production"), lt("许禾", "He Xu"), 18, lt("6月18日", "Jun 18"), "doing", "P1", 48),
    task("bg-t6", lt("品牌主张文案确认", "Approve brand proposition copy"), lt("品牌策略", "Brand Strategy"), lt("顾晨", "Chen Gu"), 4, lt("今天", "Today"), "review", "P1", 100),
  ],
  risks: [
    risk("bg-r1", "schedule", "high", lt("媒介排期压缩", "Compressed media schedule"), lt("投放提前 5 天，但两家核心媒体尚未确认资源。", "Launch moved five days earlier, while two priority channels remain unconfirmed."), ["bg-t2"], lt("今日锁定备选版位并设置预算上限。", "Reserve backup placements today with a capped budget."), lt("6月13日", "Jun 13")),
    risk("bg-r2", "quality", "medium", lt("功效表达存在合规风险", "Efficacy claims need compliance review"), lt("两条达人脚本可能触发广告合规要求。", "Two creator scripts may trigger advertising compliance requirements."), ["bg-t3"], lt("拍摄前完成法务逐句审核。", "Complete line-by-line legal review before production."), lt("6月15日", "Jun 15")),
    risk("bg-r3", "resource", "medium", lt("后期制作负载偏高", "Post-production load is high"), lt("剪辑团队本周负载达到 96%。", "The editing team is at 96% capacity this week."), ["bg-t5"], lt("外包两条低复杂度素材的初剪。", "Outsource rough cuts for two low-complexity assets."), lt("6月18日", "Jun 18")),
  ],
  documents: emptyReports(),
  revision: 1,
  members: [
    member("bg-m1", "周冉", "Ran Zhou", "项目负责人", "Project lead", "周", "RZ", 84, "a1"),
    member("bg-m2", "贺川", "Chuan He", "媒介投放", "Paid Media", "贺", "CH", 91, "a2"),
    member("bg-m3", "叶青", "Qing Ye", "法务", "Legal", "叶", "QY", 76, "a3"),
    member("bg-m4", "许禾", "He Xu", "内容制作", "Production", "许", "HX", 96, "a1"),
    member("bg-m5", "陈默", "Mo Chen", "增长分析", "Growth Analytics", "陈", "MC", 82, "a2"),
  ],
};

export const INITIAL_WORKSPACE: PersistedWorkspace = {
  version: 1,
  activeProjectId: yunzhou.id,
  projects: {
    [yunzhou.id]: yunzhou,
    [membership.id]: membership,
    [brandGrowth.id]: brandGrowth,
  },
};

export function cloneInitialWorkspace(): PersistedWorkspace {
  return JSON.parse(JSON.stringify(INITIAL_WORKSPACE)) as PersistedWorkspace;
}

export function localize(value: LocalizedText, language: Language): string {
  return value[language] || value[language === "zh" ? "en" : "zh"];
}

export function markDocumentsStale(
  documents: ProjectDocuments,
): ProjectDocuments {
  const stale = (slot: ReportSlot): ReportSlot =>
    slot.status === "idle"
      ? slot
      : {
          ...slot,
          status: "stale",
          requestId: undefined,
          error: undefined,
        };

  return {
    selectedType: documents.selectedType,
    weekly: stale(documents.weekly),
    client: stale(documents.client),
  };
}

export function projectToAnalysis(
  project: ProjectWorkspace,
  language: Language,
): AnalysisResult {
  return {
    meetingTitle: localize(project.meetingTitle, language),
    summary: localize(project.summary, language),
    decisions: project.decisions.map((item) => localize(item, language)),
    participants: project.participants.map((item) => localize(item, language)),
    tasks: project.tasks.map((item) => ({
      id: item.id,
      title: localize(item.title, language),
      role: localize(item.role, language),
      assignee: localize(item.assignee, language),
      estimatedHours: item.estimatedHours,
      dueDate: localize(item.dueDate, language),
      status: item.status,
      priority: item.priority,
      rationale: localize(item.rationale, language),
    })),
    risks: project.risks.map((item) => ({
      id: item.id,
      type: item.type,
      severity: item.severity,
      title: localize(item.title, language),
      description: localize(item.description, language),
      affectedTasks: item.affectedTasks,
      suggestedAction: localize(item.suggestedAction, language),
      dueDate: localize(item.dueDate, language),
    })),
    transcript: localize(project.transcript, language) || localize(project.notes, language),
    analyzedAt: project.analyzedAt ?? project.updatedAt,
  };
}

export function recalculateProjectMetrics(
  project: ProjectWorkspace,
  previousProject?: ProjectWorkspace,
): ProjectWorkspace {
  const calculate = (value: ProjectWorkspace) => {
    const totalHours = value.tasks.reduce(
      (sum, item) => sum + Math.max(1, item.estimatedHours),
      0,
    );
    const progress = totalHours
      ? Math.round(
          value.tasks.reduce(
            (sum, item) =>
              sum + Math.max(1, item.estimatedHours) * item.progress,
            0,
          ) / totalHours,
        )
      : 0;
    const averageMemberLoad = value.members.length
      ? Math.round(
          value.members.reduce((sum, item) => sum + item.load, 0) /
            value.members.length,
        )
      : 0;
    const workloadIntensity = Math.min(
      100,
      Math.round(
        (totalHours / (Math.max(1, value.members.length) * 24)) * 100,
      ),
    );
    const teamLoad = Math.max(averageMemberLoad, workloadIntensity);
    const highRiskCount = value.risks.filter(
      (item) => item.severity === "high",
    ).length;
    const mediumRiskCount = value.risks.filter(
      (item) => item.severity === "medium",
    ).length;
    const health = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            highRiskCount * 12 -
            mediumRiskCount * 5 -
            Math.max(0, teamLoad - 85) * 0.4,
        ),
      ),
    );

    return { progress, teamLoad, health };
  };

  const next = calculate(project);
  if (!previousProject) return { ...project, ...next };

  const previous = calculate(previousProject);
  const applyDelta = (
    current: number,
    nextValue: number,
    previousValue: number,
  ) => Math.max(0, Math.min(100, current + nextValue - previousValue));

  return {
    ...project,
    progress: applyDelta(
      previousProject.progress,
      next.progress,
      previous.progress,
    ),
    teamLoad: applyDelta(
      previousProject.teamLoad,
      next.teamLoad,
      previous.teamLoad,
    ),
    health: applyDelta(
      previousProject.health,
      next.health,
      previous.health,
    ),
  };
}

function incoming(value: string): LocalizedText {
  return lt(value, value);
}

export function applyAnalysisToProject(
  project: ProjectWorkspace,
  result: AnalysisResult,
  language: Language,
): ProjectWorkspace {
  const now = new Date().toISOString();
  const isFirstAnalysis = !project.analyzedAt;
  const manualTasks = project.tasks.filter((item) => item.source === "manual");
  const manualTaskIds = new Set(manualTasks.map((item) => item.id));
  const aiTasks: WorkspaceTask[] = result.tasks
    .filter((item) => !manualTaskIds.has(item.id))
    .map((item) => ({
      id: item.id,
      title: incoming(item.title),
      role: incoming(item.role),
      assignee: incoming(item.assignee),
      estimatedHours: item.estimatedHours,
      dueDate: incoming(item.dueDate),
      status: item.status,
      priority: item.priority,
      rationale: incoming(item.rationale),
      progress: item.status === "review" ? 100 : item.status === "doing" ? 45 : 0,
      source: "ai",
    }));
  const nextTasks = [...aiTasks, ...manualTasks];
  const previousRisks = new Map(project.risks.map((item) => [item.id, item]));
  const nextRisks: WorkspaceRisk[] = result.risks.map((item) => {
    const previous = previousRisks.get(item.id);
    const incomingSeverity = item.severity;

    return {
      id: item.id,
      type: item.type,
      severity:
        previous?.severity === "resolved" ? "resolved" : incomingSeverity,
      previousSeverity:
        previous?.severity === "resolved"
          ? previous.previousSeverity ??
            (incomingSeverity === "resolved" ? "medium" : incomingSeverity)
          : previous?.previousSeverity,
      title: incoming(item.title),
      description: incoming(item.description),
      affectedTasks: item.affectedTasks,
      suggestedAction: incoming(item.suggestedAction),
      dueDate: incoming(item.dueDate),
      read: previous?.read ?? false,
    };
  });
  return recalculateProjectMetrics({
    ...project,
    updatedAt: now,
    notes: { ...project.notes, [language]: result.transcript },
    analysisStatus: "ready",
    analysisRequestId: undefined,
    analysisError: undefined,
    status:
      isFirstAnalysis && project.status === "planning"
        ? "active"
        : project.status,
    phase: isFirstAnalysis
      ? lt("执行对齐", "Execution alignment")
      : project.phase,
    overview: { ...project.overview, [language]: result.summary },
    meetingTitle: { ...project.meetingTitle, [language]: result.meetingTitle },
    summary: { ...project.summary, [language]: result.summary },
    decisions: result.decisions.map((item) => incoming(item)),
    participants: result.participants.map((item) => incoming(item)),
    transcript: { ...project.transcript, [language]: result.transcript },
    analyzedAt: result.analyzedAt,
    tasks: nextTasks,
    risks: nextRisks,
    documents: markDocumentsStale(project.documents),
    revision: project.revision + 1,
  });
}

export function createEmptyProject(
  name: string,
  owner: string,
): ProjectWorkspace {
  const now = new Date().toISOString();
  const id = `project-${Date.now().toString(36)}`;
  const localizedName = incoming(name.trim());
  const localizedOwner = incoming(owner.trim());

  return {
    id,
    name: localizedName,
    client: lt("", ""),
    owner: localizedOwner,
    status: "planning",
    phase: lt("项目初始化", "Project setup"),
    overview: lt(
      "项目已创建，上传第一次会议内容开始协作。",
      "Project created. Upload the first meeting to begin alignment.",
    ),
    color: "#6475d8",
    health: 100,
    progress: 0,
    teamLoad: 0,
    startDate: now.slice(0, 10),
    endDate: "",
    updatedAt: now,
    meetingMode: "text",
    notes: lt("", ""),
    audioFileMeta: null,
    analysisStatus: "idle",
    meetingTitle: lt("", ""),
    summary: lt("", ""),
    decisions: [],
    participants: [],
    transcript: lt("", ""),
    tasks: [],
    risks: [],
    documents: emptyReports(),
    revision: 0,
    members: [
      member(
        `${id}-owner`,
        owner.trim(),
        owner.trim(),
        "项目负责人",
        "Project lead",
        owner.trim().slice(0, 1),
        owner.trim().slice(0, 2).toUpperCase(),
        0,
        "a1",
      ),
    ],
  };
}

export function normalizePersistedWorkspace(
  value: unknown,
): PersistedWorkspace | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PersistedWorkspace>;
  if (candidate.version !== 1 || !candidate.projects) return null;

  const projects: Record<string, ProjectWorkspace> = {};
  for (const [id, project] of Object.entries(candidate.projects)) {
    if (!project || project.id !== id || !project.name || !project.documents) {
      continue;
    }

    const normalizeReport = (slot: ReportSlot): ReportSlot =>
      slot.status === "generating"
        ? { ...slot, status: "stale", requestId: undefined }
        : slot;

    projects[id] = {
      ...project,
      meetingMode: project.meetingMode ?? "text",
      analysisStatus:
        project.analysisStatus === "running"
          ? project.analyzedAt
            ? "stale"
            : "idle"
          : project.analysisStatus,
      analysisRequestId: undefined,
      documents: {
        ...project.documents,
        weekly: normalizeReport(project.documents.weekly),
        client: normalizeReport(project.documents.client),
      },
      tasks: (project.tasks ?? []).map((item) => ({
        ...item,
        progress:
          typeof item.progress === "number"
            ? item.progress
            : item.status === "review"
              ? 100
              : item.status === "doing"
                ? 45
                : 0,
        source: item.source ?? "ai",
      })),
      risks: (project.risks ?? []).map((item) => ({
        ...item,
        read: item.read ?? item.severity === "resolved",
      })),
      members: project.members ?? [],
      revision: project.revision ?? 0,
    };
  }

  if (!Object.keys(projects).length) return null;
  const activeProjectId =
    candidate.activeProjectId && projects[candidate.activeProjectId]
      ? candidate.activeProjectId
      : Object.keys(projects)[0];

  return { version: 1, activeProjectId, projects };
}
