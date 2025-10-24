import fs from 'fs';
import path from 'path';
import { TranscriptChunk } from '../src/types';
import { toSrt } from '../src/pipeline/format/srt';

const SAMPLE_CHUNKS: TranscriptChunk[] = [
  {
    start: 0,
    end: 2.5,
    text: 'Hello world this is Road Studio.',
    words: [
      { text: 'hello', start: 0, end: 0.5, confidence: 0.94 },
      { text: 'world', start: 0.5, end: 1, confidence: 0.95 },
      { text: 'this', start: 1, end: 1.5, confidence: 0.91 },
      { text: 'is', start: 1.5, end: 1.9, confidence: 0.93 },
      { text: 'road', start: 1.9, end: 2.2, confidence: 0.92 },
      { text: 'studio', start: 2.2, end: 2.5, confidence: 0.9 }
    ]
  },
  {
    start: 2.5,
    end: 5,
    text: 'Auto captioning ready for launch.',
    words: [
      { text: 'auto', start: 2.5, end: 2.9, confidence: 0.95 },
      { text: 'captioning', start: 2.9, end: 3.6, confidence: 0.93 },
      { text: 'ready', start: 3.6, end: 4, confidence: 0.94 },
      { text: 'for', start: 4, end: 4.3, confidence: 0.92 },
      { text: 'launch', start: 4.3, end: 4.8, confidence: 0.91 }
    ]
  }
];

describe('toSrt', () => {
  it('matches the golden snapshot for the sample audio', () => {
    const actual = toSrt(SAMPLE_CHUNKS);
    const expected = fs.readFileSync(path.join(__dirname, 'snapshots', 'sample_audio.srt.golden'), 'utf8');
    expect(actual).toBe(expected);
  });
});
