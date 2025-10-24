import { resolve } from 'path';

function loadModule<T>(modulePath: string): T {
  try {
    // Attempt to load from workspace package export
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(`@blackroad/graph-engines/${modulePath}`) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    const fallback = resolve(__dirname, '../../..', 'graph-engines/dist', modulePath);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(fallback) as T;
  }
}

export const graphEngines = {
  spectral: () => loadModule<typeof import('@blackroad/graph-engines/spectral/embed')>('spectral/embed'),
  artifacts: () => loadModule<typeof import('@blackroad/graph-engines/io/artifacts')>('io/artifacts'),
  powerLloyd: () => loadModule<typeof import('@blackroad/graph-engines/powerlloyd/iterate')>('powerlloyd/iterate'),
  density: () => loadModule<typeof import('@blackroad/graph-engines/powerlloyd/density')>('powerlloyd/density'),
  cahn: () => loadModule<typeof import('@blackroad/graph-engines/cahn-hilliard/semi_implicit')>('cahn-hilliard/semi_implicit'),
  phaseGrid: () => loadModule<typeof import('@blackroad/graph-engines/cahn-hilliard/grid')>('cahn-hilliard/grid'),
  bridges: {
    spectralToDensity: () => loadModule<typeof import('@blackroad/graph-engines/bridges/spectral_to_density')>('bridges/spectral_to_density'),
    layoutToPhase: () => loadModule<typeof import('@blackroad/graph-engines/bridges/layout_to_phase')>('bridges/layout_to_phase')
  }
};
