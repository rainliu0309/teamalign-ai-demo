import {
  apiErrorResponse,
  extractJson,
  getTextClient,
  getTextModel,
} from "../../../lib/openai";
import {
  isAnalysisDraft,
  normalizeMeetingTitle,
  type AnalysisResult,
} from "../../../lib/teamalign";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "meetingTitle",
    "summary",
    "decisions",
    "participants",
    "tasks",
    "risks",
  ],
  properties: {
    meetingTitle: { type: "string" },
    summary: { type: "string" },
    decisions: {
      type: "array",
      items: { type: "string" },
    },
    participants: {
      type: "array",
      items: { type: "string" },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "role",
          "assignee",
          "estimatedHours",
          "dueDate",
          "status",
          "priority",
          "rationale",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          role: { type: "string" },
          assignee: { type: "string" },
          estimatedHours: { type: "number" },
          dueDate: { type: "string" },
          status: { type: "string", enum: ["todo", "doing", "review"] },
          priority: { type: "string", enum: ["P0", "P1", "P2"] },
          rationale: { type: "string" },
        },
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "type",
          "severity",
          "title",
          "description",
          "affectedTasks",
          "suggestedAction",
          "dueDate",
        ],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["schedule", "resource", "dependency", "scope", "quality"],
          },
          severity: {
            type: "string",
            enum: ["high", "medium", "resolved"],
          },
          title: { type: "string" },
          description: { type: "string" },
          affectedTasks: {
            type: "array",
            items: { type: "string" },
          },
          suggestedAction: { type: "string" },
          dueDate: { type: "string" },
        },
      },
    },
  },
} as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const language = formData.get("language") === "en" ? "en" : "zh";
    const projectName = String(formData.get("projectName") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const transcript = notes;

    if (!transcript || transcript.length < 20) {
      return Response.json(
        {
          error: "CONTENT_TOO_SHORT",
          message: "请提供至少 20 个字符的会议纪要或有效音频。",
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
          content: `You are TeamAlign AI, a senior bilingual project operations agent for Chinese internet and e-commerce teams.
Analyze the meeting transcript and return only grounded project information.
Never invent a named assignee. If a role is clear but no person is named, set assignee to ${
            language === "zh" ? '"待分配"' : '"Unassigned"'
          }.
Break work into concrete, independently executable tasks. Assign each task to the best-fit role, estimate practical hours, and use dates from the meeting when available.
Detect schedule conflicts, resource overload, cross-task dependencies, scope ambiguity, and quality risks. Explain evidence and a useful mitigation.
Use ${language === "zh" ? "Simplified Chinese" : "English"} for all generated text. Preserve names and proper nouns from the transcript.
Return one valid JSON object only. Do not use Markdown fences or add prose.
The JSON must match this schema exactly:
${JSON.stringify(analysisSchema)}`,
        },
        {
          role: "user",
          content: `Current date: ${new Date().toISOString().slice(0, 10)}
Current project: ${projectName || "TeamAlign workspace"}

Meeting transcript:
${transcript}`,
        },
      ],
    });

    const parsed = extractJson(
      completion.choices[0]?.message.content ?? null,
    );
    if (!isAnalysisDraft(parsed)) {
      throw new Error("INVALID_AI_RESPONSE");
    }

    return Response.json({
      ...parsed,
      meetingTitle: normalizeMeetingTitle(parsed.meetingTitle),
      transcript,
      analyzedAt: new Date().toISOString(),
    } satisfies AnalysisResult);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
