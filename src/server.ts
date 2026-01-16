import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { config } from './config';
import { errorHandler, AppError } from './utils/errors';
import { coursesRoutes } from './routes/courses';
import { lecturesRoutes } from './routes/lectures';
import { processingRoutes } from './routes/processing';
import { outputsRoutes } from './routes/outputs';
import { publicRoutes } from './routes/public';
import fs from 'fs/promises';
import path from 'path';
import { storagePaths } from './config';

async function ensureDirectories() {
  // Ensure data directory exists
  const dataDir = path.dirname(config.databaseUrl.replace('file:', ''));
  await fs.mkdir(dataDir, { recursive: true });

  // Ensure storage directories exist
  await fs.mkdir(storagePaths.audio, { recursive: true });
  await fs.mkdir(storagePaths.outputs, { recursive: true });
}

async function build() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: config.maxFileSize,
    },
  });

  // Error handler
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  await fastify.register(coursesRoutes, { prefix: '/api/courses' });
  await fastify.register(lecturesRoutes, { prefix: '/api/courses' });
  await fastify.register(processingRoutes, { prefix: '/api/lectures' });
  await fastify.register(outputsRoutes, { prefix: '/api/lectures' });
  await fastify.register(publicRoutes, { prefix: '/api/public' });

  return fastify;
}

async function start() {
  try {
    // Ensure directories exist
    await ensureDirectories();

    const fastify = await build();

    // Start server
    const address = await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server listening on ${address}`);
    console.log(`📚 API docs available at ${address}/docs`);
    console.log(`💾 Database: ${config.databaseUrl}`);
    console.log(`📁 Storage: ${config.storageRoot}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

start();

