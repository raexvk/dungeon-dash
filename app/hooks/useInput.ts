import { useEffect, useRef, useCallback } from 'react';
import type { InputAction, AbilityType, Direction } from '~/game/types';

interface InputState {
  action: InputAction;
  dir?: { dr: number; dc: number };
  ability?: AbilityType;
}

const KEY_MAP: Record<string, { dr: number; dc: number }> = {
  w: { dr: -1, dc: 0 },
  W: { dr: -1, dc: 0 },
  ArrowUp: { dr: -1, dc: 0 },
  s: { dr: 1, dc: 0 },
  S: { dr: 1, dc: 0 },
  ArrowDown: { dr: 1, dc: 0 },
  a: { dr: 0, dc: -1 },
  A: { dr: 0, dc: -1 },
  ArrowLeft: { dr: 0, dc: -1 },
  d: { dr: 0, dc: 1 },
  D: { dr: 0, dc: 1 },
  ArrowRight: { dr: 0, dc: 1 },
};

export function useInput(
  onInput: (
    action: InputAction,
    dir?: { dr: number; dc: number },
    ability?: AbilityType,
  ) => void,
  enabled: boolean = true,
) {
  const onInputRef = useRef(onInput);
  onInputRef.current = onInput;

  const lastFacingRef = useRef<{ dr: number; dc: number }>({ dr: 1, dc: 0 });
  const lastMoveTimeRef = useRef<number>(0);
  const MOVE_COOLDOWN = 200; // ms between moves

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent arrow keys from scrolling
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        e.preventDefault();
      }

      const dir = KEY_MAP[e.key];
      if (dir) {
        lastFacingRef.current = dir;

        // Throttle movement speed
        const now = performance.now();
        if (now - lastMoveTimeRef.current < MOVE_COOLDOWN) return;
        lastMoveTimeRef.current = now;

        if (e.shiftKey) {
          // Shift+direction = attack in that direction
          onInputRef.current('attack', dir);
        } else {
          onInputRef.current('move', dir);
        }
        return;
      }

      // Space = attack in facing direction
      if (e.key === ' ') {
        e.preventDefault();
        onInputRef.current('attack', lastFacingRef.current);
        return;
      }

      // X = wait
      if (e.key === 'x' || e.key === 'X') {
        onInputRef.current('wait');
        return;
      }

      // Q = fireball ability
      if (e.key === 'q' || e.key === 'Q') {
        onInputRef.current('useAbility', lastFacingRef.current, 'fireball');
        return;
      }

      // E = freeze ability
      if (e.key === 'e' || e.key === 'E') {
        onInputRef.current('useAbility', lastFacingRef.current, 'freeze');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
