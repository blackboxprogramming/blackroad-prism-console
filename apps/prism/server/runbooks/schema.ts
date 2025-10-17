import { z } from "zod";

export const guardSchema = z.object({
  answerId: z.string(),
  equals: z.any().optional(),
  notEquals: z.any().optional(),
  regex: z.string().optional(),
});

export const runbookSchema = z.object({
  id: z.string(),
  title: z.string(),
  match: z.array(
    z.object({
      errorRegex: z.array(z.string()).optional(),
      fileRegex: z.array(z.string()).optional(),
      exitCode: z.array(z.number()).optional(),
      lang: z.array(z.enum(["python", "node", "go", "generic"])).optional(),
    })
  ),
  questions: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      kind: z.enum(["boolean", "text", "select"]),
      options: z.array(z.string()).optional(),
      default: z.any().optional(),
      when: z
        .array(
          z.object({
            questionId: z.string(),
            equals: z.any().optional(),
            notEquals: z.any().optional(),
            regex: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  probes: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["fileExists", "cmdOk", "portFree", "envPresent"]),
        args: z.record(z.union([z.string(), z.number()])),
        set: z.string(),
      })
    )
    .optional(),
  plan: z.object({
    steps: z.array(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("diff"),
          path: z.string(),
          template: z.string(),
          when: z.array(guardSchema).optional(),
        }),
        z.object({
          kind: z.literal("cmd"),
          cmd: z.string(),
          cwd: z.string().optional(),
          when: z.array(guardSchema).optional(),
        }),
      ])
    ),
    tests: z
      .array(
        z.object({
          framework: z.enum(["pytest", "vitest", "npm", "custom"]),
          args: z.array(z.string()),
        })
      )
      .optional(),
  }),
});

export type Guard = z.infer<typeof guardSchema>;
export type Runbook = z.infer<typeof runbookSchema>;
