import { config } from '../config';
import { saveJsonFile, saveTextFile } from './storage';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  language: string;
  segments: TranscriptSegment[];
}

export interface STTProvider {
  transcribe(audioPath: string): Promise<Transcript>;
}

/**
 * Stub STT provider - generates a placeholder transcript
 */
class StubSTTProvider implements STTProvider {
  async transcribe(audioPath: string): Promise<Transcript> {
    // Generate a stub transcript with a clear message
    return {
      language: 'en',
      segments: [
        {
          start: 0.0,
          end: 5.0,
          text: 'STT (Speech-to-Text) is not configured. Please add API keys for a real STT provider.',
        },
        {
          start: 5.0,
          end: 10.0,
          text: 'This is a placeholder transcript. In production, this would contain the actual transcription of the lecture audio.',
        },
        {
          start: 10.0,
          end: 15.0,
          text: 'To enable real transcription, configure your STT provider API keys in the environment variables.',
        },
      ],
    };
  }
}

/**
 * OpenAI Whisper API provider (skeleton - implement if needed)
 */
class OpenAIWhisperProvider implements STTProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioPath: string): Promise<Transcript> {
    // TODO: Implement OpenAI Whisper API integration
    // For now, fallback to stub
    throw new Error('OpenAI Whisper integration not yet implemented. Using stub provider.');
  }
}

/**
 * Get the active STT provider
 */
function getSTTProvider(): STTProvider {
  // Check for configured providers
  if (config.openai.apiKey) {
    // Could use OpenAI Whisper, but for now use stub
    // return new OpenAIWhisperProvider(config.openai.apiKey);
  }

  // Default to stub
  return new StubSTTProvider();
}

/**
 * Transcribe audio file and save results
 */
export async function transcribeAudio(
  courseCode: string,
  lectureId: number,
  audioPath: string
): Promise<{ transcriptJsonPath: string; transcriptTextPath: string }> {
  const provider = getSTTProvider();
  
  try {
    const transcript = await provider.transcribe(audioPath);
    
    // Save JSON transcript
    const transcriptJsonPath = await saveJsonFile(
      courseCode,
      lectureId,
      'transcript.json',
      transcript
    );
    
    // Save plain text transcript
    const transcriptText = transcript.segments
      .map((seg) => seg.text)
      .join(' ');
    
    const transcriptTextPath = await saveTextFile(
      courseCode,
      lectureId,
      'transcript.txt',
      transcriptText
    );
    
    return { transcriptJsonPath, transcriptTextPath };
  } catch (error) {
    throw new Error(`STT transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

