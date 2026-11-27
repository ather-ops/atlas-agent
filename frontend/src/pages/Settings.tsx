import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  UserRound,
  SlidersHorizontal,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Check,
  ArrowUpRight,
  KeyRound,
  LockKeyhole,
  LoaderCircle,
  BrainCircuit,
} from 'lucide-react'
import { useWorkspace } from '../contexts/Workspace'
import { Button, Notice, Tag } from '../components/ui/base'
import { ConnectionDialog, labels } from './Integrations'
import { err } from '../services/api'
import type { Preferences } from '../types'
function Switch({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className={'switch ' + (value ? 'on' : '')}
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onChange}
    >
      <i />
    </button>
  )
}
export default function Settings() {
  const { data, savePrefs, notify } = useWorkspace(),
    nav = useNavigate()
  const location = useLocation()
  const requestedTab = location.state?.tab
  const [form, setForm] = useState(data.preferences),
    [tab, setTab] = useState(requestedTab === 'Agent & model' ? 'Agent & model' : 'General'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [keys, setKeys] = useState(false)
  useEffect(() => {
    if (location.state?.editProfile) setTab('General')
    else if (requestedTab === 'Agent & model') setTab(requestedTab)
  }, [location.key, requestedTab])
  const dirty = JSON.stringify(form) !== JSON.stringify(data.preferences)
  useEffect(() => {
    setForm(data.preferences)
  }, [data.preferences])
  function set<K extends keyof Preferences>(k: K, v: Preferences[K]) {
    setForm((x) => ({ ...x, [k]: v }))
  }
  const groq = data.integrations.find((x) => x.id === 'groq')!
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await savePrefs(form)
      notify('Workspace preferences saved')
    } catch (e) {
      setError(err(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-wrap inner-page settings-page">
      <div className="eyebrow">
        <SlidersHorizontal size={13} />
        Workspace preferences
      </div>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Make Atlas feel at home in your workspace.</p>
        </div>
        <Tag>Atlas v{data.version}</Tag>
      </div>
      <div className="tabs settings-tabs">
        {[
          { n: 'General', i: UserRound },
          { n: 'Agent & model', i: BrainCircuit },
          { n: 'Privacy & security', i: ShieldCheck },
        ].map((t) => (
          <button key={t.n} className={tab === t.n ? 'selected' : ''} onClick={() => setTab(t.n)}>
            <t.i size={14} />
            {t.n}
          </button>
        ))}
      </div>
      <form onSubmit={save}>
        {tab === 'General' && (
          <>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Profile</h2>
                <p>What should Atlas call you? Leave this blank for a greeting without a name.</p>
              </div>
              <label className="field">
                Display name
                <input
                  autoComplete="name"
                  autoFocus={location.state?.editProfile === true}
                  placeholder="Your name (optional)"
                  maxLength={40}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </label>
            </section>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Appearance</h2>
                <p>Choose the palette that works best for you.</p>
              </div>
              <div className="theme-choices">
                {(
                  [
                    { v: 'light', i: Sun },
                    { v: 'dark', i: Moon },
                    { v: 'system', i: Monitor },
                  ] as const
                ).map((t) => (
                  <button
                    type="button"
                    key={t.v}
                    onClick={() => set('theme', t.v)}
                    className={'theme-choice ' + t.v + (t.v === form.theme ? ' chosen' : '')}
                    aria-pressed={t.v === form.theme}
                  >
                    <span className="theme-preview">
                      <i />
                      <b />
                      <em />
                    </span>
                    <span>
                      <t.i size={14} />
                      {t.v}
                      {t.v === form.theme && <Check size={13} />}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {tab === 'Agent & model' && (
          <>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Model provider</h2>
                <p>Use Groq for general AI responses or stay with deterministic local tools.</p>
              </div>
              <div className="form-two">
                <label className="field">
                  Provider
                  <select
                    value={form.provider}
                    onChange={(e) => set('provider', e.target.value as Preferences['provider'])}
                  >
                    <option value="auto">Groq with local fallback</option>
                    <option value="local">Local tools only</option>
                  </select>
                </label>
                <label className="field">
                  Groq model
                  <select value={form.model} onChange={(e) => set('model', e.target.value)}>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 · 70B Versatile</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 · 8B Instant</option>
                  </select>
                </label>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Groq API key</strong>
                  <small>{labels[groq.status]} · Encrypted on the server</small>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={() => setKeys(true)}>
                  <KeyRound size={14} />
                  {groq.status === 'connected' ? 'Manage key' : 'Configure key'}
                </Button>
              </div>
            </section>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Agent behavior</h2>
                <p>Set the level of detail for model-generated responses.</p>
              </div>
              <label className="field">
                Response style
                <select
                  value={form.style}
                  onChange={(e) => set('style', e.target.value as Preferences['style'])}
                >
                  <option value="balanced">Balanced</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
            </section>
          </>
        )}
        {tab === 'Privacy & security' && (
          <>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Conversation context</h2>
                <p>Your saved chat history is separate from long-term memory.</p>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Include recent messages</strong>
                  <small>Send up to 10 recent messages from this chat to Groq.</small>
                </div>
                <Switch
                  label="Include recent messages"
                  value={form.use_context}
                  onChange={() => set('use_context', !form.use_context)}
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>Long-term memory</strong>
                  <small>Atlas does not infer or store cross-chat personal memories.</small>
                </div>
                <Tag>Not enabled</Tag>
              </div>
            </section>
            <section className="settings-card">
              <div className="settings-intro">
                <h2>Permissions</h2>
                <p>You stay in control of external services and changes.</p>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Allow external tools</strong>
                  <small>Permit configured web search and weather lookups.</small>
                </div>
                <Switch
                  label="Allow external tools"
                  value={form.allow_network}
                  onChange={() => set('allow_network', !form.allow_network)}
                />
              </div>
              <div className="setting-row">
                <div>
                  <strong>File creation approval</strong>
                  <small>Review exact filenames and contents before they are written.</small>
                </div>
                <Tag tone="green">Always required</Tag>
              </div>
              <button type="button" className="text-link mt-4" onClick={() => nav('/integrations')}>
                Manage integrations
                <ArrowUpRight size={14} />
              </button>
            </section>
          </>
        )}
        {error && <Notice>{error}</Notice>}
        <div className="settings-save">
          <span>{dirty ? 'You have unsaved changes.' : 'Preferences are up to date.'}</span>
          <Button disabled={!dirty || busy}>
            {busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}Save changes
          </Button>
        </div>
      </form>
      {tab === 'General' && (
        <button
          className="provider-shortcut"
          onClick={() => {
            setTab('Agent & model')
            setKeys(true)
          }}
        >
          <KeyRound size={15} />
          Configure a Groq API key
          <ArrowRightSmall />
        </button>
      )}
      <div className="security-footer">
        <LockKeyhole size={14} />
        Keys are write-only. No credentials are returned to your browser.
      </div>
      <ConnectionDialog item={keys ? groq : null} close={() => setKeys(false)} />
    </div>
  )
}
function ArrowRightSmall() {
  return <ArrowUpRight size={13} />
}
