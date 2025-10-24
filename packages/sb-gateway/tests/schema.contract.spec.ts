import { graphql, GraphQLSchema } from 'graphql';
import { buildSchema } from '../src/index.js';

let schema: GraphQLSchema;

beforeAll(() => {
  schema = buildSchema();
});

describe('Schrödinger Bridge schema', () => {
  it('exposes sbRun mutation with expected arguments', async () => {
    const result = await graphql({
      schema,
      source: /* GraphQL */ `
        {
          __type(name: "Mutation") {
            fields {
              name
              args {
                name
                type {
                  kind
                  name
                }
              }
            }
          }
        }
      `
    });
    if (result.errors) {
      throw result.errors[0];
    }
    const mutation = (result.data as any).__type.fields.find((field: any) => field.name === 'sbRun');
    expect(mutation).toBeDefined();
    const argNames = mutation.args.map((arg: any) => arg.name).sort();
    expect(argNames).toEqual(['cost', 'eps', 'iters', 'mu', 'nu', 'tol']);
  });

  it('provides sbJob query returning SBJob type', async () => {
    const result = await graphql({
      schema,
      source: /* GraphQL */ `
        {
          __type(name: "Query") {
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `
    });
    if (result.errors) {
      throw result.errors[0];
    }
    const field = (result.data as any).__type.fields.find((f: any) => f.name === 'sbJob');
    expect(field.type.name).toBe('SBJob');
  });
});
