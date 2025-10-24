import { buildSchema, GraphQLSchema } from 'graphql';
import { typeDefs } from './schema.js';
import { createResolvers } from './resolvers/index.js';
import { GatewayContext, HjbJob, HjbJobStore } from './resolvers/types.js';

export { GatewayContext, HjbJob } from './resolvers/types.js';

export function createJobStore(): HjbJobStore {
  return new HjbJobStore();
}

export function createGateway() {
  const schema: GraphQLSchema = buildSchema(typeDefs);
  const store = new HjbJobStore();
  const rootValue = createResolvers(store);
  return { schema, rootValue, store };
}
