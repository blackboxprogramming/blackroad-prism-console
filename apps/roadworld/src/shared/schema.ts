import { z } from 'zod';

export const vec3 = z.tuple([z.number(), z.number(), z.number()]);
export const euler = z.tuple([z.number(), z.number(), z.number()]);
export const color = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);

export const materialSchema = z.object({
  id: z.string(),
  type: z.enum(['standard', 'phong', 'lambert', 'basic']),
  color,
  metalness: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
  opacity: z.number().min(0).max(1).optional(),
  transparent: z.boolean().optional(),
});

export const primitiveSchema = z.object({
  id: z.string(),
  kind: z.enum(['cube', 'sphere', 'plane', 'cylinder', 'cone', 'torus', 'gltf', 'group']),
  name: z.string().default('Entity'),
  position: vec3.default([0, 0, 0]),
  rotation: euler.default([0, 0, 0]),
  scale: vec3.default([1, 1, 1]),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  layer: z.string().default('default'),
  materialId: z.string().optional(),
  asset: z
    .object({
      url: z.string().url(),
      rootNode: z.string().optional(),
    })
    .optional(),
  params: z.record(z.any()).default({}),
  children: z.array(z.string()).default([]),
});

export const worldSchema = z.object({
  version: z.literal('rw-1'),
  meta: z.object({
    name: z.string().default('Untitled World'),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  settings: z.object({
    gridSize: z.number().default(1),
    snapTranslate: z.number().default(0.5),
    snapRotateDeg: z.number().default(15),
    snapScale: z.number().default(0.1),
    unit: z.enum(['m', 'cm']).default('m'),
    background: color.default('#0e1116'),
    environment: z.enum(['none', 'studio', 'sunset']).default('studio'),
  }),
  materials: z.array(materialSchema).default([]),
  root: z.string(),
  entities: z.record(primitiveSchema),
});

export type World = z.infer<typeof worldSchema>;
export type Primitive = z.infer<typeof primitiveSchema>;
export type Material = z.infer<typeof materialSchema>;
