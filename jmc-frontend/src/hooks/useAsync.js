import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async fn on mount / when deps change. Ignores stale responses.
 * `reload()` shows the loader; `reload(true)` refreshes silently (used for background polling).
 */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const run = useRef(0);

  const execute = useCallback((silent) => {
    const quiet = silent === true; // reload is also used as a click handler, which passes an event
    const id = ++run.current;
    if (!quiet) setState((s) => ({ ...s, loading: true, error: "" }));
    fn()
      .then((res) => id === run.current && setState({ data: res, loading: false, error: "" }))
      .catch((e) => {
        if (id !== run.current || quiet) return; // a failed background refresh keeps the data on screen
        setState({ data: null, loading: false, error: e.message });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, reload: execute };
}
