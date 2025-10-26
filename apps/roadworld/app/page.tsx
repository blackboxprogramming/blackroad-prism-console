import dynamic from 'next/dynamic';
import TopBar from '@/ui/TopBar';
import SceneGraph from '@/ui/SceneGraph';
import Inspector from '@/ui/Inspector';
import MaterialEditor from '@/ui/MaterialEditor';
import StatusBar from '@/ui/StatusBar';
import PrimitivesBar from '@/ui/PrimitivesBar';

const Viewport = dynamic(() => import('@/scene/Viewport'), { ssr: false });

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-white">
      <TopBar />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex w-64 flex-col">
          <PrimitivesBar />
          <SceneGraph />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">
            <Viewport />
          </div>
          <MaterialEditor />
        </div>
        <div className="w-80">
          <Inspector />
        </div>
      </main>
      <StatusBar />
    </div>
  );
}
