# Minecraft+ Smooth Graphics Implementation Plan

## Overview
This plan outlines how to deliver a Minecraft-style sandbox experience with modern, smooth visuals built in both Unity and Unreal Engine. It focuses on a shared design language, synchronized art direction, and engine-specific pipelines that achieve silky rendering across PC and console targets.

## Visual & Technical Goals
- Preserve block-based gameplay while introducing advanced lighting, materials, and animation polish.
- Target 60 FPS on current consoles and mid-range PCs; allow 120 FPS performance mode on high-end hardware.
- Ensure visual parity between Unity and Unreal builds by standardizing assets, color grading, and post-processing settings.

## Shared Asset Pipeline
1. **Voxel Data Source**: Maintain gameplay data (blocks, biomes, lighting, gameplay flags) in engine-agnostic JSON + binary chunk files.
2. **Procedural Mesh Generation**: Provide a reference C++/Rust library compiled to native plugins for Unity (C# wrapper) and Unreal (module) that converts voxel chunks to mesh surfaces with greedy meshing and ambient occlusion data baked in.
3. **Material Library**:
   - Author high-resolution PBR textures (albedo, normal, roughness, ambient occlusion, height) at 1024² in Substance 3D.
   - Export calibrated texture atlases with consistent texel density; share through Git LFS and asset bundle archives.
   - Define shader parameter JSON schema (`materials/material_set.json`) consumed by both engines to ensure consistent roughness/metallic ranges.
4. **Animation Assets**: Build character rigs in Maya/Blender with root motion; export to FBX with naming conventions mirrored in Unity Mecanim controllers and Unreal Animation Blueprints.

## Unity Implementation Highlights
- **Render Pipeline**: Use the High Definition Render Pipeline (HDRP) for advanced lighting, with a stripped-down profile for mid-spec hardware via Graphics Compositor.
- **Chunk Renderer**: Implement a `ChunkRenderSystem` DOTS job that streams meshes and applies GPU instancing for vegetation and props.
- **Shader Graph**: Create an HDRP Lit Shader Graph (`Assets/Shaders/BlockSurface.shadergraph`) consuming the shared texture atlas with triplanar fallback for non-aligned faces.
- **Volumetric Lighting**: Enable HDRP volumetrics, set froxel resolution dynamically based on performance tier, and bake global illumination with Enlighten Realtime GI probes.
- **Water & Atmospheric Effects**: Use a custom transparent shader with planar reflections for water and HDRP's Physically Based Sky for day/night cycles.
- **Performance Profiling**: Integrate Unity Profiler markers around chunk streaming, and supply frame timing budgets (CPU < 12 ms, GPU < 12 ms at 60 FPS).

### Unity Sample: Chunk Material Binding
```csharp
// Assets/Scripts/Rendering/ChunkMaterialBinder.cs
using UnityEngine;

[ExecuteAlways]
public class ChunkMaterialBinder : MonoBehaviour
{
    [SerializeField] private Material blockMaterial;
    [SerializeField] private Texture2DArray textureArray;

    private static readonly int TextureArrayId = Shader.PropertyToID("_BlockTextureArray");

    private void OnEnable()
    {
        if (blockMaterial != null && textureArray != null)
        {
            blockMaterial.SetTexture(TextureArrayId, textureArray);
        }
    }
}
```

## Unreal Engine Implementation Highlights
- **Render Pipeline**: Base project on Unreal 5.3 with Lumen for global illumination and Nanite for high-detail hero assets (characters remain skeletal meshes).
- **World Partition**: Configure World Partition with streaming grids sized to voxel chunk dimensions to match gameplay streaming in Unity.
- **Material Setup**: Build a Master Material (`/Game/Materials/M_MasterBlock`) using Material Functions to sample the shared atlas, with Virtual Texturing to reduce memory churn.
- **Custom HLSL Nodes**: Inject greedy meshing AO via Custom Expression nodes; align parameter names with Unity Shader Graph properties.
- **Water & Skies**: Utilize UE Water plugin with custom caustics material, and SkyAtmosphere for volumetric atmosphere synced to gameplay time-of-day.
- **Performance Budgeting**: Use Unreal Insights to monitor thread timing, targeting < 8 ms Game Thread, < 4 ms Render Thread for 120 FPS mode on high-end PCs.

### Unreal Sample: Material Function Snippet
```usf
// /Game/Materials/MF_BlockAtlas.usf
float3 SampleBlockAtlas(Texture2D AtlasTex, SamplerState AtlasSampler, float3 uvw)
{
    // uvw.xy = atlas UVs, uvw.z = layer index
    float2 tileUV = uvw.xy * AtlasTileScale;
    float layer = floor(uvw.z + 0.5);
    return AtlasTex.SampleLevel(AtlasSampler, float3(tileUV, layer), 0).rgb;
}
```

## Cross-Engine Feature Parity
| Feature | Unity (HDRP) | Unreal (UE5) |
| --- | --- | --- |
| Global Illumination | Enlighten Realtime GI + Light Probes | Lumen GI + Skylight |
| Ambient Occlusion | SSAO + baked vertex AO | Screen Space AO + bent normal AO |
| Water | Custom HDRP shader + planar reflections | Water Plugin + Screen Space Reflections |
| Atmospheric Scattering | Physically Based Sky | SkyAtmosphere + Volumetric Clouds |
| Post-Processing | HDRP Volume Profiles | Post Process Volumes |

## Tooling & Automation
- Create CI steps to validate asset metadata (`tools/validate_materials.py`) ensuring JSON definitions stay synchronized.
- Use Git submodules for shared code (voxel meshing library) with pre-commit hooks verifying deterministic chunk outputs.
- Automate nightly builds that capture Unity and Unreal frame captures via CLI tools to compare color grading and gamma.

## Milestones
1. **Foundation (Week 1-4)**: Stand up voxel data layer, shared mesh library, baseline scenes in both engines.
2. **Rendering Polish (Week 5-8)**: Implement HDRP/UE5 lighting, finalize shaders, integrate atmospheric systems.
3. **Performance Tuning (Week 9-10)**: Profile streaming, optimize instancing, lock frame rate targets.
4. **Content Pass (Week 11-12)**: Add polished textures, particle systems, and finalize water/sky visuals.
5. **QA & Release (Week 13+)**: Cross-engine regression tests, capture marketing footage, prep store builds.

## Risks & Mitigations
- **Diverging Visual Output**: Mitigate with automated screenshot diffing across engines using RenderDoc + CLI capture scripts.
- **Asset Drift**: Enforce schema validation and asset version locking in CI.
- **Performance Regression**: Integrate GPU/CPU budget checks into nightly builds and track metrics in Grafana dashboards.

## Next Steps
- Allocate dedicated rendering engineers per engine with weekly syncs on shader parity.
- Begin prototyping chunk renderer in Unity to validate HDRP profile and memory footprint.
- Schedule Unreal lighting review once Lumen settings are tuned to match Unity's GI baseline.
