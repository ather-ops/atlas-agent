import { ProfileAvatar } from '../components/ProfileAvatar'
import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileText,
  ChevronDown,
  Check,
  Copy,
  RotateCcw,
  LoaderCircle,
  Activity,
  ShieldCheck,
  MessageSquare,
  History,
  SquarePen,
} from 'lucide-react'
import { useWorkspace } from '../contexts/Workspace'
import { api, streamChat, err } from '../services/api'
import { Mark } from '../components/Brand'
import { Button, Loading, Notice } from '../components/ui/base'
import { AssistantStudio } from '../components/AssistantStudio'
import { Composer, emptyDraft } from '../components/Composer'
import type { Attachment, Detail, Message, Step } from '../types'
import type { DialogName } from '../components/WorkspaceDialogs'
const Markdown = lazy(() => import('../components/Markdown'))
function Proposal({ s }: { s: Step }) {
  const [status, setStatus] = useState(s.status),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  async function resolve(approve: boolean) {
    setBusy(true)
    try {
      const a = await api<{ status: string }>('/actions/' + s.id, 'POST', { approve })
      setStatus(a.status)
    } catch (e) {
      setError(err(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="proposal">
      <strong>
        <ShieldCheck size={16} />
        File creation request
      </strong>
      <small>{s.filename}</small>
      <pre>{s.content}</pre>
      {status === 'pending' ? (
        <>
          <p>Only approve if you want Atlas to create this exact file.</p>
          <div className="button-row">
            <Button size="sm" disabled={busy} onClick={() => resolve(true)}>
              Approve creation
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => resolve(false)}>
              Decline
            </Button>
          </div>
        </>
      ) : (
        <p>{status === 'approved' ? 'Approved · File created' : 'Declined · No file created'}</p>
      )}
      {error && <Notice>{error}</Notice>}
    </div>
  )
}
function Steps({ steps, live }: { steps: Step[]; live: boolean }) {
  const items = steps.filter((s) => s.type !== 'approval')
  if (!items.length) return null
  const tools = items.filter((s) => s.type === 'tool')
  return (
    <details className="agent-steps">
      <summary>
        {live ? <LoaderCircle size={12} className="spin" /> : <Activity size={12} />}{' '}
        {live
          ? items.at(-1)?.label || 'Working…'
          : tools.length
            ? `${tools.map((x) => x.label).join(' · ')} · ${tools.some((s) => s.status === 'failed') ? 'Needs attention' : 'Tool activity'}`
            : 'Agent activity'}
        <ChevronDown size={12} />
      </summary>
      <ul>
        {items.map((x, i) => (
          <li key={i}>
            <span className={x.status === 'failed' ? 'failed-dot' : 'step-dot'} />
            {x.label}
            <small>{x.type === 'tool' ? x.status : ''}</small>
          </li>
        ))}
      </ul>
    </details>
  )
}
export default function Chat({
  open,
  overview = false,
}: {
  open: (d: DialogName) => void
  overview?: boolean
}) {
  const { data, refresh, notify } = useWorkspace()
  const { id } = useParams()
  const loc = useLocation(),
    nav = useNavigate()
  const [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(emptyDraft),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(!!id),
    [error, setError] = useState(''),
    [title, setTitle] = useState(''),
    [copied, setCopied] = useState('')
  const current = useRef<string | undefined>(id),
    controller = useRef<AbortController | null>(null),
    run = useRef<string | undefined>(undefined),
    textarea = useRef<HTMLTextAreaElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    pinned = useRef(true),
    mounted = useRef(true)
  const replaceMsg = (uid: string, fn: (m: Message) => Message) =>
    setMessages((ms) => ms.map((m) => (m.id === uid ? fn(m) : m)))
  async function send(
    text: string,
    file: Attachment | null,
    regenerate = false,
    search = draft.search,
  ) {
    if (!text.trim() || controller.current) return
    const ctrl = new AbortController()
    controller.current = ctrl
    setError('')
    setBusy(true)
    setDraft((v) => ({ ...v, prompt: '', attachment: null }))
    pinned.current = true
    const mid = crypto.randomUUID(),
      uid = crypto.randomUUID()
    const newM: Message = {
      id: mid,
      role: 'assistant',
      content: '',
      activity: [],
      status: 'running',
    }
    setMessages((ms) =>
      regenerate
        ? [...ms.slice(0, -1), newM]
        : [
            ...ms,
            {
              id: uid,
              role: 'user',
              content: text.trim(),
              activity: [],
              status: 'complete',
              attachment: file,
            },
            newM,
          ],
    )
    let receivedId = current.current
    let ended = false
    try {
      await streamChat(
        {
          message: text.trim(),
          conversation_id: current.current || null,
          attachment: file,
          search,
          regenerate,
        },
        ctrl.signal,
        (e) => {
          if (ctrl !== controller.current) return
          if (e.type === 'start') {
            run.current = e.session_id
            receivedId = e.conversation_id
            current.current = receivedId
            setTitle((t) => t || text.slice(0, 72))
          } else if (e.type === 'delta') {
            replaceMsg(mid, (m) => ({ ...m, content: m.content + (e.text || '') }))
          } else if (e.type === 'done') {
            ended = true
            replaceMsg(mid, (m) => ({ ...m, status: e.status }))
          } else if (e.type === 'error')
            replaceMsg(mid, (m) => ({ ...m, status: 'error', content: m.content + (e.text || '') }))
          else replaceMsg(mid, (m) => ({ ...m, activity: [...m.activity, e] }))
        },
      )
    } catch (e) {
      if (ctrl === controller.current) {
        if (ctrl.signal.aborted) replaceMsg(mid, (m) => ({ ...m, status: 'stopped' }))
        else {
          setError(err(e))
          replaceMsg(mid, (m) => ({ ...m, status: 'error' }))
          if (!receivedId) setDraft((v) => ({ ...v, prompt: text, attachment: file }))
        }
      }
    } finally {
      if (controller.current === ctrl && mounted.current) {
        controller.current = null
        run.current = undefined
        setBusy(false)
        if (receivedId && receivedId !== id) nav('/chat/' + receivedId, { replace: !overview })
        void refresh().catch((e) => notify(err(e)))
        if (!ended && ctrl.signal.aborted) notify('Generation stopped')
      }
    }
  }
  useEffect(() => {
    mounted.current = true
    const previous = controller.current
    controller.current = null
    previous?.abort()
    let live = true
    setBusy(false)
    current.current = id
    pinned.current = true
    setError('')
    setTitle('')
    setMessages([])
    setDraft(emptyDraft())
    setLoading(!!id)
    if (id) {
      api<Detail>('/conversations/' + id)
        .then((c) => {
          if (!live) return
          setMessages(c.messages)
          setTitle(c.title)
        })
        .catch((e) => live && setError(err(e)))
        .finally(() => live && setLoading(false))
    } else {
      // Only canned prompt text can come from navigation. Actual drafts and files never enter browser history.
      const prompt = typeof loc.state?.prompt === 'string' ? loc.state.prompt : ''
      setDraft({ ...emptyDraft(), prompt })
      if (!overview && (prompt || matchMedia('(pointer:fine)').matches))
        requestAnimationFrame(() => textarea.current?.focus({ preventScroll: true }))
    }
    return () => {
      live = false
      mounted.current = false
      if (run.current && controller.current) {
        void api('/agent/stop', 'POST', { session_id: run.current }).catch(() => {})
        run.current = undefined
      }
      const c = controller.current
      controller.current = null
      c?.abort()
    }
  }, [id, loc.key])
  useEffect(() => {
    const box = viewport.current
    if (box && pinned.current) box.scrollTop = box.scrollHeight
  }, [messages])
  const regen = () => {
    const m = messages.at(-2)
    if (m?.role === 'user') void send(m.content, m.attachment || null, true)
  }
  const composer = (
    <>
      <div aria-live="polite">{error && <Notice>{error}</Notice>}</div>
      <Composer
        overview={overview && !messages.length}
        value={draft}
        setValue={setDraft}
        inputRef={textarea}
        open={open}
        compact={!!messages.length}
        busy={busy}
        disabled={loading}
        submit={(v) => void send(v.prompt, v.attachment, false, v.search)}
        stop={async () => {
          if (!run.current) {
            controller.current?.abort()
            return
          }
          try {
            await api('/agent/stop', 'POST', { session_id: run.current })
          } catch {
            controller.current?.abort()
          }
        }}
      />
    </>
  )
  if (loading) return <Loading text="Loading conversation…" />
  if (id && error && !messages.length)
    return (
      <div className="page-wrap empty-block">
        <Notice>{error}</Notice>
        <Button onClick={() => open('history')}>Open conversation history</Button>
      </div>
    )
  if (!messages.length && !id)
    return (
      <AssistantStudio
        chat={!overview}
        select={(prompt) => {
          setDraft((v) => ({ ...v, prompt }))
          textarea.current?.focus({ preventScroll: true })
        }}
      >
        {composer}
      </AssistantStudio>
    )
  return (
    <div className="chat-page">
      <div className="chat-heading">
        <div>
          <MessageSquare size={15} />
          <span>{title || 'New conversation'}</span>
        </div>
        <div>
          <button
            title="Conversation history"
            aria-label="Conversation history"
            className="icon-btn"
            onClick={() => open('history')}
          >
            <History size={16} />
          </button>
          <button
            aria-label="Start new chat"
            title="New chat"
            className="icon-btn"
            onClick={() => nav('/chat', { state: { newChat: Date.now() } })}
          >
            <SquarePen size={16} />
          </button>
        </div>
      </div>
      <div
        className="chat-scroll"
        role="log"
        aria-label="Conversation messages"
        aria-busy={busy}
        tabIndex={0}
        ref={viewport}
        onScroll={(e) => {
          const b = e.currentTarget
          pinned.current = b.scrollHeight - b.clientHeight - b.scrollTop < 60
        }}
      >
        <div className="transcript">
          {messages.map((m, i) => (
            <article className={'message ' + m.role} key={m.id}>
              {m.role === 'user' ? (
                <>
                  <div className="user-bubble">
                    {m.attachment && (
                      <span className="file-chip">
                        <FileText size={13} />
                        {m.attachment.name}
                      </span>
                    )}
                    {m.content}
                  </div>
                  <ProfileAvatar name={data.preferences.name} small />
                </>
              ) : (
                <>
                  <span className="assistant-mark">
                    <Mark size={21} />
                  </span>
                  <div className="message-body">
                    <div className="message-name">
                      Atlas <span>Assistant</span>
                    </div>
                    <Steps steps={m.activity} live={busy && i === messages.length - 1} />
                    {m.content ? (
                      <Suspense fallback={<p>{m.content}</p>}>
                        <Markdown text={m.content} />
                      </Suspense>
                    ) : m.status === 'running' ? (
                      <div className="typing">
                        <i />
                        <i />
                        <i />
                      </div>
                    ) : null}
                    {m.activity
                      .filter((s) => s.type === 'approval')
                      .map((s) => (
                        <Proposal key={s.id} s={s} />
                      ))}
                    {m.status === 'stopped' && <small className="muted">Generation stopped</small>}
                    {m.status === 'error' && (
                      <small className="error-text">Response interrupted</small>
                    )}
                    {m.status !== 'running' && (
                      <div className="response-tools">
                        <button
                          title="Copy response"
                          aria-label="Copy response"
                          disabled={!m.content}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(m.content)
                              setCopied(m.id)
                              setTimeout(() => setCopied(''), 1800)
                            } catch {
                              notify('Clipboard unavailable. Select the response to copy it.')
                            }
                          }}
                        >
                          {copied === m.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        {i === messages.length - 1 && (
                          <button
                            onClick={regen}
                            disabled={busy || !current.current}
                            aria-label="Regenerate response"
                            title="Regenerate response"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
      <div className="conversation-composer">
        {composer}
        <p className="conversation-mode">
          <i />
          {data.status.mode === 'local' ? 'Local tools' : 'Groq'}
          <span>·</span>
          {data.status.mode === 'local' ? (
            <Link to="/settings" state={{ tab: 'Agent & model' }}>
              Configure a model for AI responses
            </Link>
          ) : (
            'Review important answers before acting.'
          )}
        </p>
      </div>
    </div>
  )
}
