export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Artifact {
    name: String!
    path: String!
    contentType: String!
  }

  type SBJob {
    id: ID!
    status: String!
    createdAt: String!
    updatedAt: String!
    config: JSON!
    metrics: JSON
    artifacts: [Artifact!]!
    error: String
  }

  type Query {
    sbJob(id: ID!): SBJob
  }

  type Mutation {
    sbRun(
      mu: String!
      nu: String!
      eps: Float!
      iters: Int = 500
      tol: Float = 1e-3
      cost: String = "l2"
    ): SBJob!
    sbFrames(jobId: ID!, t: [Float!]!): [Artifact!]!
  }

  type Subscription {
    sbEvents(jobId: ID): SBJob!
  }
`;
