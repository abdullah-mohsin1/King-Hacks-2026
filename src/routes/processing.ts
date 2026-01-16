import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db';
import { AppError } from '../utils/errors';
import { jobRunner } from '../services/jobs';

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['path', 'message'],
            additionalProperties: false,
          },
        },
      },
      required: ['code', 'message'],
      additionalProperties: true,
    },
  },
  required: ['error'],
  additionalProperties: false,
} as const;


export async function processingRoutes(fastify: FastifyInstance) {
  // POST /api/lectures/:lectureId/process
  fastify.post(
    '/:lectureId/process',
    {
      schema: {
        tags: ['Processing'],
        summary: 'Start processing a lecture',
        description: 'Starts the processing pipeline: transcribe → generate notes → TTS (optional)',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            generate: {
              type: 'object',
              properties: {
                notesShort: { type: 'boolean', default: true },
                notesDetailed: { type: 'boolean', default: true },
                flashcards: { type: 'boolean', default: false },
                quiz: { type: 'boolean', default: false },
                podcastScript: { type: 'boolean', default: true },
              },
            },
            prefs: {
              type: 'object',
              properties: {
                tone: { type: 'string', enum: ['friendly tutor', 'formal', 'exam mode'] },
                difficulty: { type: 'string', enum: ['intro', 'intermediate', 'advanced'] },
                lengthMinutes: { type: 'integer', minimum: 1 },
                focusTopics: { type: 'array', items: { type: 'string' } },
              },
            },
            tts: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', default: true },
                voiceId: { type: 'string', nullable: true },
                twoVoice: { type: 'boolean', default: false },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              lectureId: { type: 'integer' },
              status: { type: 'string' },
              jobStarted: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
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
    {
      schema: {
        tags: ['Processing'],
        summary: 'Get processing status',
        description: 'Returns the current processing status of a lecture',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string'},
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['uploaded', 'transcribing', 'transcribed', 'generating', 'voiced', 'complete', 'failed'],
              },
              errorMessage: { type: 'string', nullable: true },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
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

