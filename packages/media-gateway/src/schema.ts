export const captionTypeDefs = /* GraphQL */ `
  type CaptionArtifact {
    kind: String!
    url: String!
    bytes: Int!
  }

  type CaptionJob {
    id: ID!
    assetId: ID!
    status: String!
    backend: String!
    createdAt: String!
    updatedAt: String!
    artifacts: [CaptionArtifact!]!
    error: String
  }

  type Mutation {
    captionCreate(assetId: ID!, source: String!, backend: String = "local", lang: String = "en"): CaptionJob!
  }

  type Query {
    captionJob(id: ID!): CaptionJob
  }

  type Subscription {
    captionEvents(assetId: ID): CaptionJob!
  }
`;

export default captionTypeDefs;
