import { useEffect, useState } from 'react';
import { PrismEvent } from '@prism/core';
import Timeline from '../components/prism/Timeline';
import { connect } from '../clients/sse';

export default function PrismPage() {
  const [events, setEvents] = useState<PrismEvent[]>([]);

  useEffect(() => {
    fetch('/events?projectId=demo&limit=100').then(r => r.json()).then(setEvents);
    const disconnect = connect('demo', 'session1', ev => {
      setEvents(prev => [ev, ...prev].slice(0, 100));
    });
    return disconnect;
  }, []);

  return <Timeline events={events} />;
}
