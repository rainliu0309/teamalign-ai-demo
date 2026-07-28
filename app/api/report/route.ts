import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  apiErrorResponse,
  extractJson,
  getTextClient,
  getTextModel,
} from "../../../lib/openai";
import type {
  AnalysisResult,
  GeneratedReport,
} from "../../../lib/teamalign";
import { isGeneratedReport } from "../../../lib/teamalign";

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "subtitle",
    "executiveSummary",
    "highlights",
    "completed",
    "inProgress",
    "nextSteps",
    "risks",
    "recommendations",
    "closing",
  ],
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    executiveSummary: { type: "string" },
    highlights: { type: "array", items: { type: "string" } },
    completed: { type: "array", items: { type: "string" } },
    inProgress: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    closing: { type: "string" },
  },
} as const;

function bullets(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        text: item,
        bullet: { level: 0 },
        spacing: { after: 90 },
      }),
  );
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
  });
}

function buildDocument(report: GeneratedReport, language: "zh" | "en") {
  const sectionLabels =
    language === "zh"
      ? {
          summary: "执行摘要",
          highlights: "本期亮点",
          completed: "已完成事项",
          progress: "进行中事项",
          next: "下一步计划",
          risks: "风险与关注项",
          recommendations: "建议与行动",
        }
      : {
          summary: "Executive summary",
          highlights: "Highlights",
          completed: "Completed",
          progress: "In progress",
          next: "Next steps",
          risks: "Risks and attention",
          recommendations: "Recommendations",
        };

  return new Document({
    creator: "TeamAlign AI",
    title: report.title,
    description: report.executiveSummary,
    sections: [
      {
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: {
                      type: ShadingType.CLEAR,
                      fill: "172A46",
                      color: "auto",
                    },
                    margins: {
                      top: 260,
                      bottom: 260,
                      left: 300,
                      right: 300,
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({
                            text: "TeamAlign AI",
                            color: "FFFFFF",
                            bold: true,
                            size: 26,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: report.title,
            heading: HeadingLevel.TITLE,
            spacing: { before: 420, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: report.subtitle,
                color: "6F7889",
                size: 20,
              }),
            ],
            spacing: { after: 300 },
          }),
          heading(sectionLabels.summary),
          new Paragraph({
            text: report.executiveSummary,
            spacing: { after: 140, line: 340 },
          }),
          heading(sectionLabels.highlights),
          ...bullets(report.highlights),
          heading(sectionLabels.completed),
          ...bullets(report.completed),
          heading(sectionLabels.progress),
          ...bullets(report.inProgress),
          heading(sectionLabels.next),
          ...bullets(report.nextSteps),
          heading(sectionLabels.risks),
          ...bullets(report.risks),
          heading(sectionLabels.recommendations),
          ...bullets(report.recommendations),
          new Paragraph({
            text: report.closing,
            spacing: { before: 320, after: 120, line: 340 },
            border: {
              top: {
                color: "DDE2EA",
                space: 12,
                style: "single",
                size: 4,
              },
            },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "Generated by TeamAlign AI",
                color: "929AA8",
                italics: true,
                size: 16,
              }),
            ],
          }),
        ],
      },
    ],
  });
}

async function reportDocumentResponse(
  report: GeneratedReport,
  language: "zh" | "en",
  reportType: "weekly" | "client",
) {
  const document = buildDocument(report, language);
  const blob = await Packer.toBlob(document);
  const safeName =
    reportType === "client"
      ? "TeamAlign-client-progress"
      : "TeamAlign-team-weekly";

  return new Response(blob, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      "X-Report-Title": encodeURIComponent(report.title),
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      analysis?: AnalysisResult;
      report?: GeneratedReport;
      mode?: "preview" | "docx";
      type?: "weekly" | "client";
      language?: "zh" | "en";
      projectName?: string;
      revision?: number;
      projectContext?: {
        phase?: string;
        health?: number;
        progress?: number;
        teamLoad?: number;
      };
    };
    const language = payload.language === "en" ? "en" : "zh";
    const reportType = payload.type === "client" ? "client" : "weekly";

    if (payload.report) {
      if (!isGeneratedReport(payload.report)) {
        return Response.json(
          {
            error: "INVALID_REPORT_PAYLOAD",
            message: "报告内容不完整，请重新生成。",
          },
          { status: 400 },
        );
      }
      return reportDocumentResponse(payload.report, language, reportType);
    }

    if (!payload.analysis?.summary || !payload.analysis.tasks?.length) {
      return Response.json(
        {
          error: "ANALYSIS_REQUIRED",
          message: "请先完成一次真实的会议分析，再生成周报。",
        },
        { status: 400 },
      );
    }

    const completion = await getTextClient().chat.completions.create({
      model: getTextModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are TeamAlign AI's professional project reporting agent.
Create a factual ${
            reportType === "client"
              ? "external client progress brief"
              : "internal team retrospective weekly report"
          } from the supplied analysis.
${
  reportType === "client"
              ? "Use confident client-safe language. Exclude internal staffing details and blame. Frame risks with mitigation and ownership."
              : "Be candid about blockers, ownership, workload, execution gaps and lessons learned."
}
Use ${language === "zh" ? "Simplified Chinese" : "English"}. Do not invent metrics, progress, dates or outcomes.
Return one valid JSON object only. Do not use Markdown fences or add prose.
The JSON must match this schema exactly:
${JSON.stringify(reportSchema)}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            project: payload.projectName || "Untitled project",
            revision: payload.revision,
            projectContext: payload.projectContext,
            analysis: payload.analysis,
          }),
        },
      ],
    });

    const report = extractJson(
      completion.choices[0]?.message.content ?? null,
    );
    if (!isGeneratedReport(report)) {
      throw new Error("INVALID_AI_RESPONSE");
    }
    if (payload.mode === "preview") {
      return Response.json({ report });
    }

    return reportDocumentResponse(report, language, reportType);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
