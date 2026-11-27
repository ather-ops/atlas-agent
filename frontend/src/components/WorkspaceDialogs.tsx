import { ProfileAvatar } from './ProfileAvatar'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowUpRight,
  MessageSquare,
  LayoutDashboard,
  Workflow,
  Blocks,
  Settings2,
  ChevronRight,
  BookOpen,
  Terminal,
  ShieldCheck,
  Trash2,
  Clock3,
  Plus,
  Compass,
  ArrowRight,
} from 'lucide-react'
import { Modal, Button, Notice, Tag } from './ui/base'
import { AgentPanel, WorkspacePanel } from './WorkspacePanels'
import { prompts } from '../data/prompts'
import { useWorkspace } from '../contexts/Workspace'
import { api, dateLabel, err } from '../services/api'
export type DialogName =
  'search' | 'library' | 'guide' | 'history' | 'profile' | 'summary' | 'agent' | 'shortcuts' | null
export const destinations = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Automations', path: '/automations', icon: Workflow },
  { name: 'Integrations', path: '/integrations', icon: Blocks },
  { name: 'Settings', path: '/settings', icon: Settings2 },
]
export function WorkspaceDialogs({
  dialog,
  close,
  open,
}: {
  dialog: DialogName
  close: () => void
  open: (dialog: DialogName) => void
}) {
  const { data, refresh, notify } = useWorkspace()
  const nav = useNavigate()
  const [q, setQ] = useState(''),
    [filter, setFilter] = useState('All'),
    [del, setDel] = useState(''),
    [error, setError] = useState('')
  useEffect(() => {
    setQ('')
    setFilter('All')
    setDel('')
    setError('')
  }, [dialog])
  const go = (path: string, state?: unknown) => {
    close()
    nav(path, { state })
  }
  const start = (prompt: string) => go('/chat', { prompt })
  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase())
  const results = [
    ...destinations.map((x) => ({ ...x, detail: 'Page', action: () => go(x.path) })),
    ...data.conversations.map((c) => ({
      name: c.title,
      icon: MessageSquare,
      detail: 'Conversation',
      action: () => go('/chat/' + c.id),
    })),
    ...prompts.map((p) => ({
      name: p.title,
      icon: p.icon,
      detail: 'Prompt',
      action: () => start(p.prompt),
    })),
    ...data.integrations.map((i) => ({
      name: i.name,
      icon: Blocks,
      detail: 'Integration',
      action: () => go('/integrations?app=' + i.id),
    })),
  ]
    .filter((x) => match(x.name))
    .slice(0, 16)
  return (
    <>
      {dialog === 'agent' && <AgentPanel close={close} />}
      {dialog === 'summary' && <WorkspacePanel close={close} history={() => open('history')} />}
      <Modal
        open={dialog === 'shortcuts'}
        onClose={close}
        title="Keyboard shortcuts"
        description="A few small shortcuts for a faster workspace."
      >
        <div className="shortcut-list">
          {[
            ['Search workspace', '⌘ / Ctrl + K'],
            ['New chat', '⌘ / Ctrl + J'],
            ['Send message', 'Enter'],
            ['Insert a new line', 'Shift + Enter'],
            ['Close dialog', 'Esc'],
          ].map(([label, keys]) => (
            <div key={label}>
              <span>{label}</span>
              <kbd>{keys}</kbd>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        open={dialog === 'search'}
        onClose={close}
        title="Search workspace"
        description="Find a page, conversation, app or prompt."
      >
        <div className="filter-input">
          <Search size={17} />
          <input
            autoFocus
            placeholder="What are you looking for?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) results[0].action()
            }}
            aria-label="Search workspace"
          />
        </div>
        <div className="search-results">
          {results.map((r) => (
            <button key={r.detail + r.name} onClick={r.action}>
              <r.icon size={16} />
              <span>{r.name}</span>
              <small>{r.detail}</small>
              <ChevronRight size={13} />
            </button>
          ))}
          {!results.length && <p className="empty-copy">No matches. Try a different search.</p>}
        </div>
      </Modal>
      <Modal
        open={dialog === 'library'}
        onClose={close}
        title="Prompt library"
        description="A starting point for your next conversation. Choose a prompt, then make it your own."
        wide
      >
        <div className="filter-input">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a prompt…"
            aria-label="Find a prompt"
          />
        </div>
        <div className="tabs">
          {['All', 'Research', 'Writing', 'Analysis', 'Code', 'Tools', 'Workflows'].map((t) => (
            <button key={t} className={filter === t ? 'selected' : ''} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="library-grid">
          {prompts
            .filter(
              (p) =>
                (filter === 'All' || p.category === filter) && match(p.title + ' ' + p.description),
            )
            .map((p) => (
              <button key={p.title} onClick={() => start(p.prompt)} className="library-item">
                <span className={'icon-tile ' + p.tone}>
                  <p.icon size={18} />
                </span>
                <strong>{p.title}</strong>
                <span>{p.description}</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
        </div>
        {!prompts.some(
          (p) =>
            (filter === 'All' || p.category === filter) && match(p.title + ' ' + p.description),
        ) && <p className="empty-copy">No prompts match this search.</p>}
      </Modal>
      <Modal
        open={dialog === 'history'}
        onClose={close}
        title="Conversation history"
        description="Saved conversations in your personal workspace."
      >
        <div className="filter-input">
          <Search size={16} />
          <input
            placeholder="Search conversations…"
            aria-label="Search conversations"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {error && <Notice>{error}</Notice>}
        <div className="history-list">
          {data.conversations
            .filter((c) => match(c.title))
            .map((c) => (
              <div className="history-item" key={c.id}>
                <MessageSquare size={17} />
                <button className="grow text-left" onClick={() => go('/chat/' + c.id)}>
                  <strong>{c.title}</strong>
                  <small>{dateLabel(c.updated_at)}</small>
                </button>
                {del === c.id ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      try {
                        await api('/conversations/' + c.id, 'DELETE')
                        await refresh()
                        setDel('')
                        notify('Conversation deleted')
                        if (location.pathname.endsWith(c.id)) go('/chat')
                      } catch (e) {
                        setError(err(e))
                      }
                    }}
                  >
                    Confirm delete
                  </Button>
                ) : (
                  <button
                    className="icon-btn"
                    aria-label={'Delete ' + c.title}
                    onClick={() => setDel(c.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
        </div>
        {!data.conversations.length ? (
          <div className="empty-block">
            <Clock3 />
            <h3>A fresh page</h3>
            <p>Start a conversation and it will be saved here.</p>
            <Button onClick={() => go('/chat')}>
              <Plus size={15} />
              New conversation
            </Button>
          </div>
        ) : (
          !data.conversations.some((c) => match(c.title)) && (
            <p className="empty-copy">No conversations match this search.</p>
          )
        )}
      </Modal>
      <Modal
        open={dialog === 'guide'}
        onClose={close}
        title="Atlas field guide"
        description="A short guide to your personal AI workspace."
      >
        <div className="guide-cover">
          <Compass size={32} />
          <span>
            FIELD NOTES <b>01 / 03</b>
          </span>
        </div>
        <div className="guide-items">
          {[
            {
              icon: BookOpen,
              title: 'Start with a question',
              body: 'Ask for the time or try a calculation. Your local tools work without an API key.',
              path: '/chat',
            },
            {
              icon: Terminal,
              title: 'Bring your model',
              body: 'Configure Groq in Settings for open-ended answers, streaming and multi-step tool use.',
              path: '/settings',
            },
            {
              icon: ShieldCheck,
              title: 'Stay in control',
              body: 'File creation needs your approval. Future app integrations are labeled Coming soon.',
              path: '/integrations',
            },
          ].map((x) => (
            <button onClick={() => go(x.path)} key={x.title}>
              <x.icon size={18} />
              <span>
                <strong>{x.title}</strong>
                <small>{x.body}</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </Modal>
      <Modal open={dialog === 'profile'} onClose={close} title="Your workspace">
        <div className="profile-large">
          <ProfileAvatar name={data.preferences.name} />
          <div>
            <h3>{data.preferences.name || 'Your profile'}</h3>
            <p>Personal workspace</p>
          </div>
          <Tag>Local profile</Tag>
        </div>
        <p className="muted">
          Your conversations, preferences and files belong to this browser’s private workspace.
        </p>
        <Button className="mt-5" onClick={() => go('/settings', { editProfile: true })}>
          {data.preferences.name ? 'Edit profile' : 'Add your name'}
          <ArrowRight size={15} />
        </Button>
      </Modal>
    </>
  )
}
