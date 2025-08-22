export type Platform = 'web' | 'ios' | 'android' | 'desktop';
export interface ComponentSpec { name: string; tokens: Record<string, string>; }
export interface AdaptedComponent { name: string; tokens: Record<string, string>; platform: Platform; }

export interface PlatformAdapter {
  platform: Platform;
  adapt(spec: ComponentSpec): AdaptedComponent;
  maintainBrandEssence(adapted: AdaptedComponent): boolean;
}

export class UniversalDesignSystem {
  private adapters = new Map<Platform, PlatformAdapter>();
  register(a: PlatformAdapter) { this.adapters.set(a.platform, a); }
  generate(spec: ComponentSpec, platform: Platform) {
    const a = this.adapters.get(platform);
    if (!a) throw new Error(`No adapter for ${platform}`);
    const adapted = a.adapt(spec);
    if (!a.maintainBrandEssence(adapted)) throw new Error('Brand check failed');
    return adapted;
  }
}
