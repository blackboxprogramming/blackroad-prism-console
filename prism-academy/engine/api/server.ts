import express, { type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

import { score } from "../runtime/evaluation";
import type { Breakdown } from "../runtime/evaluation";
import { concatenateChannels } from "../runtime/normalize";
import { buildFeedback } from "../runtime/feedback";

const ROOT = path.resolve(process.cwd(), "prism-academy");
const HOMEWORK_ROOT = path.join(ROOT, "homework");
const ASSIGNMENTS_DIR = path.join(HOMEWORK_ROOT, "assignments");
const RUBRICS_DIR = path.join(HOMEWORK_ROOT, "rubrics");
const DATA_DIR = path.join(ROOT, ".data");
const SUBMISSIONS_STORE = path.join(DATA_DIR, "submissions.json");
const FEEDBACK_STORE = path.join(DATA_DIR, "feedback.json");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let submissionValidator: ValidateFunction | null = null;
let feedbackValidator: ValidateFunction | null = null;

async function loadSchema(name: string) {
  const file = path.join(HOMEWORK_ROOT, "schemas", `${name}.schema.json`);
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

async function ensureDataStores() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const file of [SUBMISSIONS_STORE, FEEDBACK_STORE]) {
    try {
      await fs.access(file);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        await fs.writeFile(file, "[]", "utf-8");
      } else {
        throw error;
      }
    }
  }
}

type SubmissionRecord = {
  assignment_id: string;
  agent_id: string;
  channels: string[];
  content: {
    text?: string;
    emoji?: string;
    scene_actions?: string[];
  };
  metadata?: Record<string, unknown>;
  submitted_at: string;
};

type FeedbackRecord = {
  assignment_id: string;
  agent_id: string;
  score: number;
  breakdown: Breakdown;
  comments: string[];
  next_steps: string[];
  graded_at: string;
};

async function readStore<T>(file: string): Promise<T[]> {
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as T[];
}

async function writeStore<T>(file: string, data: T[]): Promise<void> {
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

async function listAssignments() {
  const files = await fs.readdir(ASSIGNMENTS_DIR);
  const payload = await Promise.all(
    files.filter((file) => file.endsWith(".json")).map(async (file) => {
      const raw = await fs.readFile(path.join(ASSIGNMENTS_DIR, file), "utf-8");
      return JSON.parse(raw);
    })
  );
  return payload;
}

async function loadAssignment(id: string) {
  const file = path.join(ASSIGNMENTS_DIR, `${id}.json`);
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

async function loadRubric(name: string) {
  const file = path.join(RUBRICS_DIR, `${name}.json`);
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

function parseChain(value?: string): string[] {
  if (!value) {
    return [];
  }
  const normalized = value.replace(/->/g, "→");
  return normalized
    .split("→")
    .map((piece) => piece.trim())
    .filter(Boolean);
}

function extractChainFromAssignment(assignment: any): string[] {
  const promptMatch = typeof assignment?.prompt === "string" ? assignment.prompt.match(/([\p{Extended_Pictographic}]{1,2}(?:→[\p{Extended_Pictographic}]{1,2})+)/u) : null;
  if (promptMatch && promptMatch[1]) {
    return parseChain(promptMatch[1]);
  }
  if (Array.isArray(assignment?.examples)) {
    for (const example of assignment.examples) {
      if (typeof example !== "string") continue;
      const exampleMatch = example.match(/([\p{Extended_Pictographic}]{1,2}(?:→[\p{Extended_Pictographic}]{1,2})+)/u);
      if (exampleMatch && exampleMatch[1]) {
        return parseChain(exampleMatch[1]);
      }
    }
  }
  return [];
}

async function appendSubmission(record: SubmissionRecord) {
  const submissions = await readStore<SubmissionRecord>(SUBMISSIONS_STORE);
  submissions.push(record);
  await writeStore(SUBMISSIONS_STORE, submissions);
}

async function upsertFeedback(record: FeedbackRecord) {
  const feedback = await readStore<FeedbackRecord>(FEEDBACK_STORE);
  const index = feedback.findIndex(
    (item) => item.assignment_id === record.assignment_id && item.agent_id === record.agent_id
  );
  if (index === -1) {
    feedback.push(record);
  } else {
    feedback[index] = record;
  }
  await writeStore(FEEDBACK_STORE, feedback);
}

function formatValidationErrors(validate: ValidateFunction) {
  if (!validate.errors?.length) {
    return [];
  }
  return validate.errors.map((error) => `${error.instancePath || "body"} ${error.message}`);
}

function derivePeerChain(submission: SubmissionRecord, assignment: any): string[] {
  const fromSubmission = parseChain(submission.content?.emoji ?? "");
  if (fromSubmission.length) {
    return fromSubmission;
  }
  return extractChainFromAssignment(assignment);
}

function mergeRubrics(base: any, override: any) {
  if (!override) {
    return base;
  }
  return {
    ...base,
    ...override,
    weights: { ...(base?.weights ?? {}), ...(override?.weights ?? {}) },
    thresholds: { ...(base?.thresholds ?? {}), ...(override?.thresholds ?? {}) },
    notes: { ...(base?.notes ?? {}), ...(override?.notes ?? {}) }
  };
}

async function findLatestSubmission(assignmentId: string, agentId: string) {
  const submissions = await readStore<SubmissionRecord>(SUBMISSIONS_STORE);
  const matches = submissions
    .filter((item) => item.assignment_id === assignmentId && item.agent_id === agentId)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  return matches[0];
}

async function gradeSubmission(submission: SubmissionRecord, assignment: any, baseRubric: any) {
  const rubric = mergeRubrics(baseRubric, assignment?.rubric);
  const peerChain = derivePeerChain(submission, assignment);
  const content = concatenateChannels(submission.content);
  const { score: value, breakdown } = score(content, rubric, peerChain);
  const feedbackNotes = buildFeedback({ breakdown, rubricNotes: rubric?.notes });
  return {
    assignment_id: submission.assignment_id,
    agent_id: submission.agent_id,
    score: Number(value.toFixed(4)),
    breakdown,
    comments: feedbackNotes.comments,
    next_steps: feedbackNotes.next_steps,
    graded_at: new Date().toISOString()
  } as FeedbackRecord;
}

export async function createHomeworkServer() {
  await ensureDataStores();
  const submissionSchema = await loadSchema("submission");
  const feedbackSchema = await loadSchema("feedback");
  submissionValidator = ajv.compile(submissionSchema);
  feedbackValidator = ajv.compile(feedbackSchema);
  const empathyRubric = await loadRubric("empathy-v1");

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/assignments", async (_req: Request, res: Response) => {
    try {
      const assignments = await listAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to load assignments", details: `${error}` });
    }
  });

  app.get("/assignments/:id", async (req: Request, res: Response) => {
    try {
      const assignment = await loadAssignment(req.params.id);
      res.json(assignment);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        res.status(404).json({ error: "Assignment not found" });
      } else {
        res.status(500).json({ error: "Failed to load assignment", details: `${error}` });
      }
    }
  });

  app.post("/submit", async (req: Request, res: Response) => {
    if (!submissionValidator) {
      res.status(503).json({ error: "Server not ready" });
      return;
    }
    const payload = req.body;
    const isValid = submissionValidator(payload);
    if (!isValid) {
      res.status(400).json({ error: "Invalid submission", details: formatValidationErrors(submissionValidator) });
      return;
    }
    const record: SubmissionRecord = {
      ...payload,
      submitted_at: new Date().toISOString()
    };
    await appendSubmission(record);
    res.status(202).json({ status: "queued", submission: record });
  });

  app.post("/grade", async (req: Request, res: Response) => {
    const { assignment_id: assignmentId, agent_id: agentId } = req.body ?? {};
    if (!assignmentId || !agentId) {
      res.status(400).json({ error: "assignment_id and agent_id are required" });
      return;
    }
    try {
      const assignment = await loadAssignment(assignmentId);
      const submission = req.body?.submission ?? (await findLatestSubmission(assignmentId, agentId));
      if (!submission) {
        res.status(404).json({ error: "No submission found for grading" });
        return;
      }
      const normalizedSubmission: SubmissionRecord = {
        ...submission,
        assignment_id: assignmentId,
        agent_id: agentId,
        channels: submission.channels ?? [],
        content: submission.content ?? {},
        metadata: submission.metadata,
        submitted_at: submission.submitted_at ?? new Date().toISOString()
      };
      const feedback = await gradeSubmission(normalizedSubmission, assignment, empathyRubric);
      if (feedbackValidator && !feedbackValidator(feedback)) {
        res.status(500).json({ error: "Feedback failed validation", details: formatValidationErrors(feedbackValidator) });
        return;
      }
      await upsertFeedback(feedback);
      res.json(feedback);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        res.status(404).json({ error: "Assignment not found" });
      } else {
        res.status(500).json({ error: "Failed to grade submission", details: `${error}` });
      }
    }
  });

  app.get("/grades/:agentId", async (req: Request, res: Response) => {
    try {
      const allFeedback = await readStore<FeedbackRecord>(FEEDBACK_STORE);
      const filtered = allFeedback.filter((item) => item.agent_id === req.params.agentId);
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to load grades", details: `${error}` });
    }
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return { app };
}

if (process.env.NODE_ENV !== "test") {
  createHomeworkServer().then(({ app }) => {
    const port = Number(process.env.PRISM_HOMEWORK_PORT ?? 5151);
    app.listen(port, () => {
      console.log(`Prism Homework server ready on http://localhost:${port}`);
    });
  });
}
