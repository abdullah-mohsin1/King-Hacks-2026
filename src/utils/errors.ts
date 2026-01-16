import { FastifyReply, FastifyRequest } from 'fastify';

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

export function errorHandler(
  error: Error | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code || 'APP_ERROR',
        message: error.message,
      },
    });
    return;
  }

  // Unknown error
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    },
  });
}

