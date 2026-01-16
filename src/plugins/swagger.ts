import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

export async function registerSwagger(fastify: FastifyInstance) {
  // OpenAPI base info
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Lecture Library API',
        description:
          'Backend service for uploading lectures, generating transcripts/notes, and serving public class notes.',
        version: '1.0.0',
      },
      tags: [
        { name: 'Health', description: 'Health checks' },
        { name: 'Courses', description: 'Course management' },
        { name: 'Lectures', description: 'Lecture upload + listing' },
        { name: 'Processing', description: 'Background processing pipeline' },
        { name: 'Outputs', description: 'Generated outputs (transcripts, notes, etc.)' },
        { name: 'Public', description: 'Public endpoints for sharing notes' },
      ],
    },
  });

  // Swagger UI
  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
