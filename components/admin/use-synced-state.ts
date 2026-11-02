"use client";

import { useState } from "react";

/**
 * Local (optimistic) copy of server data that resets whenever the server sends
 * a new value — React's "adjust state when a prop changes" pattern, no effect.
 */
export function useSyncedState<T>(value: T) {
  const [source, setSource] = useState(value);
  const [state, setState] = useState(value);
  if (source !== value) {
    setSource(value);
    setState(value);
  }
  return [state, setState] as const;
}
