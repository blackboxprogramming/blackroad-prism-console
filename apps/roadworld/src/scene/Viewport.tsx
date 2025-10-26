'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Entities from './Entities';
import { Gizmo } from './Gizmo';
import { useEditorStore } from '@/state/editorStore';

export const Viewport = () => {
  const environment = useEditorStore((state) => state.world.settings.environment);

  return (
    <div className="relative h-full w-full bg-black/60">
      <Canvas shadows frameloop="demand">
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={50} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 7.5]} intensity={1.2} castShadow />
          <Grid args={[40, 40]} sectionColor="#1f2933" cellColor="#1f2933" />
          <Entities />
          <Gizmo />
          <OrbitControls makeDefault enableDamping />
          {environment !== 'none' && <Environment preset={environment === 'sunset' ? 'sunset' : 'studio'} />}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Viewport;
