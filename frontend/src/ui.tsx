import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'success' | 'error'; children: ReactNode }) {
  return <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state">
    <span className="empty-mark" aria-hidden="true">—</span>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
  </div>
}

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return <span className={`status-badge status-${value.replaceAll('_', '-')}`}>{label ?? value.replaceAll('_', ' ')}</span>
}

export function Dialog({ open, title, onClose, children }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  return <dialog ref={dialog} className="dialog" aria-label={title}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === dialog.current) onClose() }}>
    <div className="dialog-panel">
      <header className="dialog-header">
        <h2>{title}</h2>
        <button type="button" className="icon-button" aria-label="Cerrar diálogo" onClick={onClose}>×</button>
      </header>
      {children}
    </div>
  </dialog>
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return <div className="loading-state" role="status"><span className="loading-dot" aria-hidden="true" />{label}</div>
}
