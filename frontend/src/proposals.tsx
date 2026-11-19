import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from './api'
import type { Account } from './api'
import { EmptyState, Notice, StatusBadge } from './ui'

type Proposal = {
  id: number; application_id: number; offer_title: string; company_name: string; representative: string
  student_name: string; start_date: string; end_date: string; hours: number; conditions: string
  status: string; responded_at: string | null; academic_status: string; academic_note: string | null
  academic_updated_at: string | null; has_evidence: boolean; letter_issued_at: string | null
}

const responseLabels: Record<string, string> = { pendiente: 'Esperando respuesta', aceptada: 'Propuesta aceptada', rechazada: 'Propuesta rechazada' }
const academicLabels: Record<string, string> = {
  pendiente: 'Pendiente de gestionar', en_tramite: 'En trámite', autorizacion_informada: 'Autorización informada por estudiante',
  no_requerida: 'No requerida según declaración', denegada: 'Denegada según declaración',
}
const inputClass = 'mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-[15px] text-pine-950 outline-none transition focus:border-pine-800 focus:ring-2 focus:ring-pine-800/15'
const buttonClass = 'rounded-full bg-pine-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:opacity-50'
const quietButtonClass = 'rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-pine-900 transition hover:border-pine-800 hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:opacity-50'

export function ProposalForm({ applicationId, onClose, onCreated, onExpire }: { applicationId: number; onClose: () => void; onCreated: () => void; onExpire: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true); setError('')
    try {
      await api('/postulaciones/' + applicationId + '/propuesta', 'POST', { ...fields, hours: Number(fields.hours) })
      onCreated()
    } catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <form className="space-y-5" onSubmit={submit}>
    <p className="text-sm leading-6 text-muted">Indica fechas, horas y condiciones acordadas. La empresa presenta esta propuesta; la autorización académica se gestiona por separado con la institución.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-pine-950">Fecha de inicio<input className={inputClass} name="start_date" type="date" required /></label>
      <label className="text-sm font-semibold text-pine-950">Fecha de término<input className={inputClass} name="end_date" type="date" required /></label>
      <label className="text-sm font-semibold text-pine-950 sm:col-span-2">Horas acordadas<input className={inputClass} name="hours" type="number" min="1" max="2147483647" required /></label>
      <label className="text-sm font-semibold text-pine-950 sm:col-span-2">Condiciones<textarea className={inputClass + ' min-h-32 resize-y'} name="conditions" rows={4} maxLength={1500} required placeholder="Funciones, horario, lugar, modalidad y beneficios acordados" /></label>
    </div>
    {error && <Notice kind="error">{error}</Notice>}
    <div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={busy}>{busy ? 'Enviando…' : 'Presentar propuesta'} <span aria-hidden="true">↗</span></button><button className={quietButtonClass} type="button" onClick={onClose}>Cancelar</button></div>
  </form>
}

function AcademicForm({ proposal, reload, onExpire }: { proposal: Proposal; reload: () => Promise<void>; onExpire: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true); setError('')
    try {
      await api('/propuestas/' + proposal.id + '/autorizacion', 'PUT', { status: fields.status, note: fields.note || null })
      await reload()
    } catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const file = new FormData(form).get('evidence') as File
    if (!file?.size || file.size > 2 * 1024 * 1024) { setError('Selecciona un PDF de hasta 2 MiB.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/propuestas/' + proposal.id + '/respaldo', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/pdf' }, body: file })
      if (response.status === 401) { onExpire(); return }
      if (!response.ok) throw new Error((await response.json()).detail || 'No se pudo guardar el respaldo.')
      form.reset()
      await reload()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="mt-6 border-t border-stone-200 pt-5" aria-labelledby={`academic-${proposal.id}`}>
    <p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">Paso externo</p>
    <h3 id={`academic-${proposal.id}`} className="mt-2 font-display text-xl font-semibold text-pine-950">Autorización académica</h3>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Informa lo gestionado con tu institución. PractiConecta registra tu declaración y no verifica ni emite una aprobación oficial.</p>
    {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <form className="space-y-4" onSubmit={upload}>
        <label className="block text-sm font-semibold text-pine-950">Respaldo privado (PDF, máximo 2 MiB)<input className={inputClass + ' file:mr-4 file:rounded-full file:border-0 file:bg-pine-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-pine-950'} name="evidence" type="file" accept="application/pdf,.pdf" required /></label>
        <p className="text-xs leading-5 text-muted">Solo tú y la empresa vinculada podrán descargarlo. Reemplazarlo requiere volver a informar el estado.</p>
        <button className={quietButtonClass} disabled={busy}>{busy ? 'Guardando…' : 'Guardar respaldo'}</button>
      </form>
      <form className="space-y-4" onSubmit={save}>
        <label className="block text-sm font-semibold text-pine-950">Estado informado<select className={inputClass} name="status" defaultValue={proposal.academic_status}>{Object.entries(academicLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'autorizacion_informada' && !proposal.has_evidence}>{label}</option>)}</select></label>
        <label className="block text-sm font-semibold text-pine-950">Observaciones<textarea className={inputClass + ' min-h-24 resize-y'} name="note" maxLength={1500} defaultValue={proposal.academic_note ?? ''} /></label>
        <button className={buttonClass} disabled={busy}>{busy ? 'Guardando…' : 'Guardar declaración'}</button>
      </form>
    </div>
  </section>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'))
}

export function Proposals({ account, onExpire }: { account: Account; onExpire: () => void }) {
  const [items, setItems] = useState<Proposal[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const company = account.role === 'empresa'
  async function load() {
    setLoading(true)
    try { setItems(await api<Proposal[]>('/propuestas')); setError(''); window.dispatchEvent(new Event('applications-updated')) }
    catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => {
    void load()
    const refresh = () => { void load() }
    window.addEventListener('proposals-updated', refresh)
    return () => window.removeEventListener('proposals-updated', refresh)
  }, [account.email])
  async function act(id: number, action: string, status?: string) {
    setBusy(true); setError('')
    try { await api('/propuestas/' + id + '/' + action, 'POST', status ? { status } : undefined); await load() }
    catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  return <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-label="Propuestas de práctica">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">Acuerdos de práctica</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-pine-950 sm:text-3xl">Propuestas</h2></div>
      <button className={quietButtonClass} onClick={() => void load()} disabled={loading}>Actualizar <span aria-hidden="true">↻</span></button>
    </header>
    <div className="p-5 sm:p-7">
      <p className="mb-6 max-w-2xl text-sm leading-6 text-muted">Revisa condiciones, responde y mantén separada la gestión académica externa de la propuesta empresarial.</p>
      {error && <div className="mb-5"><Notice kind="error">{error}</Notice></div>}
      {loading ? <p role="status" className="py-6 text-sm text-muted">Cargando tus propuestas…</p>
        : !items.length ? <EmptyState title="Todavía no hay propuestas">Cuando una empresa te proponga una práctica, la encontrarás aquí.</EmptyState>
          : <div className="divide-y divide-stone-200">{items.map(item => <article className="py-6 first:pt-0 last:pb-0" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.12em] text-pine-700">{company ? 'Propuesta enviada' : 'Propuesta recibida'}</p><h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-pine-950">{item.offer_title}</h3><p className="mt-1 text-sm text-muted">{company ? item.student_name : item.company_name}</p></div>
              <StatusBadge value={item.status} label={responseLabels[item.status] ?? item.status} />
            </div>
            <div className="mt-5 grid gap-4 border-y border-stone-200 py-4 sm:grid-cols-3">
              <div><p className="text-xs font-semibold text-muted">Inicio</p><p className="mt-1 text-sm font-bold text-pine-950">{formatDate(item.start_date)}</p></div>
              <div><p className="text-xs font-semibold text-muted">Término</p><p className="mt-1 text-sm font-bold text-pine-950">{formatDate(item.end_date)}</p></div>
              <div><p className="text-xs font-semibold text-muted">Horas acordadas</p><p className="mt-1 text-sm font-bold text-pine-950">{item.hours} horas</p></div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.conditions}</p>
            <div className="mt-5 rounded-xl bg-canvas px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-pine-800">Gestión académica externa</p><p className="mt-1 text-sm text-stone-700">{academicLabels[item.academic_status]}. Es una declaración del estudiante, no una validación de PractiConecta.</p></div><StatusBadge value={item.academic_status} label={academicLabels[item.academic_status]} /></div>
              {item.academic_note && <p className="mt-3 border-t border-stone-200 pt-3 text-sm text-stone-700">{item.academic_note}</p>}
              {item.status === 'aceptada' && !company && <AcademicForm key={item.id + ':' + item.academic_updated_at} proposal={item} reload={load} onExpire={onExpire} />}
            </div>
            {!company && item.status === 'pendiente' && <div className="mt-5 flex flex-wrap gap-3"><button className={buttonClass} disabled={busy} onClick={() => void act(item.id, 'respuesta', 'aceptada')}>Aceptar propuesta <span aria-hidden="true">↗</span></button><button className={quietButtonClass} disabled={busy} onClick={() => void act(item.id, 'respuesta', 'rechazada')}>Rechazar</button></div>}
            {item.has_evidence && <p className="mt-4"><a className="text-sm font-bold text-pine-900 underline decoration-lime-500 underline-offset-4" href={'/api/propuestas/' + item.id + '/respaldo'}>Descargar respaldo privado ↗</a></p>}
            {company && item.status === 'aceptada' && !item.letter_issued_at && <button className={`${buttonClass} mt-5`} disabled={busy} onClick={() => void act(item.id, 'carta')}>Emitir carta empresarial <span aria-hidden="true">↗</span></button>}
            {item.letter_issued_at && <p className="mt-4"><a className="text-sm font-bold text-pine-900 underline decoration-lime-500 underline-offset-4" href={'/api/propuestas/' + item.id + '/carta'}>Descargar carta emitida por la empresa ↗</a></p>}
          </article>)}</div>}
    </div>
  </section>
}
