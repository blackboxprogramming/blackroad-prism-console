export const typeDefs = `#graphql
  scalar JSON

  type Artifact {
    path: String!
    description: String!
  }

  type SpectralJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
  }

  type PowerLloydJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
  }

  type CahnJob {
    id: ID!
    status: String!
    metrics: JSON
    artifacts: [Artifact!]!
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
