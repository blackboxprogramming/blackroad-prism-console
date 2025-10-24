import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers/ot';

export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Artifact {
    id: ID!
    kind: String!
    uri: String!
  }

  type OTJob {
    id: ID!
    kind: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    config: JSON!
    cost: Float
    diagnostics: JSON
    artifacts: [Artifact!]!
  }

  type Query {
    otJob(id: ID!): OTJob
  }

  type Mutation {
    otSemiDiscreteSolve(config: JSON!): OTJob!
    otDynamicSolve(config: JSON!): OTJob!
    otInterpolate(jobId: ID!, t: Float!): Artifact!
  }

  type Subscription {
    otEvents(jobId: ID): OTJob!
  }
`;

export const schema = makeExecutableSchema({ typeDefs, resolvers });
