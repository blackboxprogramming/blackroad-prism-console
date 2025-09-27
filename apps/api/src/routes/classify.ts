import { Router } from "express";
import { classifyText } from "@lucidia/ai";
import {
  classificationResponseSchema,
  parseClassificationResponse,
} from "@lucidia/core";

const router = Router();

router.post("/classify", (req, res) => {
  const { text, seed, maxSuggestions, consent } = req.body ?? {};

  if (!consent) {
    return res.status(400).json({
      error: "ConsentMissing",
      message: "Explicit consent is required before classification.",
    });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      error: "InvalidText",
      message: "Provide text to classify.",
    });
  }

  const response = classifyText(text, {
    seed: typeof seed === "number" ? seed : undefined,
    maxSuggestions:
      typeof maxSuggestions === "number" && maxSuggestions > 0
        ? Math.floor(maxSuggestions)
        : undefined,
  });

  const payload = classificationResponseSchema.parse(response);
  const audit = {
    who: req.ip ?? "unknown",
    purpose: "Auto-Box preview",
  };

  res.json({
    data: parseClassificationResponse(payload),
    audit,
  });
});

export default router;
