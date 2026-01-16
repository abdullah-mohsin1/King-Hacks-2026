import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db';
import { AppError } from '../utils/errors';

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


export async function publicRoutes(fastify: FastifyInstance) {
  // GET /api/public/:courseCode/lecture/:lectureNumber/notes?type=short|detailed
  fastify.get(
    '/:courseCode/lecture/:lectureNumber/notes',
    {
      schema: {
        tags: ['Public'],
        summary: 'Get public notes for a lecture',
        description: 'Fetches generated notes by course code + lecture number (public share endpoint).',
        params: {
          type: 'object',
          required: ['courseCode', 'lectureNumber'],
          properties: {
            courseCode: { type: 'string' },
            lectureNumber: { type: 'string' },
          },
          additionalProperties: false,
        },
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['short', 'detailed'] },
          },
          additionalProperties: false,
        },
        response: {
          200: { type: 'string' },
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { courseCode: string; lectureNumber: string };
        Querystring: { type?: 'short' | 'detailed' };
      }>,
      reply: FastifyReply
    ) => {
      const { courseCode, lectureNumber } = request.params;
      const noteType = request.query.type || 'short';

      const course = await prisma.course.findUnique({
        where: { code: courseCode },
      });

      if (!course) {
        throw new AppError(404, `Course "${courseCode}" not found`, 'COURSE_NOT_FOUND');
      }

      const lecture = await prisma.lecture.findFirst({
        where: {
          courseId: course.id,
          lectureNumber: Number(lectureNumber),
        },
      });

      if (!lecture) {
        throw new AppError(
          404,
          `Lecture "${lectureNumber}" not found for course "${courseCode}"`,
          'LECTURE_NOT_FOUND'
        );
      }

      // Notes endpoint in your project likely stores the notes path on the lecture record or outputs table.
      // If your schema differs, keep your existing retrieval logic here.
      // This default implementation expects your outputs route/service to store notes content in DB or filesystem.
      // We'll try the outputs table first if it exists in your Prisma schema.

      // If you already have a shared service function for fetching notes, use it instead.
      // For now, call your existing outputs route logic indirectly is not possible here,
      // so keep the simplest behavior: reuse lectureId and fetch from outputs table if present.

      // @ts-ignore - depending on your Prisma schema, "output" model name may differ
      const output = await (prisma as any).output?.findFirst?.({
        where: { lectureId: lecture.id, type: `notes_${noteType}` },
        orderBy: { createdAt: 'desc' },
      });

      if (output?.content) {
        reply.header('content-type', 'text/markdown; charset=utf-8');
        return reply.send(output.content);
      }

      // If not found in DB, you probably store notes on disk.
      // In that case, your existing code should already know the path — keep your original file read logic here.
      throw new AppError(404, 'Notes not found for this lecture', 'NOTES_NOT_FOUND');
    }
  );
}
