'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import { useEditorStore } from '@/state/editorStore';
import type { Primitive } from '@/shared/schema';

export type EntityRegistry = Map<string, Object3D>;

const RegistryContext = createContext<React.MutableRefObject<EntityRegistry> | null>(null);

export const useEntityRegistry = () => {
  const ref = useContext(RegistryContext);
  if (!ref) {
    throw new Error('useEntityRegistry must be used within Entities');
  }
  return ref;
};


const EntityNode = ({ entity }: { entity: Primitive }) => {
  const ref = useRef<Object3D>(null!);
  const actions = useEditorStore((state) => state.actions);
  const world = useEditorStore((state) => state.world);
  const registry = useEntityRegistry();
  useEffect(() => {
    if (!ref.current) return;
    registry.current.set(entity.id, ref.current);
    return () => {
      registry.current.delete(entity.id);
    };
  }, [entity.id, registry]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.position.set(...entity.position);
    ref.current.rotation.set(...entity.rotation);
    ref.current.scale.set(...entity.scale);
  }, [entity.position, entity.rotation, entity.scale]);

  if (!entity.visible) return null;

  const material = entity.materialId
    ? world.materials.find((m) => m.id === entity.materialId)
    : undefined;

  const sharedProps = {
    onClick: (event: any) => {
      event.stopPropagation();
      actions.select([entity.id], event.shiftKey);
    },
    onPointerMissed: (event: any) => {
      if (!event.shiftKey) {
        actions.select([]);
      }
    },
  };

  const children = entity.children.map((childId) => (
    <EntityNode key={childId} entity={world.entities[childId]} />
  ));

  switch (entity.kind) {
    case 'cube':
      return (
        <group ref={ref} {...sharedProps}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={material?.color ?? '#ffffff'} />
          </mesh>
          {children}
        </group>
      );
    case 'sphere':
      return (
        <group ref={ref} {...sharedProps}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={material?.color ?? '#ffffff'} />
          </mesh>
          {children}
        </group>
      );
    case 'plane':
      return (
        <group ref={ref} {...sharedProps}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1, 1, 1, 1]} />
            <meshStandardMaterial color={material?.color ?? '#888888'} />
          </mesh>
          {children}
        </group>
      );
    case 'group':
      return (
        <group ref={ref} {...sharedProps}>
          {children}
        </group>
      );
    default:
      return (
        <group ref={ref} {...sharedProps}>
          <mesh castShadow receiveShadow>
            <torusGeometry args={[0.5, 0.15, 16, 32]} />
            <meshStandardMaterial color={material?.color ?? '#66d9ff'} />
          </mesh>
          {children}
        </group>
      );
  }
};

export const Entities = () => {
  const world = useEditorStore((state) => state.world);
  const registry = useRef<EntityRegistry>(new Map());
  const root = world.entities[world.root];
  useThree(({ scene }) => {
    scene.background = new Color(world.settings.background);
  });
  return (
    <RegistryContext.Provider value={registry}>
      {root.children.map((childId) => (
        <EntityNode key={childId} entity={world.entities[childId]} />
      ))}
    </RegistryContext.Provider>
  );
};

export default Entities;
