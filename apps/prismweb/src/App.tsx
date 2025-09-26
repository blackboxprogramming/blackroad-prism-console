import React, { useEffect, useState } from 'react';
import Terminal from './components/Terminal';
import AgentWindow from './components/AgentWindow';
import { PrismKernel } from './kernel';

const kernel = new PrismKernel();

const App: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    kernel.init().then(() => setTick(t => t + 1));
    const id = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const agents = kernel.listAgents();

  return (
    <div className="w-full h-full relative">
      <div className="absolute bottom-0 left-0 w-full h-48">
        <Terminal kernel={kernel} onChange={() => setTick(t => t + 1)} />
      </div>
      {agents.map((a, i) => (
        <AgentWindow key={a} kernel={kernel} name={a} />
      ))}
    </div>
  );
};

export default App;
