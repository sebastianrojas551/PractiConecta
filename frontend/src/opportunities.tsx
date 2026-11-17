import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from './api'
import type { Account } from './api'

type Offer = {
  id: number; company_id: number; company_name: string; title: string; area: string
  description: string; requirements: string; city: string | null; region: string | null
  modality: string; hours: number; vacancies: number; benefits: string | null
  deadline: string | null; status: string; created_at: string
}
type Application = {
  id: number; offer_id: number; student_id: number; message: string | null
  status: string; created_at: string; offer_title: string; company_name: string; student_name: string
}

export function Opportunities({ account, onExpire }: { account: Account; onExpire: () => void }) {
  const company = account.role === 'empresa'
  const [offers, setOffers] = useState<Offer[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)

  async function load() {
    try {
      const path = company ? '/empresa/ofertas' : '/ofertas'
      const params = !company ? new URLSearchParams({ q: search, region }) : null
      setOffers(await api<Offer[]>(path + (params && (search || region) ? '?' + params : '')))
      if (!company) setApplications(await api<Application[]>('/estudiante/postulaciones'))
      setError('')
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    }
  }
  useEffect(() => { void load() }, [account.role])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data: Record<string, string | number | null> = Object.fromEntries(form) as Record<string, string>
    data.hours = Number(data.hours)
    data.vacancies = Number(data.vacancies)
    data.deadline = data.deadline || null
    data.benefits = data.benefits || null
    data.city = data.city || null
    data.region = data.region || null
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/ofertas', 'POST', data)
      event.currentTarget.reset()
      setNotice('Oferta publicada. Ya está disponible para estudiantes.')
      await load()
    } catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function apply(id: number) {
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/ofertas/' + id + '/postulaciones', 'POST', { message: '' })
      setNotice('Postulación enviada. Puedes revisar su estado en Mis postulaciones.')
      await load()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function changeStatus(offer: Offer, status: string) {
    setBusy(true); setError('')
    try {
      await api('/ofertas/' + offer.id, 'PUT', { ...offer, status, company_name: undefined, company_id: undefined, id: undefined, created_at: undefined })
      await load()
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function listApplicants(id: number) {
    setSelected(id)
    try { setApplications(await api<Application[]>('/empresa/ofertas/' + id + '/postulaciones')) }
    catch (failure) { setError((failure as Error).message) }
  }

  async function updateApplication(id: number, status: string) {
    try { await api('/postulaciones/' + id, 'PATCH', { status }); await listApplicants(selected!) }
    catch (failure) { setError((failure as Error).message) }
  }

  async function withdraw(id: number) {
    try { await api('/postulaciones/' + id + '/retirar', 'POST'); await load() }
    catch (failure) { setError((failure as Error).message) }
  }

  return <section className="card opportunities">
    <div className="section-head"><div><p className="eyebrow">{company ? 'Espacio empresa' : 'Explora oportunidades'}</p><h1>{company ? 'Ofertas de práctica' : 'Encuentra tu práctica'}</h1></div></div>
    {error && <p className="error" role="alert">{error}</p>}{notice && <p className="success" role="status">{notice}</p>}
    {company && <form className="offer-form" onSubmit={submitOffer}>
      <h2>Publicar una oferta</h2>
      <label>Título<input name="title" required maxLength={150} placeholder="Ej. Práctica en desarrollo web" /></label>
      <label>Área<input name="area" required maxLength={150} placeholder="Tecnología, diseño, administración…" /></label>
      <label className="full">Descripción<textarea name="description" required maxLength={1500} rows={3} /></label>
      <label className="full">Requisitos<textarea name="requirements" required maxLength={1500} rows={2} /></label>
      <label>Ciudad<input name="city" maxLength={150} /></label>
      <label>Región<input name="region" maxLength={150} /></label>
      <label>Modalidad<select name="modality"><option>presencial</option><option>híbrida</option><option>remota</option></select></label>
      <label>Horas de práctica<input name="hours" type="number" min="1" required /></label>
      <label>Vacantes<input name="vacancies" type="number" min="1" defaultValue="1" required /></label>
      <label>Fecha límite<input name="deadline" type="date" /></label>
      <label className="full">Beneficios<textarea name="benefits" maxLength={1500} rows={2} /></label>
      <button disabled={busy}>{busy ? 'Publicando…' : 'Publicar oferta'}</button>
    </form>}
    {!company && <form className="filters" onSubmit={event => { event.preventDefault(); void load() }}>
      <label>Palabra clave<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cargo, área o requisito" /></label>
      <label>Región<input value={region} onChange={event => setRegion(event.target.value)} placeholder="Ej. Maule" /></label>
      <button>Buscar</button>
    </form>}
    <div className="offer-list">
      {offers.length === 0 ? <p className="empty">{company ? 'Aún no publicas ofertas.' : 'No encontramos ofertas con esos filtros.'}</p> : offers.map(offer => <article className="offer" key={offer.id}>
        <div className="offer-title"><div><h2>{offer.title}</h2><p>{company ? offer.area : offer.company_name + ' · ' + offer.area}</p></div><span className={'pill ' + offer.status}>{offer.status}</span></div>
        <p>{offer.description}</p><p className="meta">{[offer.city, offer.region, offer.modality, offer.hours + ' horas', offer.vacancies + (offer.vacancies === 1 ? ' vacante' : ' vacantes')].filter(Boolean).join(' · ')}</p>
        <details><summary>Requisitos y condiciones</summary><p>{offer.requirements}</p>{offer.benefits && <p>{offer.benefits}</p>}{offer.deadline && <p>Postulaciones hasta {offer.deadline}</p>}</details>
        {company ? <div className="actions"><button className="secondary" onClick={() => void listApplicants(offer.id)}>Ver postulaciones</button>{offer.status === 'publicada' && <button className="secondary" onClick={() => void changeStatus(offer, 'pausada')}>Pausar</button>}{offer.status === 'pausada' && <button className="secondary" onClick={() => void changeStatus(offer, 'publicada')}>Reactivar</button>}{offer.status !== 'cerrada' && <button className="secondary" onClick={() => void changeStatus(offer, 'cerrada')}>Cerrar</button>}</div> : <button disabled={busy || applications.some(item => item.offer_id === offer.id)} onClick={() => void apply(offer.id)}>{applications.some(item => item.offer_id === offer.id) ? 'Ya postulaste' : 'Postular'}</button>}
      </article>)}
    </div>
    {!company && <section className="my-applications"><h2>Mis postulaciones</h2>{applications.length ? applications.map(item => <div className="application-row" key={item.id}><div><strong>{item.offer_title}</strong><p>{item.company_name}</p></div><span className="pill">{item.status.replace('_', ' ')}</span>{['enviada','en_revision','entrevista'].includes(item.status) && <button className="text-button" onClick={() => void withdraw(item.id)}>Retirar</button>}</div>) : <p>Aún no tienes postulaciones.</p>}</section>}
    {company && selected !== null && <section className="my-applications"><div className="section-head"><h2>Postulaciones recibidas</h2><button className="secondary" onClick={() => setSelected(null)}>Cerrar</button></div>{applications.length ? applications.map(item => <div className="application-row" key={item.id}><div><strong>{item.student_name}</strong><p>{item.message || 'Sin mensaje'}</p></div><span className="pill">{item.status.replace('_', ' ')}</span><select aria-label="Estado de postulación" value={item.status} onChange={event => void updateApplication(item.id,event.target.value)}><option value={item.status}>{item.status.replace('_',' ')}</option><option value="en_revision">En revisión</option><option value="entrevista">Entrevista</option><option value="rechazada">Rechazar</option></select></div>) : <p>Aún no hay postulaciones para esta oferta.</p>}</section>}
  </section>
}
