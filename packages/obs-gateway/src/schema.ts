import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
  GraphQLScalarType,
} from './graphql';

import { EventEnvelope } from '../../obs-mesh/src/envelope';
import { CorrelatedTimeline } from '../../correlation-engine/src';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral: (ast: unknown) => (ast as { value: unknown }).value,
});

const EventType = new GraphQLObjectType<EventEnvelope>({
  name: 'Event',
  fields: {
    ts: { type: new GraphQLNonNull(GraphQLString) },
    source: { type: new GraphQLNonNull(GraphQLString) },
    service: { type: new GraphQLNonNull(GraphQLString) },
    kind: { type: new GraphQLNonNull(GraphQLString) },
    severity: { type: GraphQLString },
    traceId: { type: GraphQLString },
    spanId: { type: GraphQLString },
    releaseId: { type: GraphQLString },
    assetId: { type: GraphQLString },
    simId: { type: GraphQLString },
    attrs: { type: JSONScalar },
    body: { type: JSONScalar },
    schemaVersion: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const EventFilterInput = new GraphQLInputObjectType({
  name: 'EventFilter',
  fields: {
    source: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    service: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    kind: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    releaseId: { type: GraphQLString },
    assetId: { type: GraphQLString },
    simId: { type: GraphQLString },
    traceId: { type: GraphQLString },
    since: { type: GraphQLString },
    until: { type: GraphQLString },
    severity: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
  },
});

const CorrelatedType = new GraphQLObjectType<CorrelatedTimeline>({
  name: 'Correlated',
  fields: {
    key: { type: new GraphQLNonNull(GraphQLString) },
    keyType: { type: new GraphQLNonNull(GraphQLString) },
    timeline: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(EventType))) },
    notes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
  },
});

export function buildGatewaySchema() {
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        correlate: {
          type: new GraphQLNonNull(CorrelatedType),
          args: {
            key: { type: new GraphQLNonNull(GraphQLString) },
            keyType: { type: new GraphQLNonNull(GraphQLString) },
          },
        },
      },
    }),
    subscription: new GraphQLObjectType({
      name: 'Subscription',
      fields: {
        events: {
          type: new GraphQLNonNull(EventType),
          args: {
            filter: { type: EventFilterInput },
          },
        },
      },
    }),
  });
}

