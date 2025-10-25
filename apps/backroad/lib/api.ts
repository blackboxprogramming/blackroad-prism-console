import { threadsResponseSchema } from '@/lib/schemas';
import type {
  ThreadResponse,
  ThreadsResponse,
  RoomsResponse,
  RoomResponse,
  SearchResponse,
  Profile,
  Post,
} from '@/lib/types';
import {
  roomsResponseSchema,
  roomResponseSchema,
  threadResponseSchema,
  searchResponseSchema,
  profileSchema,
  postSchema,
} from '@/lib/schemas';

const BASE_URL = process.env.NEXT_PUBLIC_BACKROAD_API_URL ?? process.env.BACKROAD_API_URL ?? '';

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${input}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BACKROAD_API_TOKEN ? { Authorization: `Bearer ${process.env.BACKROAD_API_TOKEN}` } : {}),
      ...init?.headers,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async getThreads(): Promise<ThreadsResponse> {
    const data = await request<ThreadsResponse>('/api/threads');
    return threadsResponseSchema.parse(data);
  },
  async getThread(threadId: string): Promise<ThreadResponse> {
    const data = await request<ThreadResponse>(`/api/threads/${threadId}`);
    return threadResponseSchema.parse(data);
  },
  async getRooms(): Promise<RoomsResponse> {
    const data = await request<RoomsResponse>('/api/rooms');
    return roomsResponseSchema.parse(data);
  },
  async getRoom(roomId: string): Promise<RoomResponse> {
    const data = await request<RoomResponse>(`/api/rooms/${roomId}`);
    return roomResponseSchema.parse(data);
  },
  async getProfile(): Promise<Profile> {
    const data = await request<Profile>('/api/profile/me');
    return profileSchema.parse(data);
  },
  async search(params: { query?: string; tag?: string }): Promise<SearchResponse> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const data = await request<SearchResponse>(`/api/search?${query}`);
    return searchResponseSchema.parse(data);
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    const data = await request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (path.includes('/posts')) {
      return postSchema.parse(data) as unknown as T;
    }
    return data;
  },
  async patchPost(postId: string, body: Partial<Post>): Promise<Post> {
    const data = await request<Post>(`/api/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return postSchema.parse(data);
  },
};
