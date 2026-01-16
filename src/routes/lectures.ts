import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../db';
import { AppError } from '../utils/errors';
import { saveAudioFile } from '../services/storage';
import { config } from '../config';

export async function lecturesRoutes(fastify: FastifyInstance) {
  // POST /api/courses/:courseCode/lectures
  fastify.post(
    '/:courseCode/lectures',
    async (
      request: FastifyRequest<{ Params: { courseCode: string } }>,
      reply: FastifyReply
    ) => {
      const { courseCode } = request.params;

      // Check course exists
      const course = await prisma.course.findUnique({
        where: { code: courseCode },
      });

      if (!course) {
        throw new AppError(404, `Course "${courseCode}" not found`, 'COURSE_NOT_FOUND');
      }

      const data = await request.file();
      if (!data) {
        throw new AppError(400, 'No file uploaded', 'MISSING_FILE');
      }

      // Validate file type
      if (!config.allowedMimeTypes.includes(data.mimetype)) {
        throw new AppError(
          400,
          `Invalid file type: ${data.mimetype}. Allowed: ${config.allowedMimeTypes.join(', ')}`,
          'INVALID_FILE_TYPE'
        );
      }

      // Validate file size
      const buffer = await data.toBuffer();
      if (buffer.length > config.maxFileSize) {
        throw new AppError(
          400,
          `File too large: ${buffer.length} bytes. Max: ${config.maxFileSize} bytes`,
          'FILE_TOO_LARGE'
        );
      }

      // Parse form fields
      const lectureNumber = parseInt(data.fields.lectureNumber?.value as string || '0', 10);
      const lectureTitle = data.fields.lectureTitle?.value as string | undefined;

      if (!lectureNumber || lectureNumber < 1) {
        throw new AppError(400, 'lectureNumber must be a positive integer', 'INVALID_LECTURE_NUMBER');
      }

      // Check if lecture number already exists
      const existing = await prisma.lecture.findUnique({
        where: {
          courseId_lectureNumber: {
            courseId: course.id,
            lectureNumber,
          },
        },
      });

      if (existing) {
        throw new AppError(
          409,
          `Lecture ${lectureNumber} already exists for course ${courseCode}`,
          'DUPLICATE_LECTURE'
        );
      }

      // Create lecture record first (we'll update the path after saving the file)
      const lecture = await prisma.lecture.create({
        data: {
          courseId: course.id,
          lectureNumber,
          lectureTitle: lectureTitle?.trim() || null,
          audioFilename: data.filename,
          audioMime: data.mimetype,
          audioPath: '', // Temporary, will update below
          status: 'uploaded',
        },
      });

      // Save audio file with actual lecture ID
      const audioPath = await saveAudioFile(
        courseCode,
        lecture.id,
        data.filename,
        buffer
      );

      // Update lecture with correct audio path
      await prisma.lecture.update({
        where: { id: lecture.id },
        data: { audioPath },
      });

      return reply.status(201).send({
        lectureId: lecture.id,
        courseCode,
        lectureNumber: lecture.lectureNumber,
        lectureTitle: lecture.lectureTitle,
        status: lecture.status,
        createdAt: lecture.createdAt,
      });
    }
  );

  // GET /api/courses/:courseCode/lectures
  fastify.get(
    '/:courseCode/lectures',
    async (
      request: FastifyRequest<{ Params: { courseCode: string } }>,
      reply: FastifyReply
    ) => {
      const { courseCode } = request.params;

      const course = await prisma.course.findUnique({
        where: { code: courseCode },
      });

      if (!course) {
        throw new AppError(404, `Course "${courseCode}" not found`, 'COURSE_NOT_FOUND');
      }

      const lectures = await prisma.lecture.findMany({
        where: { courseId: course.id },
        orderBy: { lectureNumber: 'asc' },
        select: {
          id: true,
          lectureNumber: true,
          lectureTitle: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send(lectures);
    }
  );

  // GET /api/courses/:courseCode/lectures/:lectureNumber
  fastify.get(
    '/:courseCode/lectures/:lectureNumber',
    async (
      request: FastifyRequest<{
        Params: { courseCode: string; lectureNumber: string };
      }>,
      reply: FastifyReply
    ) => {
      const { courseCode, lectureNumber } = request.params;
      const lectureNum = parseInt(lectureNumber, 10);

      if (isNaN(lectureNum)) {
        throw new AppError(400, 'Invalid lecture number', 'INVALID_LECTURE_NUMBER');
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
      });

      if (!lecture) {
        throw new AppError(
          404,
          `Lecture ${lectureNumber} not found for course ${courseCode}`,
          'LECTURE_NOT_FOUND'
        );
      }

      // Build output links
      const outputs: any = {};
      if (lecture.transcriptJsonPath) outputs.transcript = `/api/lectures/${lecture.id}/transcript`;
      if (lecture.notesShortMdPath) outputs.notesShort = `/api/lectures/${lecture.id}/notes?type=short`;
      if (lecture.notesDetailedMdPath) outputs.notesDetailed = `/api/lectures/${lecture.id}/notes?type=detailed`;
      if (lecture.flashcardsJsonPath) outputs.flashcards = `/api/lectures/${lecture.id}/flashcards`;
      if (lecture.quizJsonPath) outputs.quiz = `/api/lectures/${lecture.id}/quiz`;
      if (lecture.podcastScriptPath) outputs.podcastScript = `/api/lectures/${lecture.id}/podcast/script`;
      if (lecture.podcastAudioMp3Path) outputs.podcastAudio = `/api/lectures/${lecture.id}/podcast/audio`;

      return reply.send({
        id: lecture.id,
        courseCode,
        lectureNumber: lecture.lectureNumber,
        lectureTitle: lecture.lectureTitle,
        status: lecture.status,
        errorMessage: lecture.errorMessage,
        outputs,
        createdAt: lecture.createdAt,
        updatedAt: lecture.updatedAt,
      });
    }
  );
}

