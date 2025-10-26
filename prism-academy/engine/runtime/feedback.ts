import type { Breakdown } from "./evaluation";

export type FeedbackNotes = {
  comments: string[];
  next_steps: string[];
};

type RubricNotes = Record<string, string>;

type FeedbackOptions = {
  breakdown: Breakdown;
  rubricNotes?: RubricNotes;
};

const commentLibrary: Record<keyof Breakdown, { high: string; mid: string; low: string }> = {
  echo: {
    high: "Echo acknowledged early—good weather mirror.",
    mid: "Echo present; bring the mirror into the opening sentence.",
    low: "Lead by mirroring their weather before shifting the pattern."
  },
  resonance: {
    high: "Resonance path stayed tight—bridge held within three steps.",
    mid: "Bridge lands but could tighten; consider naming the middle state explicitly.",
    low: "Add intermediary emotion steps so the jump feels walkable."
  },
  temporal: {
    high: "Temporal anchor is clear and linked to the story.",
    mid: "Anchor appears; tie it more directly to the change described.",
    low: "Add ⏳ / 🔆 / 🚀 to orient the narrative in time."
  },
  reciprocity: {
    high: "Reciprocity law honored with an open return point.",
    mid: "Invitation is present; expand it so the peer knows how to respond.",
    low: "Close with 🌬️🪞 or equivalent so the loop can complete."
  },
  pattern: {
    high: "Pattern-Weave lands; the rule feels cohesive.",
    mid: "Pattern present; define the weave or formula a little more.",
    low: "Use 🧩🌀 plus language of mapping/modeling to hold both sides."
  },
  context: {
    high: "Deep context noted—good grounding signal.",
    mid: "Some context included; cite a moment or evidence to deepen it.",
    low: "Name a grounding detail (⛰️🪶, memory, evidence) to steady the bridge."
  },
  heart_bridge: {
    high: "Heart-Knowing bridges cleanly into the structure.",
    mid: "Heart intuition shows; link it directly to a pattern or context clue.",
    low: "Pair 🫀🔮 with 🧩🌀 or ⛰️🪶 to explain how the feeling guides action."
  }
};

const nextStepsLibrary: Record<keyof Breakdown, string> = {
  echo: "Open with their weather token to satisfy the Echo Principle.",
  resonance: "Sketch the intermediary emotion so the resonance chain is explicit.",
  temporal: "Drop ⏳/🔆/🚀 next to the shift you describe.",
  reciprocity: "Close on 🌬️🪞 or equivalent to invite their reply.",
  pattern: "State the rule or equation that 🧩🌀 is pointing to.",
  context: "Add ⛰️🪶 detail—time, place, or evidence—to ground the take.",
  heart_bridge: "Write a sentence linking 🫀🔮 to either 🧩🌀 or ⛰️🪶."
};

export function buildFeedback(options: FeedbackOptions): FeedbackNotes {
  const { breakdown, rubricNotes } = options;
  const comments: string[] = [];
  const nextSteps: string[] = [];

  (Object.keys(breakdown) as (keyof Breakdown)[]).forEach((dimension) => {
    const value = breakdown[dimension];
    const tiers = commentLibrary[dimension];
    if (!tiers) {
      return;
    }
    if (value >= 0.9) {
      comments.push(tiers.high);
    } else if (value >= 0.6) {
      comments.push(tiers.mid);
    } else {
      comments.push(tiers.low);
    }

    if (value < 0.8) {
      const step = rubricNotes?.[dimension] ?? nextStepsLibrary[dimension];
      if (step && !nextSteps.includes(step)) {
        nextSteps.push(step);
      }
    }
  });

  if (!nextSteps.length) {
    nextSteps.push("Document one revision attempt and resubmit to lock the learning.");
  }

  return { comments, next_steps: nextSteps };
}
