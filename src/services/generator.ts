import { config } from '../config';
import { readJsonFile, saveTextFile, saveJsonFile } from './storage';
import { Transcript, TranscriptSegment } from './stt';
import { formatTimeRange } from '../utils/timecodes';

export interface GenerationPrefs {
  tone?: 'friendly tutor' | 'formal' | 'exam mode';
  difficulty?: 'intro' | 'intermediate' | 'advanced';
  lengthMinutes?: number;
  focusTopics?: string[];
}

export interface GenerationOptions {
  notesShort: boolean;
  notesDetailed: boolean;
  flashcards: boolean;
  quiz: boolean;
  podcastScript: boolean;
  prefs?: GenerationPrefs;
}

export interface LLMProvider {
  generateNotes(
    transcript: Transcript,
    options: GenerationOptions
  ): Promise<{
    notesShort?: string;
    notesDetailed?: string;
    flashcards?: any;
    quiz?: any;
    podcastScript?: string;
  }>;
}

/**
 * Stub generator - creates notes from transcript segments
 */
class StubGenerator implements LLMProvider {
  async generateNotes(
    transcript: Transcript,
    options: GenerationOptions
  ): Promise<{
    notesShort?: string;
    notesDetailed?: string;
    flashcards?: any;
    quiz?: any;
    podcastScript?: string;
  }> {
    const result: any = {};

    if (options.notesShort) {
      result.notesShort = this.generateShortNotes(transcript);
    }

    if (options.notesDetailed) {
      result.notesDetailed = this.generateDetailedNotes(transcript, options.prefs);
    }

    if (options.flashcards) {
      result.flashcards = this.generateFlashcards(transcript);
    }

    if (options.quiz) {
      result.quiz = this.generateQuiz(transcript);
    }

    if (options.podcastScript) {
      result.podcastScript = this.generatePodcastScript(transcript, options.prefs);
    }

    return result;
  }

  private generateShortNotes(transcript: Transcript): string {
    const lines: string[] = ['# Lecture Notes\n'];
    
    transcript.segments.forEach((seg, idx) => {
      if (seg.text.trim()) {
        lines.push(`- ${seg.text.trim()} ${formatTimeRange(seg.start, seg.end)}`);
      }
    });

    return lines.join('\n');
  }

  private generateDetailedNotes(transcript: Transcript, prefs?: GenerationPrefs): string {
    const lines: string[] = [
      '# Detailed Lecture Notes\n',
      `*Generated with ${prefs?.tone || 'default'} tone*\n`,
    ];

    // Group segments into sections (every ~10 segments)
    const sectionSize = 10;
    for (let i = 0; i < transcript.segments.length; i += sectionSize) {
      const section = transcript.segments.slice(i, i + sectionSize);
      const startTime = section[0].start;
      const endTime = section[section.length - 1].end;

      lines.push(`\n## Section ${Math.floor(i / sectionSize) + 1} ${formatTimeRange(startTime, endTime)}\n`);
      
      section.forEach((seg) => {
        if (seg.text.trim()) {
          lines.push(`${seg.text.trim()} ${formatTimeRange(seg.start, seg.end)}\n`);
        }
      });
    }

    return lines.join('\n');
  }

  private generateFlashcards(transcript: Transcript): any {
    // Extract key terms and create simple flashcards
    const flashcards: any[] = [];
    const segments = transcript.segments.filter((s) => s.text.trim().length > 20);

    segments.slice(0, 5).forEach((seg, idx) => {
      flashcards.push({
        id: idx + 1,
        front: `Key Point ${idx + 1}`,
        back: seg.text.trim(),
        timestamp: formatTimeRange(seg.start, seg.end),
      });
    });

    return { flashcards, total: flashcards.length };
  }

  private generateQuiz(transcript: Transcript): any {
    const questions: any[] = [];
    const segments = transcript.segments.filter((s) => s.text.trim().length > 30);

    segments.slice(0, 3).forEach((seg, idx) => {
      questions.push({
        id: idx + 1,
        type: 'multiple_choice',
        question: `Based on the lecture content around ${formatTimeRange(seg.start, seg.end)}, what is the main point?`,
        options: [
          seg.text.trim().substring(0, 50) + '...',
          'Option B (placeholder)',
          'Option C (placeholder)',
          'Option D (placeholder)',
        ],
        correct: 0,
        explanation: seg.text.trim(),
      });
    });

    return { questions, total: questions.length };
  }

  private generatePodcastScript(transcript: Transcript, prefs?: GenerationPrefs): string {
    const lines: string[] = [
      '[INTRO MUSIC]',
      '',
      `Welcome to today's lecture recap. This is a ${prefs?.tone || 'friendly'} summary of the key points covered.`,
      '',
      '[MAIN CONTENT]',
      '',
    ];

    // Summarize transcript into podcast-friendly format
    const summary = transcript.segments
      .map((seg) => seg.text.trim())
      .filter((text) => text.length > 0)
      .join(' ')
      .substring(0, 500);

    lines.push(summary);
    lines.push('');
    lines.push('[OUTRO]');
    lines.push('');
    lines.push('That wraps up today\'s recap. Thanks for listening, and see you next time!');
    lines.push('');
    lines.push('[OUTRO MUSIC]');

    return lines.join('\n');
  }
}

/**
 * OpenAI provider (skeleton)
 */
class OpenAIGenerator implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateNotes(
    transcript: Transcript,
    options: GenerationOptions
  ): Promise<{
    notesShort?: string;
    notesDetailed?: string;
    flashcards?: any;
    quiz?: any;
    podcastScript?: string;
  }> {
    // TODO: Implement OpenAI API integration
    // For now, fallback to stub
    const stub = new StubGenerator();
    return stub.generateNotes(transcript, options);
  }
}

/**
 * Get the active generator provider
 */
function getGeneratorProvider(): LLMProvider {
  if (config.openai.apiKey) {
    return new OpenAIGenerator(config.openai.apiKey);
  }

  if (config.anthropic.apiKey) {
    // TODO: Implement Anthropic provider
  }

  return new StubGenerator();
}

/**
 * Generate all requested outputs from transcript
 */
export async function generateOutputs(
  courseCode: string,
  lectureId: number,
  transcriptJsonPath: string,
  options: GenerationOptions
): Promise<{
  notesShortMdPath?: string;
  notesDetailedMdPath?: string;
  flashcardsJsonPath?: string;
  quizJsonPath?: string;
  podcastScriptPath?: string;
}> {
  const transcript: Transcript = await readJsonFile(transcriptJsonPath);
  const provider = getGeneratorProvider();

  const outputs = await provider.generateNotes(transcript, options);
  const result: any = {};

  if (outputs.notesShort) {
    result.notesShortMdPath = await saveTextFile(
      courseCode,
      lectureId,
      'notes_short.md',
      outputs.notesShort
    );
  }

  if (outputs.notesDetailed) {
    result.notesDetailedMdPath = await saveTextFile(
      courseCode,
      lectureId,
      'notes_detailed.md',
      outputs.notesDetailed
    );
  }

  if (outputs.flashcards) {
    result.flashcardsJsonPath = await saveJsonFile(
      courseCode,
      lectureId,
      'flashcards.json',
      outputs.flashcards
    );
  }

  if (outputs.quiz) {
    result.quizJsonPath = await saveJsonFile(
      courseCode,
      lectureId,
      'quiz.json',
      outputs.quiz
    );
  }

  if (outputs.podcastScript) {
    result.podcastScriptPath = await saveTextFile(
      courseCode,
      lectureId,
      'podcast_script.txt',
      outputs.podcastScript
    );
  }

  return result;
}

