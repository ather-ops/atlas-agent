import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  CornerDownLeft,
  FileText,
  Globe2,
  Paperclip,
  Sparkles,
  Square,
  X,
} from 'lucide-react'
import { useWorkspace } from '../contexts/Workspace'
import { err } from '../services/api'
import { ConnectionDialog } from '../pages/Integrations'
import type { Attachment } from '../types'
import { Notice } from './ui/base'
import type { DialogName } from './WorkspaceDialogs'

export type Draft = { prompt: string; attachment: Attachment | null; search: boolean }
export const emptyDraft = (): Draft => ({ prompt: '', attachment: null, search: false })

type Props = {
  value: Draft
  setValue: Dispatch<SetStateAction<Draft>>
  inputRef: RefObject<HTMLTextAreaElement | null>
  submit: (value: Draft) => void
  open: (dialog: DialogName) => void
  overview?: boolean
  compact?: boolean
  busy?: boolean
  disabled?: boolean
  stop?: () => void
}

/** One composer from first prompt to final follow-up; attachments remain in memory until send. */
export function Composer({
  value,
  setValue,
  inputRef,
  submit,
  open,
  overview = false,
  compact = false,
  busy = false,
  disabled = false,
  stop,
}: Props) {
  const { data } = useWorkspace()
  const picker = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(''),
    [configureSearch, setConfigureSearch] = useState(false)
  const searchService = data.integrations.find((i) => i.id === 'tavily')
  useEffect(() => {
    const el = inputRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 152) + 'px'
    }
  }, [value.prompt, inputRef, compact])
  async function attach(file?: File) {
    if (!file || busy) return
    try {
      if (!/\.(txt|md|csv)$/i.test(file.name) || file.size > 32000)
        throw Error('Choose a .txt, .md or .csv file under 32 KB.')
      if (
        file.name.length > 90 ||
        !/^[\p{L}\p{N}_ -][\p{L}\p{N}_ .-]*\.(txt|md|csv)$/u.test(file.name)
      )
        throw Error(
          'Use a short filename with a lowercase .txt, .md or .csv extension and no special characters.',
        )
      let text: string
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
      } catch {
        throw Error('Use a UTF-8 text file.')
      }
      if (!text.trim() || text.length > 16000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))
        throw Error('Use a UTF-8 text file with at most 16,000 characters.')
      setValue((v) => ({ ...v, attachment: { name: file.name, text }, search: false }))
      setError('')
      inputRef.current?.focus()
    } catch (e) {
      setError(err(e))
    } finally {
      if (picker.current) picker.current.value = ''
    }
  }
  function toggleSearch() {
    if (!data.preferences.allow_network) {
      setError('External tools are disabled in Settings → Privacy & security.')
      return
    }
    if (!searchService || !['connected', 'configured'].includes(searchService.status)) {
      setConfigureSearch(true)
      return
    }
    setValue((v) => ({ ...v, search: !v.search }))
    setError('')
  }
  const send = () => {
    if (!busy && !disabled && value.prompt.trim()) {
      setError('')
      submit({ ...value, prompt: value.prompt.trim() })
    }
  }
  return (
    <div className={'draft-block ' + (compact ? 'draft-compact' : '')}>
      {error && <Notice>{error}</Notice>}
      <form
        className="atlas-composer"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void attach(e.dataTransfer.files[0])
        }}
      >
        <div className="draft-main">
          {value.attachment && (
            <div className="file-chip">
              <FileText size={13} />
              {value.attachment.name}
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setValue((v) => ({ ...v, attachment: null }))}
              >
                <X size={12} />
              </button>
            </div>
          )}
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={6000}
            aria-label={overview ? 'Ask Atlas anything' : 'Message Atlas'}
            placeholder="Ask Atlas anything…"
            value={value.prompt}
            onChange={(e) => setValue((v) => ({ ...v, prompt: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
          />
          <div className="draft-tools">
            <button
              type="button"
              className="agent-mode"
              title="Agent controls"
              onClick={() => open('agent')}
            >
              <Sparkles size={14} />
              <span>{data.preferences.provider === 'local' ? 'Local mode' : 'Agent mode'}</span>
              <ChevronDown size={11} />
            </button>
            <button
              type="button"
              className={'web-tool ' + (value.search ? 'selected' : '')}
              aria-pressed={value.search}
              title={
                value.attachment
                  ? 'External tools are off for attached documents'
                  : 'Use Tavily to search the web'
              }
              disabled={busy || !!value.attachment}
              onClick={toggleSearch}
            >
              <Globe2 size={14} />
              <span>Web search</span>
              {value.search && <Check size={11} />}
            </button>
            <span className="draft-spacer" />
            <span className="send-hint">
              <CornerDownLeft size={11} /> to send
            </span>
            {busy ? (
              <button
                className="orb-send stop"
                type="button"
                aria-label="Stop generation"
                onClick={stop}
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                className="orb-send"
                type="submit"
                disabled={!value.prompt.trim() || disabled}
                aria-label={overview ? 'Start conversation' : 'Send message'}
                title="Send message"
              >
                <ArrowUp size={19} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="draft-shelf">
          <button type="button" onClick={() => open('library')}>
            <BookOpen size={13} />
            Prompt library
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => picker.current?.click()}
            aria-label="Attach a text file"
          >
            <Paperclip size={13} />
            Attach file
          </button>
        </div>
        <input
          ref={picker}
          type="file"
          accept=".txt,.md,.csv"
          hidden
          onChange={(e) => void attach(e.target.files?.[0])}
        />
      </form>
      <ConnectionDialog
        item={configureSearch ? (searchService ?? null) : null}
        close={() => setConfigureSearch(false)}
      />
    </div>
  )
}
