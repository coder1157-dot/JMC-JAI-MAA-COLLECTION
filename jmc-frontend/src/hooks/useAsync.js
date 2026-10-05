import { useCallback, useEffect, useRef, useState } from "react";

/** Runs an async fn on mount / when deps change. Ignores stale responses. */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const run = useRef(0);

  const execute = useCallback(() => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn()
      .then((res) => id === run.current && setState({ data: res, loading: false, error: "" }))
      .catch((e) => id === run.current && setState({ data: null, loading: false, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, reload: execute };
}
