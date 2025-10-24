export const typeDefs = `#graphql
  scalar JSON

  type Artifact {
    path: String!
import { makeExecutableSchema } from '@graphql-tools/schema';
import { spectralResolvers } from './resolvers/spectral';
import { powerLloydResolvers } from './resolvers/powerlloyd';
import { cahnResolvers } from './resolvers/cahn';
import { bridgeResolvers } from './resolvers/bridges';

const typeDefs = /* GraphQL */ `
  scalar JSON

  type Artifact {
    id: ID!
    type: String!
    path: String!
    sha256: String!
    description: String!
  }

  type SpectralJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
    embedding: [[Float!]]
    clusters: [Int!]
  }

  type PowerLloydJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
    density: JSON
    movementHistory: [Float!]
  }

  type CahnJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
    frames: JSON
    residuals: [Float!]
  }

  type Query {
    spectralJob(id: ID!): SpectralJob
    powerLloydJob(id: ID!): PowerLloydJob
    cahnJob(id: ID!): CahnJob
  }

  type Mutation {
    spectralRun(edgeList: String!, k: Int = 8, seed: Int = 7): SpectralJob!
    powerLloydRun(
      density: String!,
      n: Int = 2000,
      iters: Int = 200,
      massTol: Float = 0.01,
      seed: Int = 7
    ): PowerLloydJob!
    cahnRun(
      initField: String!,
      eps: Float = 1.2,
      dt: Float = 0.1,
      steps: Int = 400
    ): CahnJob!
    bridgeSpectralToDensity(jobId: ID!, scheme: String = "kde"): Artifact!
    bridgeLayoutToPhase(layoutJobId: ID!, alpha: Float = 0.5): CahnJob!
  }

  type Subscription {
    graphEvents(jobId: ID): JSON!
  }
`;
    powerLloydRun(density: String!, n: Int = 64, iters: Int = 100, massTol: Float = 0.01, seed: Int = 7): PowerLloydJob!
    cahnRun(initField: String!, eps: Float = 1.2, dt: Float = 0.1, steps: Int = 200): CahnJob!
    bridgeSpectralToDensity(jobId: ID!, scheme: String = "kde"): Artifact!
    bridgeLayoutToPhase(layoutJobId: ID!, alpha: Float = 0.5): CahnJob!
  }
`;

const resolvers = {
  Query: {
    ...spectralResolvers.Query,
    ...powerLloydResolvers.Query,
    ...cahnResolvers.Query
  },
  Mutation: {
    ...spectralResolvers.Mutation,
    ...powerLloydResolvers.Mutation,
    ...cahnResolvers.Mutation,
    ...bridgeResolvers.Mutation
  },
  SpectralJob: spectralResolvers.SpectralJob,
  PowerLloydJob: powerLloydResolvers.PowerLloydJob,
  CahnJob: cahnResolvers.CahnJob
};

export function createSchema() {
  return makeExecutableSchema({ typeDefs, resolvers });
}
