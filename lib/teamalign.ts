export type ProjectTask = {
  id: string;
  title: string;
  role: string;
  assignee: string;
  estimatedHours: number;
  dueDate: string;
  status: "todo" | "doing" | "review";
  priority: "P0" | "P1" | "P2";
  rationale: string;
};

export type ProjectRisk = {
  id: string;
  type: "schedule" | "resource" | "dependency" | "scope" | "quality";
  severity: "high" | "medium" | "resolved";
  title: string;
  description: string;
  affectedTasks: string[];
  suggestedAction: string;
  dueDate: string;
};

export type AnalysisResult = {
  meetingTitle: string;
  summary: string;
  decisions: string[];
  participants: string[];
  tasks: ProjectTask[];
  risks: ProjectRisk[];
  transcript: string;
  analyzedAt: string;
};

export type GeneratedReport = {
  title: string;
  subtitle: string;
  executiveSummary: string;
  highlights: string[];
  completed: string[];
  inProgress: string[];
  nextSteps: string[];
  risks: string[];
  recommendations: string[];
  closing: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isAnalysisDraft(
  value: unknown,
): value is Omit<AnalysisResult, "transcript" | "analyzedAt"> {
  if (!isRecord(value)) return false;
  if (
    typeof value.meetingTitle !== "string" ||
    typeof value.summary !== "string" ||
    !isStringArray(value.decisions) ||
    !isStringArray(value.participants) ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.risks)
  ) {
    return false;
  }

  const validTaskStatuses = new Set(["todo", "doing", "review"]);
  const validPriorities = new Set(["P0", "P1", "P2"]);
  const validRiskTypes = new Set([
    "schedule",
    "resource",
    "dependency",
    "scope",
    "quality",
  ]);
  const validSeverities = new Set(["high", "medium", "resolved"]);

  const tasksAreValid = value.tasks.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.role === "string" &&
        typeof item.assignee === "string" &&
        typeof item.estimatedHours === "number" &&
        Number.isFinite(item.estimatedHours) &&
        item.estimatedHours > 0 &&
        typeof item.dueDate === "string" &&
        typeof item.status === "string" &&
        validTaskStatuses.has(item.status) &&
        typeof item.priority === "string" &&
        validPriorities.has(item.priority) &&
        typeof item.rationale === "string",
    );
  const risksAreValid = value.risks.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.type === "string" &&
        validRiskTypes.has(item.type) &&
        typeof item.severity === "string" &&
        validSeverities.has(item.severity) &&
        typeof item.title === "string" &&
        typeof item.description === "string" &&
        isStringArray(item.affectedTasks) &&
        typeof item.suggestedAction === "string" &&
        typeof item.dueDate === "string",
    );
  if (!tasksAreValid || !risksAreValid) return false;

  const taskIds = value.tasks.map((item) => (item as { id: string }).id);
  const riskIds = value.risks.map((item) => (item as { id: string }).id);
  return (
    new Set(taskIds).size === taskIds.length &&
    new Set(riskIds).size === riskIds.length
  );
}

export function isGeneratedReport(value: unknown): value is GeneratedReport {
  if (!isRecord(value)) return false;

  return (
    typeof value.title === "string" &&
    typeof value.subtitle === "string" &&
    typeof value.executiveSummary === "string" &&
    isStringArray(value.highlights) &&
    isStringArray(value.completed) &&
    isStringArray(value.inProgress) &&
    isStringArray(value.nextSteps) &&
    isStringArray(value.risks) &&
    isStringArray(value.recommendations) &&
    typeof value.closing === "string"
  );
}

// A small guard for a common Mandarin ASR homophone in meeting titles.
// “项目抽会” is not a project-management term; it should read “项目周会”.
export function normalizeMeetingTitle(title: string) {
  return title.replaceAll("项目抽会", "项目周会").replaceAll("项目抽會", "项目周会");
}
