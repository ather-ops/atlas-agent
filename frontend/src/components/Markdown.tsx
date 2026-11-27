import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useRef,useState,type ComponentProps } from 'react'
import { Copy,Check } from 'lucide-react'
function CodeBlock({ children }: ComponentProps<'pre'>) {
  const ref = useRef<HTMLElement>(null),
    [copied, setCopied] = useState(false),
    [error, setError] = useState(false)
  return (
    <section className="code-block" ref={ref}>
      <header>
        <span>Code</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                ref.current?.querySelector('code')?.textContent || '',
              )
              setCopied(true)
              setTimeout(() => setCopied(false), 1800)
            } catch {
              setError(true)
            }
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}{' '}
          {copied ? 'Copied' : error ? 'Select to copy' : 'Copy'}
        </button>
      </header>
      <pre>{children}</pre>
    </section>
  )
}
export default function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        skipHtml
        components={{
          pre: CodeBlock,
          img: ({ alt }) => <span>{alt || 'Image omitted'}</span>,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('/') ? '_self' : '_blank'}
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
