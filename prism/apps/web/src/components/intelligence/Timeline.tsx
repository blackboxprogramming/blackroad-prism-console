import { IntelligenceEvent } from '@prism/core';
import './timeline.css';

type TimelineProps = {
  events: IntelligenceEvent[];
};

type DepthInfo = {
  depth: number;
  rootId: string;
  rootTimestamp: string;
};

function computeDepths(events: IntelligenceEvent[]): Map<string, DepthInfo> {
  const map = new Map(events.map((event) => [event.id, event]));
  const cache = new Map<string, DepthInfo>();

  const walk = (event: IntelligenceEvent): DepthInfo => {
    if (cache.has(event.id)) {
      return cache.get(event.id)!;
    }
    const parentId = event.causal?.parent?.id;
    if (parentId && map.has(parentId)) {
      const parentInfo = walk(map.get(parentId)!);
      const info = {
        depth: parentInfo.depth + 1,
        rootId: parentInfo.rootId,
        rootTimestamp: parentInfo.rootTimestamp,
      } satisfies DepthInfo;
      cache.set(event.id, info);
      return info;
    }
    const info = {
      depth: 0,
      rootId: event.id,
      rootTimestamp: event.timestamp,
    } satisfies DepthInfo;
    cache.set(event.id, info);
    return info;
  };

  for (const event of events) {
    walk(event);
  }
  return cache;
}

function sortEvents(events: IntelligenceEvent[]): IntelligenceEvent[] {
  const depths = computeDepths(events);
  return [...events].sort((a, b) => {
    const infoA = depths.get(a.id)!;
    const infoB = depths.get(b.id)!;
    if (infoA.rootTimestamp !== infoB.rootTimestamp) {
      return infoA.rootTimestamp.localeCompare(infoB.rootTimestamp);
    }
    if (infoA.rootId !== infoB.rootId) {
      return infoA.rootId.localeCompare(infoB.rootId);
    }
    if (infoA.depth !== infoB.depth) {
      return infoA.depth - infoB.depth;
    }
    return a.timestamp.localeCompare(b.timestamp);
  });
}

export default function IntelligenceTimeline({ events }: TimelineProps) {
  const sorted = sortEvents(events);
  return (
    <div className="intel-timeline">
      {sorted.map((event) => {
        const depth = event.causal?.chain?.length ?? 0;
        const parent = event.causal?.parent?.id;
        return (
          <div key={event.id} className="intel-event" style={{ marginLeft: depth * 12 }}>
            <div className="intel-event__header">
              <span className="intel-event__topic">{event.topic}</span>
              <span className="intel-event__timestamp">{event.timestamp}</span>
            </div>
            <div className="intel-event__meta">
              <span className="intel-event__source">{event.source}</span>
              <span className="intel-event__channel">{event.channel}</span>
              {parent ? <span className="intel-event__parent">parent: {parent}</span> : null}
            </div>
            <pre className="intel-event__payload">{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        );
      })}
    </div>
  );
}
