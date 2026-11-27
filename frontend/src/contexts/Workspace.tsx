import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { api, err } from '../services/api'
import type { Workspace, Preferences } from '../types'
import { Loading, Notice, Button } from '../components/ui/base'
import { Mark } from '../components/Brand'
type Store = {
  data: Workspace
  refresh: () => Promise<void>
  savePrefs: (p: Preferences) => Promise<void>
  notify: (s: string) => void
}
const C = createContext<Store | null>(null)
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, set] = useState<Workspace | null>(null),
    [error, setError] = useState(''),
    [toast, setToast] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const refresh = useCallback(async () => {
    const x = await api<Workspace>('/workspace')
    set(x)
    setError('')
  }, [])
  const load = () => {
    setError('')
    refresh().catch((e) => setError(err(e)))
  }
  useEffect(() => {
    load()
  }, [refresh])
  useEffect(() => {
    if (!data) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      (document.documentElement.dataset.theme =
        data.preferences.theme === 'system'
          ? mq.matches
            ? 'dark'
            : 'light'
          : data.preferences.theme)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [data?.preferences.theme])
  const notify = useCallback((s: string) => {
    clearTimeout(timer.current)
    setToast(s)
    timer.current = setTimeout(() => setToast(''), 3200)
  }, [])
  if (!data)
    return (
      <div className="startup desktop-stage">
        <section className="startup-card">
          <div className="startup-brand">
            <Mark size={34} />
            <h1>Atlas</h1>
          </div>
          {error ? (
            <>
              <Notice>{error}</Notice>
              <Button onClick={load}>Try again</Button>
            </>
          ) : (
            <Loading />
          )}
        </section>
      </div>
    )
  return (
    <C.Provider
      value={{
        data,
        refresh,
        notify,
        savePrefs: async (p) => {
          await api('/settings', 'PUT', p)
          await refresh()
        },
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </C.Provider>
  )
}
export function useWorkspace() {
  const x = useContext(C)
  if (!x) throw Error('Workspace is not available.')
  return x
}
