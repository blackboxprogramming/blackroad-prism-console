export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Artifact {
    name: String!
    path: String!
  }

  type HJBJob {
    id: ID!
    kind: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    config: JSON!
    metrics: JSON
    artifacts: [Artifact!]!
    error: String
  }

  type Query {
    hjbJob(id: ID!): HJBJob
  }

  type Mutation {
    hjbSolvePDE(config: JSON!): HJBJob!
    hjbSolveMDP(config: JSON!): HJBJob!
    hjbRollout(jobId: ID!, start: [Float!]!, steps: Int, dt: Float): Artifact!
  }

  type Subscription {
    hjbEvents(jobId: ID): HJBJob!
  }
`;
