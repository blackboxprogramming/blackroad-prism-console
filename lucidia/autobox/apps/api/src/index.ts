import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import {
  classificationResponseSchema,
  buildExplainabilityRecord,
  explainabilityRecordSchema,
} from "@lucidia/core";
import { classifyText } from "@lucidia/ai";

const requestSchema = z.object({
  text: z.string().max(8000),
  seed: z.string().optional(),
  maxSuggestions: z.number().int().min(1).max(8).optional(),
  consentToken: z.string().optional(),
});

type RequestPayload = z.infer<typeof requestSchema>;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));

app.post("/classify", (req, res) => {
  let payload: RequestPayload;
  try {
    payload = requestSchema.parse(req.body);
  } catch (error) {
    return res.status(400).json({
      error: "invalid_request",
      details: error instanceof Error ? error.message : "unknown error",
    });
  }

  if (!payload.consentToken) {
    return res.status(412).json({
      error: "consent_required",
      message: "Explicit consent is required before processing text.",
    });
  }

  const response = classifyText({
    text: payload.text,
    seed: payload.seed,
    maxSuggestions: payload.maxSuggestions,
  });

  const explainability = response.suggestions.map((suggestion) =>
    buildExplainabilityRecord(
      response.previewId,
      payload.text,
      suggestion,
      suggestion.tags
    )
  );

  return res.json({
    preview: classificationResponseSchema.parse(response),
    explainability: explainability.map((record) =>
      explainabilityRecordSchema.parse(record)
    ),
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Lucidia Auto-Box API listening on port ${port}`);
  });
}

export default app;
