import { GraphQLScalarType, Kind } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { defaultChatStore, type ChatMessage, type CreateMessageInput } from '../chat/store';
import { assertCanPost, assertCanRead, type Principal } from '../auth/rbac';
import { mirrorToSlack } from '../chat/slackBridge';

const pubsub = new PubSub();
const CHAT_TOPIC = 'chat-events';

export const typeDefs = /* GraphQL */ `
  scalar JSON

  type Message {
    id: ID!
    jobId: ID
    author: String!
    role: String!
    ts: String!
    text: String!
    reactions: JSON
    attachments: JSON
    redactions: [String!]!
  }

  type Query {
    chatThread(jobId: ID!): [Message!]!
  }

  input AttachmentInput {
    kind: String!
    url: String!
    bytes: Int
  }

  type Mutation {
    chatPost(jobId: ID!, text: String!, attachments: [AttachmentInput!]): Message!
    chatReact(messageId: ID!, reaction: String!, delta: Int!): Message
  }

  type Subscription {
    chatEvents(jobId: ID): Message!
  }
`;

interface Context {
  principal: Principal | null;
  store?: typeof defaultChatStore;
}

function toMessage(model: ChatMessage) {
  return {
    ...model,
    reactions: model.reactions,
    attachments: model.attachments,
  };
}

export const resolvers = {
  JSON: new GraphQLScalarType({
    name: 'JSON',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.STRING:
          try {
            return JSON.parse(ast.value);
          } catch {
            return ast.value;
          }
        case Kind.INT:
        case Kind.FLOAT:
          return Number(ast.value);
        case Kind.BOOLEAN:
          return ast.value === 'true';
        case Kind.OBJECT:
        case Kind.LIST:
          return null;
        default:
          return null;
      }
    },
  }),
  Query: {
    chatThread: (_: unknown, args: { jobId: string }, ctx: Context) => {
      assertCanRead(ctx.principal);
      const store = ctx.store ?? defaultChatStore;
      return store.getThread(args.jobId).map(toMessage);
    },
  },
  Mutation: {
    chatPost: async (
      _: unknown,
      args: { jobId: string; text: string; attachments?: { kind: string; url: string; bytes?: number }[] },
      ctx: Context,
    ) => {
      assertCanPost(ctx.principal);
      const store = ctx.store ?? defaultChatStore;
      const message = store.post({
        jobId: args.jobId,
        author: ctx.principal?.id ?? 'anonymous',
        role: ctx.principal?.role ?? 'user',
        text: args.text,
        attachments: args.attachments?.map((item) => ({
          kind: item.kind as NonNullable<CreateMessageInput['attachments']>[number]['kind'],
          url: item.url,
          bytes: item.bytes,
        })),
      });
      pubsub.publish(`${CHAT_TOPIC}:${args.jobId ?? '*'}`, { chatEvents: message });
      await mirrorToSlack(message);
      return toMessage(message);
    },
    chatReact: (_: unknown, args: { messageId: string; reaction: string; delta: number }, ctx: Context) => {
      assertCanPost(ctx.principal);
      const store = ctx.store ?? defaultChatStore;
      const updated = store.react(args.messageId, args.reaction, args.delta);
      if (updated) {
        pubsub.publish(`${CHAT_TOPIC}:${updated.jobId ?? '*'}`, { chatEvents: updated });
        return toMessage(updated);
      }
      return null;
    },
  },
  Subscription: {
    chatEvents: {
      subscribe: (_: unknown, args: { jobId?: string }) =>
        pubsub.asyncIterator(`${CHAT_TOPIC}:${args.jobId ?? '*'}`),
    },
  },
};
