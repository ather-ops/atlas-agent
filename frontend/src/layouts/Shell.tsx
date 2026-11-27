import { ProfileAvatar } from '../components/ProfileAvatar'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  Download,
  History,
  Keyboard,
  LockKeyhole,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react'
import { Mark, AppLogo } from '../components/Brand'
import { destinations, type DialogName } from '../components/WorkspaceDialogs'
import { useWorkspace } from '../contexts/Workspace'
import { starters } from '../data/prompts'
import { api, err } from '../services/api'
import type { Detail } from '../types'

export function Shell({ children, open }: { children: ReactNode; open: (d: DialogName) => void }) {
  const { data, savePrefs, notify } = useWorkspace()
  const loc = useLocation(),
    nav = useNavigate()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('atlas-nav') === 'compact'),
    [mobile, setMobile] = useState(false),
    [small, setSmall] = useState(() => matchMedia('(max-width:780px)').matches),
    [exporting, setExporting] = useState(false)
  useEffect(() => {
    const mq = matchMedia('(max-width:780px)')
    const sync = () => {
      setSmall(mq.matches)
      if (!mq.matches) setMobile(false)
    }
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const shortcutKey = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'
  const page =
    destinations.find((x) =>
      x.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(x.path),
    )?.name || 'Workspace'
  const cid = loc.pathname.match(/^\/chat\/([^/]+)\/?$/)?.[1]
  const dark =
    data.preferences.theme === 'dark' ||
    (data.preferences.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    setMobile(false)
    document.title = page + ' · Atlas Workspace'
    document.getElementById('main-content')?.scrollTo(0, 0)
  }, [loc.key, page])
  useEffect(() => {
    if (mobile) document.querySelector<HTMLButtonElement>('.mobile-close')?.focus()
  }, [mobile])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMobile(false)
        open('search')
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        open(null)
        nav('/chat', { state: { newChat: Date.now() } })
      } else if (e.key === 'Escape') setMobile(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, nav])
  const toggle = () => {
    localStorage.setItem('atlas-nav', collapsed ? 'full' : 'compact')
    setCollapsed(!collapsed)
  }
  const show = (d: DialogName) => {
    setMobile(false)
    open(d)
  }
  async function exportChat() {
    if (!cid || exporting) return
    setExporting(true)
    try {
      const c = await api<Detail>('/conversations/' + cid)
      const text =
        '# ' +
        c.title +
        '\n\n' +
        c.messages
          .map(
            (m) =>
              `## ${m.role === 'user' ? 'You' : 'Atlas'}\n\n${m.attachment ? 'Attachment: ' + m.attachment.name + '\n\n' : ''}${m.content}`,
          )
          .join('\n\n')
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `atlas-chat-${c.id.slice(0, 8)}.md`
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      notify(err(e))
    } finally {
      setExporting(false)
    }
  }
  const history = data.conversations.length
    ? data.conversations
        .slice(0, 5)
        .map((c) => ({ key: c.id, title: c.title, action: () => nav('/chat/' + c.id) }))
    : starters.map((s) => ({
        key: s.title,
        title: s.title,
        action: () => nav('/chat', { state: { prompt: s.prompt } }),
      }))
  return (
    <div className="desktop-stage">
      <div
        className={'app-shell ' + (collapsed ? 'is-compact ' : '') + (mobile ? 'drawer-open' : '')}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {mobile && (
          <button
            className="sidebar-scrim"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setMobile(false)}
          />
        )}
        <aside
          id="workspace-navigation"
          className="sidebar"
          aria-label="Workspace navigation"
          inert={small && !mobile}
          role={small && mobile ? 'dialog' : undefined}
          aria-modal={small && mobile ? true : undefined}
        >
          <div className="brand-row">
            <Link className="brand" to="/" aria-label="Atlas overview">
              <Mark size={32} />
              <span>Atlas</span>
            </Link>
            <button
              className="icon-btn collapse-toggle"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggle}
            >
              {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
            <button
              className="icon-btn mobile-close"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="rail-actions">
            <button
              className="new-conversation"
              onClick={() => nav('/chat', { state: { newChat: Date.now() } })}
              title="New chat"
              aria-label="New chat"
            >
              <Plus size={16} />
              <span>New chat</span>
              <kbd aria-hidden="true">{shortcutKey} J</kbd>
            </button>
            <button
              className="rail-search"
              onClick={() => show('search')}
              aria-label="Search workspace"
            >
              <Search size={14} />
              <span>Search</span>
              <kbd aria-hidden="true">{shortcutKey} K</kbd>
            </button>
          </div>
          <div className="rail-scroll">
            <div className="nav-label">Workspace</div>
            <nav className="main-nav">
              {destinations.map((d) => (
                <NavLink
                  key={d.path}
                  end={d.path === '/'}
                  to={d.path}
                  title={d.name}
                  className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
                >
                  <d.icon size={17} strokeWidth={1.7} />
                  <span>{d.name}</span>
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-recents">
              <div className="nav-label line">
                {data.conversations.length ? 'Recent chats' : 'Starter chats'}
                <button
                  aria-label="Open conversation history"
                  title="Conversation history"
                  onClick={() => show('history')}
                >
                  <History size={13} />
                </button>
              </div>
              {history.map((s) => (
                <button className="recent-link" onClick={s.action} key={s.key}>
                  <MessageSquare size={13} />
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="side-bottom">
            <section className="app-tray" aria-label="Upcoming app connections">
              <div>
                <span>App connections</span>
                <small>Coming soon</small>
              </div>
              <div className="rail-apps">
                {data.integrations
                  .filter((i) => i.status === 'coming_soon')
                  .map((i) => (
                    <button
                      key={i.id}
                      aria-label={i.name}
                      title={`${i.name} · Coming soon`}
                      onClick={() => nav('/integrations?app=' + i.id)}
                    >
                      <AppLogo id={i.id} size={17} />
                    </button>
                  ))}
              </div>
            </section>
            <button
              className="profile-row"
              aria-label="Your profile"
              title="Your profile"
              onClick={() => show('profile')}
            >
              <ProfileAvatar name={data.preferences.name} />
              <span className="profile-name">
                <strong>{data.preferences.name || 'Your profile'}</strong>
                <small>Personal workspace</small>
              </span>
              <ChevronsUpDown size={13} />
            </button>
          </div>
        </aside>
        <div className="main-shell" inert={small && mobile}>
          <header className="topbar">
            <div className="breadcrumbs">
              <button
                className="mobile-menu icon-btn"
                onClick={() => setMobile(true)}
                aria-label="Open navigation"
                aria-controls="workspace-navigation"
                aria-expanded={mobile}
              >
                <Menu size={19} />
              </button>
              <button
                className="assistant-picker"
                onClick={() => show('agent')}
                aria-label="Atlas Assistant controls"
              >
                <Mark size={18} />
                <span>Atlas Assistant</span>
                <ChevronDown size={12} />
              </button>
              <strong className="page-crumb">{page}</strong>
            </div>
            <div className="top-actions">
              <span
                className="online-pill"
                title={
                  data.status.mode === 'local'
                    ? 'Agent runtime online · Local tools'
                    : 'Agent runtime online · Groq configured'
                }
              >
                <i />
                {data.status.mode === 'local' ? 'Local tools' : 'Groq configured'}
              </span>
              <span className="header-rule" />
              <button
                aria-label="Toggle color theme"
                title="Toggle color theme"
                className="icon-btn theme-btn"
                onClick={() =>
                  savePrefs({ ...data.preferences, theme: dark ? 'light' : 'dark' }).catch((e) =>
                    notify(err(e)),
                  )
                }
              >
                {dark ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {cid ? (
                <button
                  className="workspace-action"
                  onClick={exportChat}
                  disabled={exporting}
                  aria-label="Export chat"
                >
                  <Download size={14} />
                  <span>{exporting ? 'Exporting…' : 'Export chat'}</span>
                </button>
              ) : (
                <button
                  className="workspace-action"
                  onClick={() => show('summary')}
                  aria-label="Workspace overview"
                >
                  <Activity size={14} />
                  <span>Workspace</span>
                </button>
              )}
            </div>
          </header>
          <main
            id="main-content"
            className={
              'content ' + (page === 'Chat' || page === 'Overview' ? 'studio-content' : '')
            }
            tabIndex={-1}
          >
            {children}
          </main>
          <footer className="workspace-footer">
            <span>
              <LockKeyhole size={12} />
              Private workspace
            </span>
            <p>
              Think beyond chat. <b>Build beyond automation.</b>
            </p>
            <div>
              <button
                className="icon-btn"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts"
                onClick={() => show('shortcuts')}
              >
                <Keyboard size={15} />
              </button>
              <button
                className="icon-btn"
                aria-label="Atlas field guide"
                title="Atlas field guide"
                onClick={() => show('guide')}
              >
                <CircleHelp size={15} />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
