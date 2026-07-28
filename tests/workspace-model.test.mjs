import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

async function loadWorkspaceModule() {
  const source = await readFile(
    new URL("../lib/workspaces.ts", import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const directory = await mkdtemp(join(tmpdir(), "teamalign-workspace-"));
  const modulePath = join(directory, "workspaces.cjs");
  await writeFile(modulePath, output, "utf8");
  const workspaceModule = createRequire(import.meta.url)(modulePath);

  return {
    workspaceModule,
    dispose: () => rm(directory, { recursive: true, force: true }),
  };
}

test("keeps project workspaces isolated by stable project id", async () => {
  const { workspaceModule, dispose } = await loadWorkspaceModule();
  try {
    const first = workspaceModule.cloneInitialWorkspace();
    const second = workspaceModule.cloneInitialWorkspace();
    const ids = Object.keys(first.projects);

    assert.equal(ids.length, 3);
    assert.equal(new Set(ids).size, 3);
    first.projects[ids[0]].notes.zh = "只修改第一个副本";
    first.projects[ids[0]].tasks.pop();

    assert.notEqual(
      first.projects[ids[0]].notes.zh,
      second.projects[ids[0]].notes.zh,
    );
    assert.notEqual(
      first.projects[ids[0]].tasks.length,
      second.projects[ids[0]].tasks.length,
    );
    assert.notDeepEqual(
      first.projects[ids[0]].tasks,
      first.projects[ids[1]].tasks,
    );
  } finally {
    await dispose();
  }
});

test("merges AI analysis without deleting manual work or resolved risk state", async () => {
  const { workspaceModule, dispose } = await loadWorkspaceModule();
  try {
    const project = workspaceModule.createEmptyProject("七月增长", "林晓");
    project.tasks.push({
      id: "manual-1",
      title: { zh: "手工任务", en: "Manual task" },
      role: { zh: "产品", en: "Product" },
      assignee: { zh: "林晓", en: "Lin Xiao" },
      estimatedHours: 4,
      dueDate: { zh: "明天", en: "Tomorrow" },
      status: "todo",
      priority: "P1",
      rationale: { zh: "手动添加", en: "Added manually" },
      progress: 0,
      source: "manual",
    });
    project.risks.push({
      id: "risk-1",
      type: "resource",
      severity: "resolved",
      previousSeverity: "high",
      title: { zh: "旧风险", en: "Existing risk" },
      description: { zh: "已处理", en: "Handled" },
      affectedTasks: ["manual-1"],
      suggestedAction: { zh: "保持", en: "Maintain" },
      dueDate: { zh: "今天", en: "Today" },
      read: true,
    });

    const result = {
      meetingTitle: "七月项目周会",
      summary: "项目已进入执行阶段。",
      decisions: ["确认排期"],
      participants: ["产品", "研发"],
      tasks: [
        {
          id: "ai-1",
          title: "完成接口联调",
          role: "后端研发",
          assignee: "待分配",
          estimatedHours: 8,
          dueDate: "周五",
          status: "doing",
          priority: "P0",
          rationale: "会议明确要求",
        },
      ],
      risks: [
        {
          id: "risk-1",
          type: "resource",
          severity: "high",
          title: "测试资源冲突",
          description: "资源重复占用",
          affectedTasks: ["ai-1"],
          suggestedAction: "协调临时支持",
          dueDate: "周四",
        },
      ],
      transcript: "完整会议纪要",
      analyzedAt: "2026-07-27T20:00:00.000Z",
    };
    const updated = workspaceModule.applyAnalysisToProject(
      project,
      result,
      "zh",
    );

    assert.deepEqual(
      updated.tasks.map((item) => item.id).sort(),
      ["ai-1", "manual-1"],
    );
    assert.equal(updated.risks[0].severity, "resolved");
    assert.equal(updated.risks[0].previousSeverity, "high");
    assert.equal(updated.status, "active");
    assert.equal(updated.phase.zh, "执行对齐");
    assert.equal(updated.overview.zh, result.summary);
    assert.ok(updated.teamLoad > 0);
  } finally {
    await dispose();
  }
});

test("keeps report language metadata while marking generated files stale", async () => {
  const { workspaceModule, dispose } = await loadWorkspaceModule();
  try {
    const documents = {
      selectedType: "weekly",
      weekly: {
        status: "ready",
        language: "zh",
        assetKey: "report:project:weekly:zh",
      },
      client: { status: "idle" },
    };
    const stale = workspaceModule.markDocumentsStale(documents);

    assert.equal(stale.weekly.status, "stale");
    assert.equal(stale.weekly.language, "zh");
    assert.equal(stale.weekly.assetKey, "report:project:weekly:zh");
    assert.equal(stale.client.status, "idle");
  } finally {
    await dispose();
  }
});
