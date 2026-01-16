import prisma from '../db';
import { transcribeAudio } from './stt';
import { generateOutputs } from './generator';
import { generateTTSAudio } from './tts';
import { GenerationOptions } from './generator';
import { TTSOptions } from './tts';

export type LectureStatus =
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'generating'
  | 'voiced'
  | 'complete'
  | 'failed';

interface ProcessingJob {
  lectureId: number;
  courseCode: string;
  audioPath: string;
  generateOptions: GenerationOptions;
  ttsOptions: TTSOptions;
}

class JobRunner {
  private queue: ProcessingJob[] = [];
  private processing = false;

  /**
   * Enqueue a processing job
   */
  enqueue(job: ProcessingJob): void {
    this.queue.push(job);
    this.processQueue();
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        await this.processJob(job);
      }
    }

    this.processing = false;
  }

  /**
   * Process a single job through the pipeline
   */
  private async processJob(job: ProcessingJob): Promise<void> {
    const { lectureId, courseCode, audioPath, generateOptions, ttsOptions } = job;

    try {
      // Step 1: Transcribe
      await this.updateStatus(lectureId, 'transcribing', null);
      const { transcriptJsonPath, transcriptTextPath } = await transcribeAudio(
        courseCode,
        lectureId,
        audioPath
      );

      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          status: 'transcribed',
          transcriptJsonPath,
          transcriptTextPath,
        },
      });

      // Step 2: Generate outputs
      await this.updateStatus(lectureId, 'generating', null);
      const outputs = await generateOutputs(
        courseCode,
        lectureId,
        transcriptJsonPath,
        generateOptions
      );

      await prisma.lecture.update({
        where: { id: lectureId },
        data: {
          status: 'voiced', // Will update to complete after TTS if enabled
          ...outputs,
        },
      });

      // Step 3: TTS (optional)
      if (generateOptions.podcastScript && ttsOptions.enabled && outputs.podcastScriptPath) {
        try {
          const mp3Path = await generateTTSAudio(
            courseCode,
            lectureId,
            outputs.podcastScriptPath,
            ttsOptions
          );

          if (mp3Path) {
            await prisma.lecture.update({
              where: { id: lectureId },
              data: {
                podcastAudioMp3Path: mp3Path,
                status: 'complete',
              },
            });
          } else {
            // TTS skipped but not failed
            await this.updateStatus(lectureId, 'complete', null);
          }
        } catch (ttsError) {
          // TTS failed but don't fail the whole pipeline
          console.error('TTS generation failed (non-fatal):', ttsError);
          await this.updateStatus(lectureId, 'complete', null);
        }
      } else {
        // No TTS requested or script not generated
        await this.updateStatus(lectureId, 'complete', null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateStatus(lectureId, 'failed', errorMessage);
    }
  }

  /**
   * Update lecture status
   */
  private async updateStatus(
    lectureId: number,
    status: LectureStatus,
    errorMessage: string | null
  ): Promise<void> {
    await prisma.lecture.update({
      where: { id: lectureId },
      data: {
        status,
        errorMessage,
        updatedAt: new Date(),
      },
    });
  }
}

// Singleton instance
export const jobRunner = new JobRunner();

