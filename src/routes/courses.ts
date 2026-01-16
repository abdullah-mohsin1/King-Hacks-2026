import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db';
import { AppError } from '../utils/errors';

const createCourseSchema = z.object({
  code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
});

export async function coursesRoutes(fastify: FastifyInstance) {
  // POST /api/courses
  fastify.post(
    '/',
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
          throw new AppError(409, `Course with code "${body.code}" already exists`, 'DUPLICATE_COURSE');
        }
        throw error;
      }
    }
  );

  // GET /api/courses
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
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

