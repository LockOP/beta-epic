import { useReducer, useCallback } from 'react';
import { setByPath } from '../utils/dot-path';

// ─────────────────────────────────────────────────────────────────────────────
// Page store — React useReducer-based per-component state slice
// ─────────────────────────────────────────────────────────────────────────────

export type PageAction =
  | { type: 'UPDATE'; path?: string; payload: unknown }
  | { type: 'RESET' };

const createPageReducer = <S extends Record<string, unknown>>(initialState: S) =>
  (state: S, action: PageAction): S => {
    switch (action.type) {
      case 'UPDATE': {
        if (!action.path) {
          // Replace entire state
          return action.payload as S;
        }
        // Immutable deep-set
        const next = structuredClone(state) as S;
        setByPath(next, action.path, action.payload);
        return next;
      }
      case 'RESET':
        return structuredClone(initialState) as S;
      default:
        return state;
    }
  };

/**
 * Creates and manages the page-local store.
 * Returns [state, dispatch].
 */
export const usePageStore = <S extends Record<string, unknown>>(
  initialState: S
): [S, (action: PageAction) => void] => {
  const reducer = useCallback(createPageReducer(initialState), []);
  return useReducer(reducer, initialState, s => structuredClone(s) as S);
};
