import { useEffect, useState } from 'react';
import { PrismEvent, IntelligenceEvent } from '@prism/core';
import Timeline from '../components/prism/Timeline';
import IntelligenceTimeline from '../components/intelligence/Timeline';
import { connect, connectIntelligence } from '../clients/sse';

export default function PrismPage() {
  const [events, setEvents] = useState<PrismEvent[]>([]);
  const [intelEvents, setIntelEvents] = useState<IntelligenceEvent[]>([]);

  useEffect(() => {
    fetch('/events?projectId=demo&limit=100').then(r => r.json()).then(setEvents);
    const disconnect = connect('demo', 'session1', ev => {
      setEvents(prev => [ev, ...prev].slice(0, 100));
    });
    return disconnect;
  }, []);

  useEffect(() => {
    fetch('/intelligence/events?limit=200').then(r => r.json()).then(setIntelEvents);
    const disconnect = connectIntelligence(event => {
      setIntelEvents(prev => [event, ...prev].slice(0, 200));
    });
    return disconnect;
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
      <Timeline events={events} />
      <IntelligenceTimeline events={intelEvents} />
    </div>
  );
}
