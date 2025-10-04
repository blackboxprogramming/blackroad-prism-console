import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { createInMemoryDb } from "@blackroad/compliance-db";
import { registerReviewRoutes } from "./routes/reviews.js";

const buildServer = () => {
  const fastify = Fastify({ logger: true });

  fastify.register(swagger, {
    openapi: {
      info: {
        title: "Compliance OS API",
        version: "0.1.0",
      },
    },
  });
  fastify.register(swaggerUi, { routePrefix: "/docs" });

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "development-secret",
  });

  fastify.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  const db = createInMemoryDb();

  registerReviewRoutes(fastify, db);

  fastify.get("/health", async () => ({ status: "ok" }));

  return fastify;
};

export const start = async () => {
  const fastify = buildServer();
  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3333);
  try {
    await fastify.listen({ host, port });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
