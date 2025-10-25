export type UserId = string;
export type ThreadId = string;
export type PostId = string;
export type RoomId = string;

export interface Thread {
  id: ThreadId;
  title: string;
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Post {
  id: PostId;
  threadId?: ThreadId;
  roomId?: RoomId;
  authorId: UserId;
  createdAt: string;
  visibleAt: string;
  state: 'queued' | 'visible' | 'expired';
  markdown: string;
  editedAt?: string;
  flags?: {
    spamSuspected?: boolean;
    abuseSuspected?: boolean;
    piiSuspected?: boolean;
  };
}

export interface CampfireRoom {
  id: RoomId;
  topic: string;
  createdBy: UserId;
  createdAt: string;
  expiresAt: string;
  inviteOnly: boolean;
  members: UserId[];
}

export interface Profile {
  id: UserId;
  handle: string;
  displayName: string;
  bio?: string;
  createdAt: string;
}

export interface ThreadsResponse {
  threads: Thread[];
}

export interface ThreadResponse {
  thread: Thread;
  posts: Post[];
}

export interface RoomsResponse {
  rooms: CampfireRoom[];
}

export interface RoomResponse {
  room: CampfireRoom;
  posts: Post[];
}

export interface SearchResponse {
  threads: Thread[];
}
