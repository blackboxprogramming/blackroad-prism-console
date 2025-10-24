import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema.js';
import { sbResolvers } from './resolvers/sb.js';

export function buildSchema() {
  return makeExecutableSchema({ typeDefs, resolvers: sbResolvers });
}

export async function createServer() {
  const schema = buildSchema();
  const server = new ApolloServer({ schema });
  await server.start();
  return server;
}
