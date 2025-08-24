import { Rnd } from "react-rnd";

export default function Window({ win, onClose, onToggleMin, onToggleMax, onUpdate, children }) {
  if (win.minimized) return null;
  const size = win.maximized ? { width: "100%", height: "100%" } : { width: win.w, height: win.h };
  const position = win.maximized ? { x: 0, y: 0 } : { x: win.x, y: win.y };

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => onUpdate({ x: d.x, y: d.y })}
      onResizeStop={(e, dir, ref, delta, pos) =>
        onUpdate({ w: ref.offsetWidth, h: ref.offsetHeight, x: pos.x, y: pos.y })
      }
      enableResizing={!win.maximized}
      dragHandleClassName="title-bar"
      bounds="parent"
    >
      <div className="flex flex-col h-full bg-white shadow-lg">
        <div className="title-bar flex items-center justify-between bg-gray-800 text-white px-2 py-1 cursor-move select-none">
          <div className="flex items-center gap-2">
            <span className="text-green-400">●</span>
            <span>{win.title}</span>
          </div>
          <div className="space-x-1">
            <button onClick={onToggleMin} className="px-1">▁</button>
            <button onClick={onToggleMax} className="px-1">▢</button>
            <button onClick={onClose} className="px-1">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </Rnd>
  );
}

