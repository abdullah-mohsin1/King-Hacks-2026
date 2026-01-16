import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db';
import { AppError } from '../utils/errors';
import { readTextFile, fileExists } from '../services/storage';

export async function publicRoutes(fastify: FastifyInstance) {
  // GET /api/public/:courseCode/lecture/:lectureNumber/notes?type=short|detailed
  fastify.get(
    '/:courseCode/lecture/:lectureNumber/notes',
    async (
      request: FastifyRequest<{
        Params: { courseCode: string; lectureNumber: string };
        Querystring: { type?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { courseCode, lectureNumber } = request.params;
      const type = request.query.type || 'short';
      const lectureNum = parseInt(lectureNumber, 10);

      if (isNaN(lectureNum)) {
        throw new AppError(400, 'Invalid lecture number', 'INVALID_LECTURE_NUMBER');
      }

      if (type !== 'short' && type !== 'detailed') {
        throw new AppError(400, 'Type must be "short" or "detailed"', 'INVALID_TYPE');
      }

      const course = await prisma.course.findUnique({
        where: { code: courseCode },
      });

      if (!course) {
        throw new AppError(404, `Course "${courseCode}" not found`, 'COURSE_NOT_FOUND');
      }

      const lecture = await prisma.lecture.findUnique({
        where: {
          courseId_lectureNumber: {
            courseId: course.id,
            lectureNumber: lectureNum,
          },
        },
        select: {
          id: true,
          notesShortMdPath: true,
          notesDetailedMdPath: true,
        },
      });

      if (!lecture) {
        throw new AppError(
          404,
          `Lecture ${lectureNumber} not found for course ${courseCode}`,
          'LECTURE_NOT_FOUND'
        );
      }

      const path = type === 'short' ? lecture.notesShortMdPath : lecture.notesDetailedMdPath;

      if (!path) {
        throw new AppError(
          404,
          `${type} notes not available for this lecture`,
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
}

