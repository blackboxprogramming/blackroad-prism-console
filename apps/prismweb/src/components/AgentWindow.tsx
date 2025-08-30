import React from 'react';
import Draggable from 'react-draggable';
import { PrismKernel } from '../kernel';

interface Props {
  kernel: PrismKernel;
  name: string;
}

const AgentWindow: React.FC<Props> = ({ kernel, name }) => {
  return (
    <Draggable>
      <div className="absolute bg-gray-800 text-white p-2 w-64 h-40 overflow-auto">
        <div className="font-bold mb-1">{name}</div>
        <pre className="text-xs whitespace-pre-wrap">
          {kernel.cat(`/prism/logs/${name}`)}
        </pre>
      </div>
    </Draggable>
  );
};

export default AgentWindow;
