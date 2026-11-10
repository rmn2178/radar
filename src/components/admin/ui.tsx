'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';

export function Notice({ children, success = false }: { children: ReactNode; success?: boolean }) {
  if (!children) return null;
  return <div className={`admin-notice ${success ? 'admin-notice-success' : ''}`} role={success ? 'status' : 'alert'}>
    {success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<div>{children}</div>
  </div>;
}

export function Loading({ label = 'Loading your workspace…' }: { label?: string }) {
  return <div className="admin-loading" role="status"><Loader2 size={22} className="admin-spin" />{label}</div>;
}

export function PageHeading({ eyebrow = 'RADAR WORKSPACE', title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) {
  return <div className="admin-page-heading"><div><p className="admin-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="admin-description">{description}</p></div><div className="admin-heading-actions">{children}</div></div>;
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="admin-empty"><div className="admin-empty-mark"><Search size={25} /></div><h3>{title}</h3><p>{description}</p>{children}</div>;
}

export function Modal({ title, children, onClose, wide = false, locked = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; locked?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={ref} className={`admin-modal ${wide ? 'admin-modal-wide' : ''}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!locked) onClose(); }}>
    <div className="admin-modal-heading"><h2 id={titleId}>{title}</h2><button className="admin-icon-button" type="button" aria-label="Close dialog" disabled={locked} onClick={onClose}><X size={20} /></button></div>
    <div className="admin-modal-body">{children}</div>
  </dialog>;
}

type Confirmation = { title: string; description: string; label?: string; danger?: boolean };
export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirm = useCallback((options: Confirmation) => new Promise<boolean>(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setConfirmation(options);
  }), []);
  const finish = (value: boolean) => { resolver.current?.(value); resolver.current = null; setConfirmation(null); };
  useEffect(() => () => resolver.current?.(false), []);
  const dialog = confirmation ? <Modal title={confirmation.title} onClose={() => finish(false)}>
    <p className="admin-description">{confirmation.description}</p>
    <div className="admin-dialog-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => finish(false)}>Cancel</button><button type="button" className={`admin-button ${confirmation.danger ? 'admin-button-danger' : ''}`} onClick={() => finish(true)}>{confirmation.label ?? 'Confirm'}</button></div>
  </Modal> : null;
  return { confirm, dialog };
}

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="admin-pagination"><span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 results'}</span><div><button type="button" className="admin-icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={18} /></button><span>Page {page} of {pages}</span><button type="button" className="admin-icon-button" aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={18} /></button></div></div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-badge admin-badge-${status}`}>{status}</span>;
}
