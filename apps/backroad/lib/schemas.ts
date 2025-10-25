import { z } from 'zod';

export const threadSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
});

export const postSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  roomId: z.string().optional(),
  authorId: z.string(),
  createdAt: z.string(),
  visibleAt: z.string(),
  state: z.enum(['queued', 'visible', 'expired']),
  markdown: z.string(),
  editedAt: z.string().optional(),
  flags: z
    .object({
      spamSuspected: z.boolean().optional(),
      abuseSuspected: z.boolean().optional(),
      piiSuspected: z.boolean().optional(),
    })
    .optional(),
});

export const roomSchema = z.object({
  id: z.string(),
  topic: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  inviteOnly: z.boolean(),
  members: z.array(z.string()),
});

export const profileSchema = z.object({
  id: z.string(),
  handle: z.string(),
  displayName: z.string(),
  bio: z.string().optional(),
  createdAt: z.string(),
});

export const threadsResponseSchema = z.object({
  threads: z.array(threadSchema),
});

export const threadResponseSchema = z.object({
  thread: threadSchema,
  posts: z.array(postSchema),
});

export const roomsResponseSchema = z.object({
  rooms: z.array(roomSchema),
});

export const roomResponseSchema = z.object({
  room: roomSchema,
  posts: z.array(postSchema),
});

export const searchResponseSchema = z.object({
  threads: z.array(threadSchema),
});

export type Thread = z.infer<typeof threadSchema>;
export type Post = z.infer<typeof postSchema>;
export type CampfireRoom = z.infer<typeof roomSchema>;
export type Profile = z.infer<typeof profileSchema>;
