export const typeDefs = /* GraphQL */ `
  type Service {
    id: ID!
    name: String!
    repo: String
    adapters: ServiceAdapters!
    environments: [Environment!]!
  }

  type ServiceAdapters {
    deployments: [String!]!
  }

  type Environment {
    id: ID!
    name: String!
    region: String
    cluster: String
    policyRefs: [String!]
  }

  type Release {
    id: ID!
    serviceId: ID!
    sha: String!
    version: String
    envId: ID!
    status: String!
  }

  type WorkflowRunLog {
    ts: String!
    level: String!
    message: String!
    meta: JSON
  }

  type WorkflowRun {
    id: ID!
    kind: String!
    actor: String!
    startedAt: String!
    finishedAt: String
    logs: [WorkflowRunLog!]!
  }

  scalar JSON

  type Incident {
    id: ID!
    serviceId: ID!
    severity: String!
    startedAt: String!
    status: String!
    link: String
  }

  type AuditEvent {
    ts: String!
    actor: String!
    action: String!
    subjectType: String!
    subjectId: String!
    metadata: JSON!
  }

  type DeployMutationResult {
    release: Release!
    audit: AuditEvent!
  }

  type Query {
    service(id: ID!): Service
    releases(serviceId: ID!, envId: ID): [Release!]!
    incidents(serviceId: ID!, limit: Int = 20): [Incident!]!
    auditTail(serviceId: ID, limit: Int = 20): [AuditEvent!]!
  }

  type Mutation {
    deployCreate(serviceId: ID!, envId: ID!, sha: String!, version: String): DeployMutationResult!
    deployPromote(releaseId: ID!, toEnvId: ID!): DeployMutationResult!
  }

  type Subscription {
    auditEvents(serviceId: ID): AuditEvent!
  }
`;
