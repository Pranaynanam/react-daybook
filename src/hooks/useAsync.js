import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async loader whenever `deps` change. Keeps showing the previous data
// while reloading, and gives back reload() to refresh after a change.
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true })
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let alive = true
    loaderRef.current()
      .then((data) => { if (alive) setState({ data, loading: false }) })
      .catch((error) => { console.error(error); if (alive) setState((s) => ({ data: s.data, loading: false, error })) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data: state.data, loading: state.loading, reload }
}
