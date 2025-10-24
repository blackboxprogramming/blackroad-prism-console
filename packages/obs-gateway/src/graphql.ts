export interface ExecutionResult<TData = unknown> {
  data?: TData;
  errors?: { message: string }[];
}

type GraphQLFieldConfig = Record<string, unknown>;

interface GraphQLObjectTypeConfig {
  name: string;
  fields: Record<string, GraphQLFieldConfig>;
}

export class GraphQLObjectType<T = unknown> {
  constructor(public readonly config: GraphQLObjectTypeConfig) {}
}

export class GraphQLInputObjectType {
  constructor(public readonly config: GraphQLObjectTypeConfig) {}
}

export class GraphQLScalarType {
  constructor(public readonly config: Record<string, unknown>) {}
}

export class GraphQLList<T = unknown> {
  constructor(public readonly ofType: T) {}
}

export class GraphQLNonNull<T = unknown> {
  constructor(public readonly ofType: T) {}
}

export const GraphQLString = 'String';

type GraphQLSchemaConfig = Record<string, unknown>;

export class GraphQLSchema {
  constructor(public readonly config: GraphQLSchemaConfig) {}
}

interface GraphQLArgs {
  schema: GraphQLSchema;
  source: string;
  variableValues?: Record<string, unknown>;
  rootValue?: Record<string, (args: Record<string, unknown>) => unknown>;
}

export async function graphql({ source, variableValues, rootValue }: GraphQLArgs): Promise<ExecutionResult> {
  if (!rootValue) {
    return { errors: [{ message: 'No rootValue provided' }] };
  }

  if (source.includes('correlate')) {
    try {
      const key = String(variableValues?.key ?? '');
      const keyType = String(variableValues?.keyType ?? '');
      const data = rootValue.correlate?.({ key, keyType });
      return { data: { correlate: data } };
    } catch (error) {
      return { errors: [{ message: (error as Error).message }] };
    }
  }

  return { errors: [{ message: 'Unsupported query' }] };
}
