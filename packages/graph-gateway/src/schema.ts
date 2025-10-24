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

  type RicciJob {
    id: ID!
    status: String!
    createdAt: String!
    updatedAt: String!
    config: JSON!
    metrics: JSON
    artifacts: [Artifact!]!
    error: String
  }

  input RicciConfig {
    curvature: String!
    tau: Float = 0.05
    iterations: Int = 50
    epsilonW: Float = 1e-6
    targetKappa: Float = 0
    minTau: Float
    sinkhorn: JSON
    layout: String = "mds"
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
    ricciJob(id: ID!): RicciJob
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
    ricciRun(edgeList: String!, cfg: RicciConfig!): RicciJob!
    ricciLayout(jobId: ID!, layout: String = "mds"): RicciJob!
    ricciStep(jobId: ID!, tau: Float): RicciJob!
    bridgeSpectralToDensity(jobId: ID!, scheme: String = "kde"): Artifact!
    bridgeLayoutToPhase(layoutJobId: ID!, alpha: Float = 0.5): CahnJob!
  }

  type Subscription {
    graphEvents(jobId: ID): JSON!
    ricciEvents(jobId: ID): RicciJob!
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
