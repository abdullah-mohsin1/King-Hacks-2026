import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db';
import { AppError } from '../utils/errors';
import { jobRunner } from '../services/jobs';

const processRequestSchema = z.object({
  generate: z.object({
    notesShort: z.boolean().default(true),
    notesDetailed: z.boolean().default(true),
    flashcards: z.boolean().default(false),
    quiz: z.boolean().default(false),
    podcastScript: z.boolean().default(true),
  }),
  prefs: z
    .object({
      tone: z.enum(['friendly tutor', 'formal', 'exam mode']).optional(),
      difficulty: z.enum(['intro', 'intermediate', 'advanced']).optional(),
      lengthMinutes: z.number().int().positive().optional(),
      focusTopics: z.array(z.string()).optional(),
    })
    .optional(),
  tts: z.object({
    enabled: z.boolean().default(true),
    voiceId: z.string().nullable().optional(),
    twoVoice: z.boolean().default(false),
  }),
});

export async function processingRoutes(fastify: FastifyInstance) {
  // POST /api/lectures/:lectureId/process
  fastify.post(
    '/:lectureId/process',
    async (
      request: FastifyRequest<{ Params: { lectureId: string } }>,
      reply: FastifyReply
    ) => {
      const lectureId = parseInt(request.params.lectureId, 10);

      if (isNaN(lectureId)) {
        throw new AppError(400, 'Invalid lecture ID', 'INVALID_LECTURE_ID');
      }

      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        include: { course: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      // Validate status allows processing
      if (lecture.status === 'transcribing' || lecture.status === 'generating') {
        throw new AppError(
          409,
          `Lecture is already being processed (status: ${lecture.status})`,
          'ALREADY_PROCESSING'
        );
      }

      if (lecture.status === 'complete') {
        throw new AppError(
          409,
          'Lecture processing is already complete',
          'ALREADY_COMPLETE'
        );
      }

      const body = processRequestSchema.parse(request.body);

      // Enqueue job
      jobRunner.enqueue({
        lectureId,
        courseCode: lecture.course.code,
        audioPath: lecture.audioPath,
        generateOptions: {
          notesShort: body.generate.notesShort,
          notesDetailed: body.generate.notesDetailed,
          flashcards: body.generate.flashcards,
          quiz: body.generate.quiz,
          podcastScript: body.generate.podcastScript,
          prefs: body.prefs,
        },
        ttsOptions: {
          enabled: body.tts.enabled,
          voiceId: body.tts.voiceId || undefined,
          twoVoice: body.tts.twoVoice,
        },
      });

      return reply.send({
        lectureId,
        status: 'transcribing',
        jobStarted: true,
        message: 'Processing job enqueued',
      });
    }
  );

  // GET /api/lectures/:lectureId/status
  fastify.get(
    '/:lectureId/status',
    async (
      request: FastifyRequest<{ Params: { lectureId: string } }>,
      reply: FastifyReply
    ) => {
      const lectureId = parseInt(request.params.lectureId, 10);

      if (isNaN(lectureId)) {
        throw new AppError(400, 'Invalid lecture ID', 'INVALID_LECTURE_ID');
      }

      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: {
          status: true,
          errorMessage: true,
          updatedAt: true,
        },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      return reply.send({
        status: lecture.status,
        errorMessage: lecture.errorMessage,
        updatedAt: lecture.updatedAt,
      });
    }
  );
}

