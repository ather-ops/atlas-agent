import { useState,useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
Workflow as Flow,
Plus,
ArrowRight,
ArrowUpRight,
Clock3,
Calculator,
Activity,
Play,
Pause,
MousePointer2,
LoaderCircle,
History,
} from 'lucide-react'
import { api,err } from '../services/api'
import { useWorkspace } from '../contexts/Workspace'
import { Button,Modal,Notice,Tag,Loading } from '../components/ui/base'
import type { Workflow } from '../types'
const templates = [
  {
    name: 'Workspace check-in',
    desc: 'Get a safe overview of your Atlas environment.',
    tool: 'system_info',
    icon: Activity,
    tone: 'lilac',
  },
  {
    name: 'Quick calculation',
    desc: 'Calculate the same expression on demand.',
    tool: 'calculator',
    icon: Calculator,
    tone: 'blue',
  },
  {
    name: 'Session timestamp',
    desc: 'Capture the current date and time in UTC.',
    tool: 'datetime',
    icon: Clock3,
    tone: 'peach',
  },
]
export default function Automations() {
  const { refresh, notify } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [flows, setFlows] = useState<Workflow[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [formError, setFormError] = useState(''),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(''),
    [desc, setDesc] = useState(''),
    [tool, setTool] = useState('system_info'),
    [expression, setExpression] = useState(''),
    [filter, setFilter] = useState('All')
  const selected = flows.find((x) => x.id === params.get('workflow'))
  const create = params.has('create')
  async function load() {
    try {
      setFlows(await api<Workflow[]>('/automations'))
      setError('')
    } catch (e) {
      setError(err(e))
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => {
    load()
  }, [])
  useEffect(() => {
    setFormError('')
  }, [params.toString()])
  function begin(t?: (typeof templates)[0]) {
    setName(t?.name || '')
    setDesc(t?.desc || '')
    setTool(t?.tool || 'system_info')
    setExpression(t?.tool === 'calculator' ? '(48 + 12) * 3' : '')
    setParams({ create: '1' })
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const w = await api<Workflow>('/automations', 'POST', {
        name,
        description: desc,
        tool,
        expression,
      })
      setFlows((a) => [w, ...a])
      setParams({ workflow: w.id })
    } catch (e) {
      setFormError(err(e))
    } finally {
      setBusy(false)
    }
  }
  async function action(w: Workflow, run: boolean) {
    setBusy(true)
    setFormError('')
    try {
      const x = await api<Workflow>(
        '/automations/' + w.id + (run ? '/run' : ''),
        run ? 'POST' : 'PATCH',
        run ? undefined : { status: w.status === 'paused' ? 'active' : 'paused' },
      )
      setFlows((f) => f.map((r) => (r.id === x.id ? x : r)))
      await refresh()
      if (run)
        notify(x.runs[0].status === 'complete' ? 'Workflow run completed' : 'Workflow run failed')
    } catch (e) {
      setFormError(err(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-wrap inner-page">
      <div className="eyebrow">
        <Flow size={13} />
        Workflow studio
      </div>
      <div className="page-heading">
        <div>
          <h1>Automations</h1>
          <p>Give repeatable tasks a reliable place to run.</p>
        </div>
        <Button onClick={() => begin()}>
          <Plus size={16} />
          Create automation
        </Button>
      </div>
      <div className="workflow-banner">
        <div>
          <span className="eyebrow">The workflow path</span>
          <h2>From a trigger to a verified result.</h2>
          <p>Manual runs are available now. Scheduled triggers are coming later.</p>
        </div>
        <Flow size={46} strokeWidth={1} />
      </div>
      <div className="section-heading">
        <h2>Your workflows</h2>
        <span className="count-label">{flows.length} total</span>
      </div>
      <div className="tabs auto-tabs">
        {['All', 'Active', 'Paused', 'Failed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'selected' : ''}>
            {f}
          </button>
        ))}
      </div>
      {error && (
        <Notice>
          {error} <button onClick={load}>Retry</button>
        </Notice>
      )}
      {!loaded ? (
        <Loading />
      ) : flows.filter((w) => filter === 'All' || w.status === filter.toLowerCase()).length ? (
        <div className="workflow-list">
          {flows
            .filter((w) => filter === 'All' || w.status === filter.toLowerCase())
            .map((w) => (
              <button
                className="workflow-row"
                key={w.id}
                onClick={() => setParams({ workflow: w.id })}
              >
                <span className="icon-tile lilac">
                  <Flow size={20} />
                </span>
                <span>
                  <strong>{w.name}</strong>
                  <small>{w.description}</small>
                  <small className="workflow-last">
                    Manual ·{' '}
                    {w.runs[0]
                      ? `Last run ${new Date(w.runs[0].created_at).toLocaleString()}`
                      : 'Not run yet'}
                  </small>
                </span>
                <Tag tone={w.status === 'active' ? 'green' : 'neutral'}>{w.status}</Tag>
                <ArrowUpRight size={15} />
              </button>
            ))}
        </div>
      ) : (
        !error && (
          <div className="workflow-empty">
            <span className="empty-icon">
              <Flow size={24} />
            </span>
            <div>
              <h3>
                {!flows.length
                  ? 'Your first workflow starts here'
                  : 'No ' + filter.toLowerCase() + ' workflows'}
              </h3>
              <p>
                {!flows.length
                  ? 'Choose a starter or describe a new manual workflow.'
                  : 'Use a different filter to see other workflows.'}
              </p>
            </div>
          </div>
        )
      )}
      <div className="section-heading">
        <h2>Workflow starters</h2>
        <span className="eyebrow">Manual triggers</span>
      </div>
      <div className="template-grid">
        {templates.map((t) => (
          <button key={t.name} className="template-card" onClick={() => begin(t)}>
            <span className={'icon-tile ' + t.tone}>
              <t.icon size={19} />
            </span>
            <h3>{t.name}</h3>
            <p>{t.desc}</p>
            <span className="card-link">
              Use starter
              <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>
      <Modal
        open={create}
        onClose={() => !busy && setParams({})}
        title="Create automation"
        description="Describe a repeatable task and choose the local tool that will run it."
      >
        <form onSubmit={save} className="form-stack">
          <label className="field">
            Workflow name
            <input
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning workspace check"
            />
          </label>
          <label className="field">
            What should this workflow do?
            <textarea
              required
              maxLength={500}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the task in your own words…"
            />
          </label>
          <label className="field">
            Execution tool
            <select value={tool} onChange={(e) => setTool(e.target.value)}>
              <option value="system_info">Workspace information</option>
              <option value="datetime">Current date and time</option>
              <option value="calculator">Calculator</option>
            </select>
          </label>
          {tool === 'calculator' && (
            <label className="field">
              Expression
              <input
                required
                maxLength={140}
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="(48 + 12) * 3"
              />
            </label>
          )}
          <div className="inline-note">
            <MousePointer2 size={15} />
            Manual trigger · Read-only local execution
          </div>
          {formError && <Notice>{formError}</Notice>}
          <Button disabled={busy || !name.trim() || !desc.trim()}>
            <Plus size={15} />
            Create workflow
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!selected}
        onClose={() => !busy && setParams({})}
        title={selected?.name || 'Workflow'}
        description={selected?.description}
      >
        {selected && (
          <>
            <div className="workflow-detail-meta">
              <Tag tone={selected.status === 'active' ? 'green' : 'neutral'}>{selected.status}</Tag>
              <span>
                <Clock3 size={13} />
                Manual schedule
              </span>
            </div>
            <div className="flow-path">
              Manual trigger
              <ArrowRight size={13} />
              {selected.tool.replace('_', ' ')}
              <ArrowRight size={13} />
              Verify
            </div>
            {selected.arguments.expression && (
              <code className="expression">{selected.arguments.expression}</code>
            )}
            <div className="button-row">
              <Button
                disabled={busy || selected.status === 'paused'}
                onClick={() => action(selected, true)}
              >
                {busy ? <LoaderCircle size={14} className="spin" /> : <Play size={14} />}Run now
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => action(selected, false)}>
                {selected.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}{' '}
                {selected.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            </div>
            {formError && <Notice>{formError}</Notice>}
            <h3 className="sub-heading">
              <History size={15} />
              Execution history
            </h3>
            {selected.runs.length ? (
              <div className="run-history">
                {selected.runs.map((r) => (
                  <div key={r.id}>
                    <div>
                      <Tag tone={r.status === 'complete' ? 'green' : 'neutral'}>{r.status}</Tag>
                      <small>{new Date(r.created_at).toLocaleString()}</small>
                    </div>
                    <p>{r.result.replaceAll('**', '')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No runs yet. Run this workflow to see a verified result.</p>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
