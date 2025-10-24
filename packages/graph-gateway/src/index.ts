import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { spectralJob, spectralRun } from './resolvers/spectral';
import { powerLloydJob, powerLloydRun } from './resolvers/powerlloyd';
import { cahnJob, cahnRun } from './resolvers/cahn';
import { bridgeLayoutToPhase, bridgeSpectralToDensity } from './resolvers/bridges';
import { ricciJob, ricciLayout, ricciRun, ricciStep, ricciEvents } from './resolvers/ricci';

export function createGraphGatewaySchema() {
  return makeExecutableSchema({
    typeDefs,
    resolvers: {
      Query: {
        spectralJob,
        powerLloydJob,
        ricciJob,
        cahnJob
      },
      Mutation: {
        spectralRun,
        powerLloydRun,
        ricciRun,
        ricciLayout,
        ricciStep,
        cahnRun,
        bridgeSpectralToDensity,
        bridgeLayoutToPhase
      },
      Subscription: {
        ricciEvents
      }
    }
  });
}
