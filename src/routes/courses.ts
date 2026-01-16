import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db';
import { AppError } from '../utils/errors';

const createCourseSchema = z.object({
  code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
});

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

export async function coursesRoutes(fastify: FastifyInstance) {
  // POST /api/courses
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Courses'],
        summary: 'Create a course',
        description: 'Creates a new course by code and title',
        body: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            title: { type: 'string' },
          },
          required: ['code', 'title'],
          additionalProperties: false,
        },
        response: {
          201: {
            description: 'Course created successfully',
            type: 'object',
            properties: {
              id: { type: 'integer' },
              code: { type: 'string' },
              title: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['id', 'code', 'title', 'createdAt'],
            additionalProperties: true,
          },
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createCourseSchema.parse(request.body);

      try {
        const course = await prisma.course.create({
          data: {
            code: body.code.trim(),
            title: body.title.trim(),
          },
        });

        return reply.status(201).send(course);
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new AppError(
            409,
            `Course with code "${body.code}" already exists`,
            'DUPLICATE_COURSE'
          );
        }
        throw error;
      }
    }
  );

  // GET /api/courses
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Courses'],
        summary: 'List all courses',
        description: 'Returns a list of all courses with lecture counts',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                code: { type: 'string' },
                title: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                lectureCount: { type: 'integer' },
              },
              required: ['id', 'code', 'title', 'createdAt', 'lectureCount'],
              additionalProperties: true,
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { lectures: true },
          },
        },
      });

      return reply.send(
        courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          createdAt: c.createdAt,
          lectureCount: c._count.lectures,
        }))
      );
    }
  );

  // GET /api/courses/:courseCode
  fastify.get(
    '/:courseCode',
    {
      schema: {
        tags: ['Courses'],
        summary: 'Get course by code',
        description: 'Returns course details including lecture count',
        params: {
          type: 'object',
          required: ['courseCode'],
          properties: {
            courseCode: { type: 'string' },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              code: { type: 'string' },
              title: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              lectureCount: { type: 'integer' },
            },
            required: ['id', 'code', 'title', 'createdAt', 'lectureCount'],
            additionalProperties: true,
          },
          404: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { courseCode: string } }>,
      reply: FastifyReply
    ) => {
      const { courseCode } = request.params;

      const course = await prisma.course.findUnique({
        where: { code: courseCode },
        include: {
          _count: {
            select: { lectures: true },
          },
        },
      });

      if (!course) {
        throw new AppError(404, `Course "${courseCode}" not found`, 'COURSE_NOT_FOUND');
      }

      return reply.send({
        id: course.id,
        code: course.code,
        title: course.title,
        createdAt: course.createdAt,
        lectureCount: course._count.lectures,
      });
    }
  );
}
