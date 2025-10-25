import { apiClient } from '@/lib/api';
import type { Thread, CampfireRoom } from '@/lib/types';

export async function fetchThread(threadId: string): Promise<Thread | null> {
  try {
    const data = await apiClient.getThread(threadId);
    return data.thread;
  } catch (error) {
    console.error('Failed to fetch thread', error);
    return null;
  }
}

export async function fetchRoom(roomId: string): Promise<CampfireRoom | null> {
  try {
    const data = await apiClient.getRoom(roomId);
    return data.room;
  } catch (error) {
    console.error('Failed to fetch room', error);
    return null;
  }
}
