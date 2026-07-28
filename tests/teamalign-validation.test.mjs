import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

async function loadValidationModule() {
  const source = await readFile(
    new URL("../lib/teamalign.ts", import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const directory = await mkdtemp(join(tmpdir(), "teamalign-validation-"));
  const modulePath = join(directory, "teamalign.cjs");
  await writeFile(modulePath, output, "utf8");

  return {
    validationModule: createRequire(import.meta.url)(modulePath),
    dispose: () => rm(directory, { recursive: true, force: true }),
  };
}

const validAnalysis = {
  meetingTitle: "项目周会",
  summary: "项目按计划推进。",
  decisions: ["确认排期"],
  participants: ["产品", "研发"],
  tasks: [
    {
      id: "task-1",
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
      type: "dependency",
      severity: "medium",
      title: "接口依赖",
      description: "上游文档未完成",
      affectedTasks: ["task-1"],
      suggestedAction: "今日补齐文档",
      dueDate: "今天",
    },
  ],
};

test("accepts complete AI analysis and rejects malformed or duplicate data", async () => {
  const { validationModule, dispose } = await loadValidationModule();
  try {
    assert.equal(validationModule.isAnalysisDraft(validAnalysis), true);
    assert.equal(
      validationModule.isAnalysisDraft({
        ...validAnalysis,
        tasks: [{ ...validAnalysis.tasks[0], status: "blocked" }],
      }),
      false,
    );
    assert.equal(
      validationModule.isAnalysisDraft({
        ...validAnalysis,
        tasks: [validAnalysis.tasks[0], validAnalysis.tasks[0]],
      }),
      false,
    );
    assert.equal(
      validationModule.isAnalysisDraft({
        ...validAnalysis,
        risks: undefined,
      }),
      false,
    );
  } finally {
    await dispose();
  }
});

test("validates report preview content before DOCX generation", async () => {
  const { validationModule, dispose } = await loadValidationModule();
  try {
    const report = {
      title: "项目周报",
      subtitle: "第 30 周",
      executiveSummary: "本周核心链路进入联调。",
      highlights: ["接口联调启动"],
      completed: ["方案评审"],
      inProgress: ["活动页适配"],
      nextSteps: ["完成回归"],
      risks: ["测试资源冲突"],
      recommendations: ["协调临时测试支持"],
      closing: "下周继续按里程碑推进。",
    };

    assert.equal(validationModule.isGeneratedReport(report), true);
    assert.equal(
      validationModule.isGeneratedReport({
        ...report,
        recommendations: "协调临时测试支持",
      }),
      false,
    );
  } finally {
    await dispose();
  }
});
