import { GraphQLScalarType, Kind } from 'graphql';
import { incidentResolvers } from './incident';
import { releaseResolvers } from './release';
import { serviceResolvers } from './service';
import { GatewayContext } from '../store';

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value;
      case Kind.INT:
        return Number(ast.value);
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.OBJECT: {
        const result: Record<string, unknown> = {};
        for (const field of ast.fields) {
          result[field.name.value] = (jsonScalar.parseLiteral(field.value, null) as unknown) ?? null;
        }
        return result;
      }
      case Kind.LIST:
        return ast.values.map((value) => jsonScalar.parseLiteral(value, null));
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  }
});

export const resolvers = {
  JSON: jsonScalar,
  Query: {
    ...serviceResolvers.Query,
    ...releaseResolvers.Query,
    ...incidentResolvers.Query,
    auditTail: (_parent: unknown, args: { serviceId?: string; limit?: number }, context: GatewayContext) =>
      context.audit.tail(args.limit, { serviceId: args.serviceId })
  },
  Mutation: {
    ...releaseResolvers.Mutation
  },
  Subscription: {
    auditEvents: {
      subscribe: (_parent: unknown, args: { serviceId?: string }, context: GatewayContext) => {
        const iterator = context.audit.iterator({ serviceId: args.serviceId });
        return iterator[Symbol.asyncIterator]();
      }
    }
  },
  Service: {
    ...serviceResolvers.Service
  }
};
