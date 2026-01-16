import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

type ErrorDetailsItem = {
  path: string;
  message: string;
};

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: ErrorDetailsItem[]
) {
  reply.status(statusCode).send({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

export function errorHandler(
  error: any,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  // AppError (our intentional errors)
  if (error instanceof AppError) {
    return sendError(
      reply,
      error.statusCode,
      error.code || 'APP_ERROR',
      error.message
    );
  }

  // Zod validation errors -> 400
  if (error instanceof ZodError) {
    const details: ErrorDetailsItem[] = error.issues.map((i) => ({
      path: i.path.join('.') || '(root)',
      message: i.message,
    }));
    return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid request', details);
  }

  // Multipart/file size errors (Fastify / fastify-multipart)
  if (error?.code === 'FST_REQ_FILE_TOO_LARGE') {
    return sendError(reply, 400, 'FILE_TOO_LARGE', 'Uploaded file is too large');
  }

  // Fallback
  return sendError(
    reply,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development'
      ? String(error?.message || error)
      : 'Internal server error'
  );
}
