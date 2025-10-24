import { AudioSegment, TranscriptChunk } from '../types';
import { Transcriber, TranscriberOptions } from './transcriber';

export interface ProviderTranscriberOptions extends TranscriberOptions {
  fetchImpl?: typeof fetch;
  endpoint: string;
  token?: string;
}

export class ProviderTranscriber implements Transcriber {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ProviderTranscriberOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  name(): string {
    return 'provider';
  }

  async transcribe(segment: AudioSegment, options: TranscriberOptions = {}): Promise<TranscriptChunk[]> {
    const response = await this.fetchImpl(this.options.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {})
      },
      body: JSON.stringify({
        segment: {
          id: segment.id,
          start: segment.start,
          end: segment.end,
          uri: segment.sourceUri
        },
        lang: options.lang ?? this.options.lang
      })
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Provider transcription failed: ${response.status} ${payload}`);
    }

    const json = (await response.json()) as { chunks: TranscriptChunk[] };
    return json.chunks;
  }
}

export default ProviderTranscriber;
