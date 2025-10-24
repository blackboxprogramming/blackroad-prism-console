import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers/simulation';

const typeDefs = /* GraphQL */ `
  scalar JSON

  type LockedBreakdown {
    team: Float!
    treasury: Float!
    community: Float!
  }

  type LedgerPoint {
    monthIndex: Int!
    date: String!
    totalSupply: Float!
    circulating: Float!
    locked: LockedBreakdown!
    inflation: Float!
    minted: Float!
    burned: Float!
    unlocked: LockedBreakdown!
  }

  type Artifact {
    kind: String!
    url: String!
    bytes: Int!
    hash: String!
  }

  type Summary {
    finalSupply: Float!
    maxInflation: Float!
    breaches: [String!]!
  }

  type Simulation {
    id: ID!
    modelVersion: String!
    seed: Int!
    scenario: JSON!
    status: String!
    startedAt: String!
    finishedAt: String
    artifacts: [Artifact!]!
    summary: Summary!
    evidenceHash: String
  }

  input ScenarioInput {
    kind: String!
    startDate: String!
    horizonMonths: Int!
    params: JSON!
  }

  type Query {
    simulation(id: ID!): Simulation
  }

  type Mutation {
    simulationCreate(scenario: ScenarioInput!, seed: Int): Simulation!
    simulationRun(id: ID!): Simulation!
  }

  type Subscription {
    simulationEvents(id: ID): Simulation!
  }
`;

export const schema = makeExecutableSchema({ typeDefs, resolvers });
