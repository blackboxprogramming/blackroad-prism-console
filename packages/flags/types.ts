export type FlagRule = {
  state: 'on' | 'off' | 'conditional';
  percent?: number;
  segments?: string[];
  startAt?: string | null;
  endAt?: string | null;
};

export type FlagsDoc = {
  features: Record<string, FlagRule>;
  segments?: Record<string, string[]>;
  version?: number;
};

export type FlagContext = {
  userId?: string;
  email?: string;
  reqId?: string;
};
