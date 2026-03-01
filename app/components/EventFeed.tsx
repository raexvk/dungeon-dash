import { useState, useEffect, useRef } from 'react';
import type { GameEvent } from '~/game/types';

const FONT = "'Press Start 2P', monospace";

const EVENT_COLORS: Record<string, string> = {
  kill: '#FF4444',
  pvpKill: '#FF4444',
  playerDied: '#FF4444',
  bossKill: '#CC44FF',
  bossPhase: '#CC44FF',
  keyPickup: '#FFD700',
  keyDrop: '#FFD700',
  itemPickup: '#FFD700',
  doorOpen: '#00DDFF',
  playerExit: '#00DDFF',
};

interface FeedItem {
  id: number;
  event: GameEvent;
  createdAt: number;
}

let nextFeedId = 0;

interface EventFeedProps {
  events: GameEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const prevEventsRef = useRef<GameEvent[]>([]);

  // Add new events to the feed
  useEffect(() => {
    const prevLen = prevEventsRef.current.length;
    if (events.length > prevLen) {
      const newEvents = events.slice(prevLen);
      const now = Date.now();
      const newItems = newEvents.map((event) => ({
        id: nextFeedId++,
        event,
        createdAt: now,
      }));
      setItems((prev) => [...prev, ...newItems].slice(-5));
    }
    prevEventsRef.current = events;
  }, [events]);

  // Remove old items after 3 seconds
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setItems((prev) => prev.filter((item) => now - item.createdAt < 3000));
    }, 500);

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        pointerEvents: 'none',
        zIndex: 15,
        maxWidth: 280,
      }}
    >
      {items.map((item) => {
        const age = Date.now() - item.createdAt;
        const opacity = Math.max(0, 1 - age / 3000);
        const color = EVENT_COLORS[item.event.type] || '#E0E0E8';

        return (
          <div
            key={item.id}
            style={{
              fontFamily: FONT,
              fontSize: 8,
              color,
              opacity,
              padding: '4px 8px',
              background: '#0A0A0F88',
              borderLeft: `2px solid ${color}`,
              transition: 'opacity 0.3s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.event.message}
          </div>
        );
      })}
    </div>
  );
}
