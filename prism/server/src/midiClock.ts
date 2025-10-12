import { performance } from 'node:perf_hooks';

type TempoHandler = (bpm: number) => void;

export async function watchMidiClock(onTempo: TempoHandler): Promise<(() => void) | undefined> {
  const midiModule = await import('midi').catch((err) => {
    console.warn('MIDI clock disabled (module unavailable)', err);
    return null;
  });
  if (!midiModule) return undefined;

  const input = new midiModule.Input();
  const ports = input.getPortCount();
  let opened = false;
  for (let i = 0; i < ports; i += 1) {
    const name = input.getPortName(i);
    if (/clock|midi|mio|scarlett|launch/i.test(name)) {
      input.openPort(i);
      opened = true;
      break;
    }
  }
  if (!opened && ports > 0) {
    input.openPort(0);
    opened = true;
  }
  if (!opened) {
    console.warn('MIDI clock disabled (no ports available)');
    input.closePort();
    return undefined;
  }

  let lastPulse = 0;
  const window: number[] = [];
  input.on('message', (_dt: number, msg: number[]) => {
    if (msg[0] === 248) {
      const now = performance.now();
      if (lastPulse) {
        window.push(now - lastPulse);
        if (window.length > 48) window.shift();
        const avg = window.reduce((acc, val) => acc + val, 0) / window.length;
        const mspq = avg * 24;
        if (mspq > 0) {
          const bpm = 60000 / mspq;
          onTempo(bpm);
        }
      }
      lastPulse = now;
    }
  });

  return () => {
    input.closePort();
  };
}
