import { X,LoaderCircle,Check,AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Dialog,DialogContent,DialogDescription,DialogTitle,DialogClose } from './dialog'
export { Button } from './button'
export { cn } from '@/lib/utils'
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className={cn('modal', wide && 'modal-wide')}>
        <div className="modal-heading">
          <DialogTitle>{title}</DialogTitle>
          <DialogClose className="icon-btn" aria-label="Close dialog">
            <X size={17} />
          </DialogClose>
        </div>
        <DialogDescription className={description ? 'modal-desc' : 'sr-only'}>
          {description || title}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}
export function Loading({ text = 'Opening workspace…' }: { text?: string }) {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={18} />
      {text}
    </div>
  )
}
export function Notice({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return (
    <div className={cn('notice', success && 'success')} role="status">
      {success ? <Check size={16} /> : <AlertCircle size={16} />}
      <span>{children}</span>
    </div>
  )
}
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={'tag tag-' + tone}>{children}</span>
}
