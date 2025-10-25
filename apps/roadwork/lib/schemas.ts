import { z } from 'zod';

export const lessonSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  estMinutes: z.number().int().min(1),
  outcomes: z.array(z.string()).min(1)
});

export const lessonsResponseSchema = z.object({
  lessons: z.array(lessonSchema)
});

export const questionSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  stem: z.string(),
  kind: z.enum(['mcq', 'numeric', 'short']),
  choices: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .optional(),
  answer: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  hints: z.array(z.string()).optional()
});

export const questionsResponseSchema = z.object({
  questions: z.array(questionSchema)
});

export const quizStartResponseSchema = z.object({
  attemptId: z.string(),
  lessonId: z.string(),
  firstQuestion: questionSchema
});

export const quizNextResponseSchema = z.object({
  question: questionSchema
});

export const quizSubmitResponseSchema = z.object({
  score: z.number().min(0).max(100),
  masteryDelta: z.number().min(-1).max(1)
});

export type Lesson = z.infer<typeof lessonSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuizStartResponse = z.infer<typeof quizStartResponseSchema>;
export type QuizNextResponse = z.infer<typeof quizNextResponseSchema>;
export type QuizSubmitResponse = z.infer<typeof quizSubmitResponseSchema>;
