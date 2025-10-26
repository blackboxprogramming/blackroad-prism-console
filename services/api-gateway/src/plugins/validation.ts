import fp from 'fastify-plugin';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { notFound, problem, replyWithProblem } from '../utils/errors.js';

interface ValidationConfig {
  responseSchema?: {
    parse: (payload: unknown) => unknown;
    safeParse: (payload: unknown) => { success: boolean; data?: unknown; error?: ZodError };
  };
}

declare module 'fastify' {
  interface FastifyContextConfig extends ValidationConfig {}
}

export default fp(async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>();
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return replyWithProblem(
        reply,
        problem({
          type: 'https://blackroad.io/problems/validation-error',
          title: 'Validation failed',
          status: 400,
          detail: error.issues.map((issue) => issue.message).join(', '),
          instance: request.url
        })
      );
    }

    const status = (error as any).statusCode ?? 500;
    const detail = (error as any).detail ?? error.message;
    return replyWithProblem(
      reply,
      problem({
        type: 'about:blank',
        title: error.name || 'Internal Server Error',
        status,
        detail,
        instance: request.url
      })
    );
  });

  fastify.setNotFoundHandler((request, reply) => {
    return replyWithProblem(reply, notFound(request));
  });

  if (env.isDev) {
    fastify.addHook('preSerialization', async (request, reply, payload) => {
      const config = reply.context.config as ValidationConfig;
      if (!config.responseSchema) {
        return payload;
      }

      const result = config.responseSchema.safeParse(payload);
      if (!result.success) {
        const error = new Error('backend schema drift detected');
        (error as any).statusCode = 502;
        (error as any).detail = 'backend schema drift detected';
        throw error;
      }
      return payload;
    });
  }
});
