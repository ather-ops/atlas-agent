import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Layers3,
  MessageSquare,
  Settings2,
  Sparkles,
  Terminal,
  Workflow as WorkflowIcon,
} from 'lucide-react'
import { useWorkspace } from '../contexts/Workspace'
import { api, dateLabel, err } from '../services/api'
import type { Preferences, Workflow } from '../types'
import { Button, Modal, Notice, Tag } from './ui/base'

export function AgentPanel({ close }: { close: () => void }) {
  const { data, savePrefs } = useWorkspace()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function choose(provider: Preferences['provider']) {
    setBusy(true)
    try {
      await savePrefs({ ...data.preferences, provider })
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
      onClose={close}
      title="Agent controls"
      description="Choose how Atlas handles requests in this workspace."
    >
      <div className="engine-status">
        <span className="status-dot" />
        <strong>Active engine</strong>
        <span>{data.status.mode === 'local' ? 'Local tools' : data.status.model}</span>
      </div>
      <div className="engine-options">
        {(
          [
            {
              value: 'auto',
              title: 'Atlas Agent',
              detail: 'Use Groq when configured, with built-in tools for local tasks.',
              icon: Sparkles,
            },
            {
              value: 'local',
              title: 'Local tools only',
              detail:
                'Use the clock, calculator, workspace files and restricted Python without a model.',
              icon: Terminal,
            },
          ] as const
        ).map((x) => (
          <button
            key={x.value}
            className={data.preferences.provider === x.value ? 'selected' : ''}
            disabled={busy}
            aria-pressed={data.preferences.provider === x.value}
            onClick={() => choose(x.value)}
          >
            <x.icon size={18} />
            <span>
              <strong>{x.title}</strong>
              <small>{x.detail}</small>
            </span>
            {data.preferences.provider === x.value && <Check size={15} />}
          </button>
        ))}
      </div>
      {error && <Notice>{error}</Notice>}
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          close()
          nav('/settings', { state: { tab: 'Agent & model' } })
        }}
      >
        <Settings2 size={14} />
        Model settings
        <ArrowUpRight size={12} />
      </Button>
    </Modal>
  )
}

export function WorkspacePanel({ close, history }: { close: () => void; history: () => void }) {
  const { data } = useWorkspace(),
    nav = useNavigate()
  const [flows, setFlows] = useState<Workflow[] | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    let live = true
    api<Workflow[]>('/automations')
      .then((x) => {
        if (live) setFlows(x)
      })
      .catch((e) => {
        if (live) setError(err(e))
      })
    return () => {
      live = false
    }
  }, [])
  const latest = flows
    ?.flatMap((f) => f.runs.map((r) => ({ ...r, name: f.name })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  function go(path: string) {
    close()
    nav(path)
  }
  return (
    <Modal
      open
      onClose={close}
      title="Workspace overview"
      description="A live summary of your conversations, tools and workflows."
      wide
    >
      <div className="summary-stats">
        {[
          { label: 'Conversations', value: data.stats.conversations, icon: MessageSquare },
          { label: 'Messages', value: data.stats.messages, icon: Layers3 },
          { label: 'Tool executions', value: data.stats.tool_runs, icon: Terminal },
          { label: 'Workflow runs', value: data.stats.workflow_runs, icon: WorkflowIcon },
        ].map((x) => (
          <div className="stat" key={x.label}>
            <x.icon size={16} />
            <strong>{x.value}</strong>
            <span>{x.label}</span>
          </div>
        ))}
      </div>
      <div className="summary-heading">
        <h3>Recent conversations</h3>
        <button className="text-link" onClick={history}>
          View all
          <ChevronRight size={12} />
        </button>
      </div>
      {data.conversations.length ? (
        data.conversations.slice(0, 3).map((c) => (
          <button className="summary-thread" key={c.id} onClick={() => go('/chat/' + c.id)}>
            <MessageSquare size={14} />
            <span>{c.title}</span>
            <small>{dateLabel(c.updated_at)}</small>
          </button>
        ))
      ) : (
        <p className="summary-empty">
          No conversations yet. Start with a question or a suggested prompt.
        </p>
      )}
      <div className="summary-heading">
        <h3>Automation activity</h3>
        <button className="text-link" onClick={() => go('/automations')}>
          Manage
          <ArrowUpRight size={12} />
        </button>
      </div>
      {error ? (
        <Notice>{error}</Notice>
      ) : latest ? (
        <div className="summary-run">
          <Activity size={15} />
          <span>{latest.name}</span>
          <small>{dateLabel(latest.created_at)}</small>
          <Tag tone={latest.status === 'complete' ? 'green' : 'neutral'}>{latest.status}</Tag>
        </div>
      ) : (
        <p className="summary-empty">
          <Clock3 size={14} />
          {flows ? 'No automation runs yet.' : 'Loading workflow history…'}
        </p>
      )}
    </Modal>
  )
}
