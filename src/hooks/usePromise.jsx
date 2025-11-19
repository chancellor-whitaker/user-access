import { useCallback, useEffect, useState } from "react";

export default function usePromise(promiseFactory) {
  const [state, setState] = useState(null);

  const run = useCallback(() => {
    const promise = promiseFactory?.();
    if (!promise) return;

    let ignore = false;
    promise.then((response) => !ignore && setState(response));

    return () => {
      ignore = true;
    };
  }, [promiseFactory]);

  useEffect(() => {
    run();
  }, [run]);

  return [state, run];
}
