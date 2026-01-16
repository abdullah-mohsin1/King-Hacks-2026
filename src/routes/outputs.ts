import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream } from 'fs';
import prisma from '../db';
import { AppError } from '../utils/errors';
import { readTextFile, readJsonFile, fileExists } from '../services/storage';

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


export async function outputsRoutes(fastify: FastifyInstance) {
  // GET /api/lectures/:lectureId/transcript
  fastify.get(
    '/:lectureId/transcript',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get transcript',
        description: 'Returns the JSON transcript with timestamped segments',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              segments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'number' },
                    end: { type: 'number' },
                    text: { type: 'string' },
                    speaker: { type: 'string', nullable: true },
                  },
                },
              },
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
        select: { transcriptJsonPath: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      if (!lecture.transcriptJsonPath) {
        throw new AppError(404, 'Transcript not available', 'TRANSCRIPT_NOT_FOUND');
      }

      if (!(await fileExists(lecture.transcriptJsonPath))) {
        throw new AppError(404, 'Transcript file not found', 'TRANSCRIPT_FILE_NOT_FOUND');
      }

      const transcript = await readJsonFile(lecture.transcriptJsonPath);
      return reply.send(transcript);
    }
  );

  // GET /api/lectures/:lectureId/notes?type=short|detailed
  fastify.get(
    '/:lectureId/notes',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get notes',
        description: 'Returns markdown notes (short or detailed)',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string'},
          },
        },
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['short', 'detailed'], default: 'short' },
          },
        },
        response: {
          200: {
            type: 'string',
            description: 'Markdown notes',
          },
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { lectureId: string };
        Querystring: { type?: string };
      }>,
      reply: FastifyReply
    ) => {
      const lectureId = parseInt(request.params.lectureId, 10);
      const type = request.query.type || 'short';

      if (isNaN(lectureId)) {
        throw new AppError(400, 'Invalid lecture ID', 'INVALID_LECTURE_ID');
      }

      if (type !== 'short' && type !== 'detailed') {
        throw new AppError(400, 'Type must be "short" or "detailed"', 'INVALID_TYPE');
      }

      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        select: {
          notesShortMdPath: true,
          notesDetailedMdPath: true,
        },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      const path = type === 'short' ? lecture.notesShortMdPath : lecture.notesDetailedMdPath;

      if (!path) {
        throw new AppError(
          404,
          `${type} notes not available`,
          'NOTES_NOT_FOUND'
        );
      }

      if (!(await fileExists(path))) {
        throw new AppError(404, 'Notes file not found', 'NOTES_FILE_NOT_FOUND');
      }

      const notes = await readTextFile(path);
      reply.type('text/markdown');
      return reply.send(notes);
    }
  );

  // GET /api/lectures/:lectureId/flashcards
  fastify.get(
    '/:lectureId/flashcards',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get flashcards',
        description: 'Returns flashcards in JSON format',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            description: 'Flashcards JSON',
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
        select: { flashcardsJsonPath: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      if (!lecture.flashcardsJsonPath) {
        throw new AppError(404, 'Flashcards not available', 'FLASHCARDS_NOT_FOUND');
      }

      if (!(await fileExists(lecture.flashcardsJsonPath))) {
        throw new AppError(404, 'Flashcards file not found', 'FLASHCARDS_FILE_NOT_FOUND');
      }

      const flashcards = await readJsonFile(lecture.flashcardsJsonPath);
      return reply.send(flashcards);
    }
  );

  // GET /api/lectures/:lectureId/quiz
  fastify.get(
    '/:lectureId/quiz',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get quiz',
        description: 'Returns quiz questions in JSON format',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            description: 'Quiz JSON',
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
        select: { quizJsonPath: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      if (!lecture.quizJsonPath) {
        throw new AppError(404, 'Quiz not available', 'QUIZ_NOT_FOUND');
      }

      if (!(await fileExists(lecture.quizJsonPath))) {
        throw new AppError(404, 'Quiz file not found', 'QUIZ_FILE_NOT_FOUND');
      }

      const quiz = await readJsonFile(lecture.quizJsonPath);
      return reply.send(quiz);
    }
  );

  // GET /api/lectures/:lectureId/podcast/script
  fastify.get(
    '/:lectureId/podcast/script',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get podcast script',
        description: 'Returns the podcast script as plain text',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'string',
            description: 'Podcast script text',
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
        select: { podcastScriptPath: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      if (!lecture.podcastScriptPath) {
        throw new AppError(404, 'Podcast script not available', 'SCRIPT_NOT_FOUND');
      }

      if (!(await fileExists(lecture.podcastScriptPath))) {
        throw new AppError(404, 'Podcast script file not found', 'SCRIPT_FILE_NOT_FOUND');
      }

      const script = await readTextFile(lecture.podcastScriptPath);
      reply.type('text/plain');
      return reply.send(script);
    }
  );

  // GET /api/lectures/:lectureId/podcast/audio
  fastify.get(
    '/:lectureId/podcast/audio',
    {
      schema: {
        tags: ['Outputs'],
        summary: 'Get podcast audio',
        description: 'Returns the podcast audio as MP3 stream',
        params: {
          type: 'object',
          required: ['lectureId'],
          properties: {
            lectureId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'string',
            format: 'binary',
            description: 'MP3 audio file',
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
        select: { podcastAudioMp3Path: true },
      });

      if (!lecture) {
        throw new AppError(404, `Lecture ${lectureId} not found`, 'LECTURE_NOT_FOUND');
      }

      if (!lecture.podcastAudioMp3Path) {
        throw new AppError(404, 'Podcast audio not available', 'AUDIO_NOT_FOUND');
      }

      if (!(await fileExists(lecture.podcastAudioMp3Path))) {
        throw new AppError(404, 'Podcast audio file not found', 'AUDIO_FILE_NOT_FOUND');
      }

      const stream = createReadStream(lecture.podcastAudioMp3Path);
      reply.type('audio/mpeg');
      return reply.send(stream);
    }
  );
}

