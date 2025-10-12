import type { Say } from './types.js';
import type { BroadcastMessage } from './types.js';

export type BroadcastFn = (payload: BroadcastMessage) => void;

export function cueAudioFX(word: Say, broadcast: BroadcastFn, activeMs = 220) {
  if (word.overlay === 'harm') {
    broadcast({ type: 'audio', action: 'harm_on', durMs: activeMs });
    broadcast({ type: 'audio', action: 'duck_bed', gainDb: -3, durMs: activeMs });
  }
}
