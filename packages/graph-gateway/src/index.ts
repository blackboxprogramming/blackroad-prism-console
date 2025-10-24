import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { spectralJob, spectralRun } from './resolvers/spectral';
import { powerLloydJob, powerLloydRun } from './resolvers/powerlloyd';
import { cahnJob, cahnRun } from './resolvers/cahn';
import { bridgeLayoutToPhase, bridgeSpectralToDensity } from './resolvers/bridges';

export function createGraphGatewaySchema() {
  return makeExecutableSchema({
    typeDefs,
    resolvers: {
      Query: {
        spectralJob,
        powerLloydJob,
        cahnJob
      },
      Mutation: {
        spectralRun,
        powerLloydRun,
        cahnRun,
        bridgeSpectralToDensity,
        bridgeLayoutToPhase
      }
    }
  });
}
