import { useState,useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
ArrowUpRight,
Search,
Layers3,
ShieldCheck,
LockKeyhole,
KeyRound,
Clock3,
LoaderCircle,
} from 'lucide-react'
import { useWorkspace } from '../contexts/Workspace'
import { AppLogo } from '../components/Brand'
import { Modal,Button,Notice,Tag } from '../components/ui/base'
import { api,err } from '../services/api'
import type { Connection } from '../types'
export const labels: Record<Connection['status'], string> = {
  coming_soon: 'Coming soon',
  available: 'Available to configure',
  configured: 'Server configured',
  connected: 'Connected',
  error: 'Error',
}
export function ConnectionDialog({ item, close }: { item: Connection | null; close: () => void }) {
  const { refresh } = useWorkspace()
  const [key, setKey] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(false)
  useEffect(() => {
    setKey('')
    setError('')
    setRemove(false)
  }, [item?.id])
  if (!item) return null
  const future = item.status === 'coming_soon'
  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return
    setBusy(true)
    setError('')
    try {
      await api('/integrations/' + item.id, 'PUT', { key })
      setKey('')
      await refresh()
      close()
    } catch (e) {
      setError(err(e))
      void refresh().catch(() => {})
    } finally {
      setBusy(false)
    }
  }
  async function disconnect() {
    if (!item) return
    setBusy(true)
    try {
      await api('/integrations/' + item.id, 'DELETE')
      await refresh()
      close()
    } catch (e) {
      setError(err(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open
      onClose={() => {
        if (!busy) close()
      }}
      title={item.name}
      description={item.description}
    >
      <div className="connection-detail">
        <span className="connection-detail-logo">
          <AppLogo id={item.id} size={38} />
        </span>
        <Tag tone={future ? 'violet' : item.status === 'connected' ? 'green' : 'neutral'}>
          {labels[item.status]}
        </Tag>
      </div>
      <div className="permission-box">
        <ShieldCheck size={17} />
        <div>
          <strong>{future ? 'Planned permission' : 'Permission required'}</strong>
          <p>{item.permission}.</p>
        </div>
      </div>
      {future ? (
        <>
          <div className="roadmap-note">
            <Clock3 size={16} />
            <p>
              This app is on the roadmap. Phases 4–5 are planned; scope and timing are not yet set.
              No account is connected, no permissions are requested, and no data is accessed.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={close}>
            Back to workspace
          </Button>
        </>
      ) : (
        <form onSubmit={save}>
          <label className="field">
            {item.status === 'connected' ? 'Replace API key' : 'Service API key'}
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={512}
              placeholder="Enter a new key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </label>
          <p className="field-hint">
            {item.id === 'tavily'
              ? 'Verification sends one test search and may use a credit.'
              : item.id === 'openweather'
                ? 'Verification requests current conditions for London.'
                : 'Verification requests the Groq model list.'}{' '}
            Keys are encrypted on the server and never returned.
          </p>
          {item.managed && (
            <p className="field-hint">
              An environment key is managed by the server operator. You may save a workspace
              override.
            </p>
          )}
          {error && <Notice>{error}</Notice>}
          <div className="button-row">
            <Button disabled={busy || key.trim().length < 8} type="submit">
              {busy ? <LoaderCircle size={14} className="spin" /> : <KeyRound size={14} />}Verify &
              save
            </Button>
            {(item.status === 'connected' || item.status === 'error') && !item.managed && (
              <Button
                type="button"
                disabled={busy}
                variant="outline"
                onClick={() => (remove ? disconnect() : setRemove(true))}
              >
                {remove ? 'Confirm disconnect' : 'Disconnect'}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  )
}
export default function Integrations() {
  const { data } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(''),
    [filter, setFilter] = useState('All apps')
  const apps = data.integrations.filter((x) => x.id !== 'groq')
  const shown = apps.filter(
    (x) =>
      x.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === 'All apps' ||
        (filter === 'Coming soon' ? x.status === 'coming_soon' : x.status !== 'coming_soon')),
  )
  const select = (id: string) => setParams({ app: id })
  return (
    <div className="page-wrap inner-page">
      <div className="eyebrow">
        <Layers3 size={13} />
        Connection center
      </div>
      <div className="page-heading">
        <div>
          <h1>Integrations</h1>
          <p>A connected workspace, one app at a time.</p>
        </div>
      </div>
      <div className="catalog-toolbar">
        <div className="tabs">
          {['All apps', 'Available', 'Coming soon'].map((f) => (
            <button className={filter === f ? 'selected' : ''} key={f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <div className="filter-input compact">
          <Search size={15} />
          <input
            aria-label="Search apps"
            placeholder="Search apps…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {['available', 'planned'].map((group) => {
        const items = shown.filter((x) =>
          group === 'planned' ? x.status === 'coming_soon' : x.status !== 'coming_soon',
        )
        return (
          items.length > 0 && (
            <section key={group} className="catalog-section">
              <div className="section-heading">
                <h2>{group === 'planned' ? 'On the horizon' : 'Workspace services'}</h2>
                <span className="count-label">
                  {items.length} {items.length === 1 ? 'app' : 'apps'}
                </span>
              </div>
              <div className="connection-grid">
                {items.map((x) => (
                  <button className="connection-card" key={x.id} onClick={() => select(x.id)}>
                    <div className="connection-top">
                      <span className="service-icon">
                        <AppLogo id={x.id} size={28} />
                      </span>
                      <Tag
                        tone={
                          x.status === 'coming_soon'
                            ? 'violet'
                            : x.status === 'connected'
                              ? 'green'
                              : 'neutral'
                        }
                      >
                        {labels[x.status]}
                      </Tag>
                    </div>
                    <h3>{x.name}</h3>
                    <p>{x.description}</p>
                    <span className="card-link">
                      {x.status === 'coming_soon'
                        ? 'View details'
                        : x.status === 'connected'
                          ? 'Manage connection'
                          : 'Configure service'}
                      <ArrowUpRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )
        )
      })}
      {!shown.length && (
        <div className="empty-block">
          <Search />
          <h3>No matching apps</h3>
          <p>Try another name or change the filter.</p>
        </div>
      )}
      <div className="security-footer">
        <LockKeyhole size={14} />
        Connections never require your account password.
      </div>
      <ConnectionDialog
        item={data.integrations.find((x) => x.id === params.get('app')) || null}
        close={() => setParams({})}
      />
    </div>
  )
}
