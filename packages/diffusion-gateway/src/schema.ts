export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Artifact {
    kind: String!
    name: String!
    path: String
  }

  type DiffJob {
    id: ID!
    mode: String!
    status: String!
    createdAt: String!
    updatedAt: String!
    config: JSON!
    metrics: JSON
    artifacts: [Artifact!]!
    error: String
  }

  input SDEConfig {
    potential: String
    score: String
    beta: String = "const:0.02"
    steps: Int = 2000
    dt: Float = 0.01
    particles: Int = 20000
    seed: Int = 7
  }

  input FPConfig {
    potential: String
    beta: String = "const:0.02"
    grid: [Int!] = [256, 256]
    dt: Float = 0.005
    steps: Int = 400
    boundary: String = "neumann"
    seed: Int = 7
  }

  type Query {
    diffJob(id: ID!): DiffJob
  }

  type Mutation {
    diffusionRunSDE(cfg: SDEConfig!): DiffJob!
    diffusionRunFP(cfg: FPConfig!): DiffJob!
    diffusionCompare(sdeJob: ID!, fpJob: ID!): DiffJob!
  }

  type Subscription {
    diffEvents(jobId: ID): DiffJob!
  }
`;
