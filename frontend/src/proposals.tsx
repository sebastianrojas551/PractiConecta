import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from './api'
import type { Account } from './api'

type Proposal = {
  id: number; application_id: number; offer_title: string; company_name: string; representative: string
  student_name: string; start_date: string; end_date: string; hours: number; conditions: string
  status: string; responded_at: string | null; academic_status: string; academic_note: string | null
  academic_updated_at: string | null; has_evidence: boolean; letter_issued_at: string | null
}
const academicLabels: Record<string, string> = {
  pendiente: 'Pendiente de gestionar', en_tramite: 'En trámite', autorizacion_informada: 'Autorización externa informada por estudiante',
  no_requerida: 'No requerida según declaración del estudiante', denegada: 'Denegada según declaración del estudiante',
}

export function ProposalForm({ applicationId, onClose, onCreated }: { applicationId: number; onClose: () => void; onCreated: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true); setError('')
    try {
      await api('/postulaciones/' + applicationId + '/propuesta', 'POST', { ...fields, hours: Number(fields.hours) })
      onCreated()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="card" aria-label="Preparar propuesta">
    <h2>Propuesta de práctica</h2>
    <p>Las condiciones se guardarán para que el estudiante pueda aceptarlas o rechazarlas. Completa antes la razón social y el RUT en Mi perfil.</p>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <label>Fecha de inicio<input name="start_date" type="date" required /></label>
      <label>Fecha de término<input name="end_date" type="date" required /></label>
      <label>Horas acordadas<input name="hours" type="number" min="1" max="2147483647" required /></label>
      <label>Condiciones de la propuesta<textarea name="conditions" rows={4} maxLength={1500} required placeholder="Funciones, horario, lugar, modalidad y beneficios acordados" /></label>
      <p>Esta propuesta empresarial no equivale a una autorización académica.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <button>{busy ? 'Enviando…' : 'Enviar propuesta'}</button>
      <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
    </fieldset></form>
  </section>
}

function AcademicForm({ proposal, reload }: { proposal: Proposal; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true); setError('')
    try {
      await api('/propuestas/' + proposal.id + '/autorizacion', 'PUT', { status: fields.status, note: fields.note || null })
      await reload()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('evidence') as File
    if (!file?.size || file.size > 2 * 1024 * 1024) { setError('Selecciona un PDF de hasta 2 MiB.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/propuestas/' + proposal.id + '/respaldo', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/pdf' }, body: file })
      if (!response.ok) throw new Error((await response.json()).detail || 'No se pudo guardar el respaldo.')
      await reload()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <div>
    <h3>Autorización académica externa</h3>
    <p>Informa lo gestionado con tu institución. PractiConecta registra tu declaración y no verifica ni emite una aprobación oficial.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <form onSubmit={upload}><fieldset disabled={busy}>
      <label>Respaldo privado (PDF, máximo 2 MiB)<input name="evidence" type="file" accept="application/pdf,.pdf" required /></label>
      <p>Solo tú y la empresa de esta propuesta podrán descargarlo. Reemplazarlo requiere volver a informar la autorización.</p>
      <button>Guardar respaldo</button>
    </fieldset></form>
    <form onSubmit={save}><fieldset disabled={busy}>
      <label>Estado informado<select name="status" defaultValue={proposal.academic_status}>{Object.entries(academicLabels).map(([value, label]) => <option key={value} value={value} disabled={value === 'autorizacion_informada' && !proposal.has_evidence}>{label}</option>)}</select></label>
      <label>Observaciones sobre autorización<textarea name="note" maxLength={1500} defaultValue={proposal.academic_note ?? ''} /></label>
      <button>Guardar declaración</button>
    </fieldset></form>
  </div>
}

export function Proposals({ account }: { account: Account }) {
  const [items, setItems] = useState<Proposal[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const company = account.role === 'empresa'
  async function load() {
    try { setItems(await api<Proposal[]>('/propuestas')); setError(''); window.dispatchEvent(new Event('applications-updated')) }
    catch (failure) { setError((failure as Error).message) }
  }
  useEffect(() => {
    void load()
    const refresh = () => { void load() }
    window.addEventListener('proposals-updated', refresh)
    return () => window.removeEventListener('proposals-updated', refresh)
  }, [account.email])
  async function act(id: number, action: string, status?: string) {
    setBusy(true); setError('')
    try {
      await api('/propuestas/' + id + '/' + action, 'POST', status ? { status } : undefined)
      await load()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="card" aria-label="Propuestas de práctica">
    <div className="section-head"><h1>Propuestas de práctica</h1><button className="secondary" onClick={() => void load()}>Actualizar propuestas</button></div>
    {error && <p role="alert" className="error">{error}</p>}
    {!items.length && <p>Aún no tienes propuestas. La empresa puede prepararlas desde las postulaciones recibidas.</p>}
    {items.map(item => <article className="offer" key={item.id}>
      <h2>{item.offer_title}</h2><p>{item.company_name} · {item.student_name}</p>
      <p>Desde {item.start_date} hasta {item.end_date} · {item.hours} horas</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{item.conditions}</p>
      <p>Respuesta del estudiante: <strong>{item.status}</strong>{item.responded_at && ' · ' + new Date(item.responded_at).toLocaleString('es-CL')}</p>
      <p>Autorización académica: {academicLabels[item.academic_status]}. Declaración del estudiante, no validada por PractiConecta.</p>
      {item.academic_note && <p>{item.academic_note}</p>}
      {!company && item.status === 'pendiente' && <div className="actions"><button disabled={busy} onClick={() => void act(item.id, 'respuesta', 'aceptada')}>Aceptar propuesta</button><button disabled={busy} className="secondary" onClick={() => void act(item.id, 'respuesta', 'rechazada')}>Rechazar propuesta</button></div>}
      {item.status === 'aceptada' && !company && <AcademicForm key={item.id + ':' + item.academic_updated_at} proposal={item} reload={load} />}
      {item.has_evidence && <p><a href={'/api/propuestas/' + item.id + '/respaldo'}>Descargar respaldo privado</a></p>}
      {company && item.status === 'aceptada' && !item.letter_issued_at && <button disabled={busy} onClick={() => void act(item.id, 'carta')}>Emitir carta empresarial</button>}
      {item.letter_issued_at && <p><a href={'/api/propuestas/' + item.id + '/carta'}>Descargar carta empresarial (HTML imprimible)</a></p>}
    </article>)}
  </section>
}
