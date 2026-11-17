import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { api, ApiError } from './api'
import type { Account } from './api'
import { ProposalForm } from './proposals'
import { Dialog, EmptyState, LoadingState, Notice, StatusBadge } from './ui'

type Offer = {
  id: number; company_id: number; company_name: string; title: string; area: string
  description: string; requirements: string; city: string | null; region: string | null
  modality: string; hours: number; vacancies: number; benefits: string | null
  deadline: string | null; status: string; created_at: string
}
type Application = {
  allowed_statuses: string[]; can_propose: boolean; can_withdraw: boolean
  id: number; offer_id: number; student_id: number; message: string | null
  status: string; created_at: string; offer_title: string; company_name: string; student_name: string
}

const inputClass = 'mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-[15px] text-pine-950 outline-none transition focus:border-pine-800 focus:ring-2 focus:ring-pine-800/15'
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-pine-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:cursor-wait disabled:opacity-50'
const quietButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-pine-900 transition hover:border-pine-800 hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:opacity-50'
const statusLabels: Record<string, string> = { enviada: 'Enviada', en_revision: 'En revisión', entrevista: 'Entrevista', rechazada: 'Rechazada', retirada: 'Retirada' }

function offerMeta(offer: Offer) {
  return [offer.city, offer.region, offer.modality, `${offer.hours} horas`, `${offer.vacancies} ${offer.vacancies === 1 ? 'vacante' : 'vacantes'}`].filter(Boolean)
}

function OfferRow({ offer, action, secondary }: { offer: Offer; action: ReactNode; secondary?: ReactNode }) {
  return <article className="offer-row group">
    <div className="offer-main">
      <div className="flex flex-wrap items-center gap-2"><span className="offer-area">{offer.area}</span>{offer.status !== 'publicada' && <StatusBadge value={offer.status} label={offer.status === 'pausada' ? 'Pausada' : 'Cerrada'} />}</div>
      <h3 className="mt-2 font-display text-[1.55rem] font-semibold leading-tight tracking-tight text-pine-950"><button className="offer-title-link" type="button" onClick={() => window.dispatchEvent(new CustomEvent('offer-details', { detail: offer.id }))}>{offer.title}</button></h3>
      <p className="mt-1 text-sm text-stone-600">{offer.company_name}</p>
      <p className="offer-description">{offer.description}</p>
      <ul className="offer-meta" aria-label="Detalles de la práctica">{offerMeta(offer).map(item => <li key={item}>{item}</li>)}</ul>
    </div>
    <div className="offer-actions">{secondary}{action}</div>
  </article>
}

function useOfferDetails(setOffer: (offer: Offer | null) => void, offers: Offer[]) {
  useEffect(() => {
    const show = (event: Event) => {
      const id = (event as CustomEvent<number>).detail
      setOffer(offers.find(item => item.id === id) ?? null)
    }
    window.addEventListener('offer-details', show)
    return () => window.removeEventListener('offer-details', show)
  }, [offers, setOffer])
}

export function FeaturedOffers({ account }: { account: Account | null }) {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<Offer | null>(null)
  useOfferDetails(setDetail, offers)
  useEffect(() => {
    let active = true
    api<Offer[]>('/ofertas').then(items => { if (active) { setOffers(items.slice(0, 3)); setError('') } })
      .catch(failure => { if (active) setError((failure as Error).message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <>
    {error && <Notice kind="error">{error}</Notice>}
    {loading ? <LoadingState label="Buscando oportunidades…" /> : offers.length
      ? <div className="offer-list">{offers.map(offer => <OfferRow key={offer.id} offer={offer}
        secondary={<button className={quietButtonClass} onClick={() => setDetail(offer)}>Ver detalles</button>}
        action={account?.role === 'estudiante'
          ? <Link className={buttonClass} to="/estudiante#oportunidades">Postular <span aria-hidden="true">↗</span></Link>
          : account?.role === 'empresa'
            ? <Link className={buttonClass} to="/empresa#oportunidades">Gestionar ofertas <span aria-hidden="true">↗</span></Link>
            : <Link className={buttonClass} to="/ingresar" state={{ from: { pathname: '/ofertas' } }}>Ingresar para postular <span aria-hidden="true">↗</span></Link>} />)}</div>
      : <EmptyState title="Aún no hay oportunidades publicadas">Las nuevas ofertas aparecerán aquí cuando una empresa las publique.</EmptyState>}
    <Dialog open={!!detail} title={detail?.title ?? 'Detalle de práctica'} onClose={() => setDetail(null)}>
      {detail && <OfferDetails offer={detail} account={account} onApply={() => navigate('/ingresar', { state: { from: { pathname: '/ofertas' } } })} />}
    </Dialog>
  </>
}

function OfferDetails({ offer, account, onApply }: { offer: Offer; account: Account | null; onApply: () => void }) {
  return <div className="space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">{offer.area} · {offer.company_name}</p><h3 className="mt-2 font-display text-3xl font-semibold leading-tight text-pine-950">{offer.title}</h3></div>
    <p className="text-sm leading-6 text-stone-700">{offer.description}</p>
    <div className="grid gap-3 border-y border-stone-200 py-4 sm:grid-cols-2"><div><p className="text-xs text-muted">Ubicación y modalidad</p><p className="mt-1 text-sm font-semibold text-pine-950">{[offer.city, offer.region, offer.modality].filter(Boolean).join(' · ')}</p></div><div><p className="text-xs text-muted">Duración y vacantes</p><p className="mt-1 text-sm font-semibold text-pine-950">{offer.hours} horas · {offer.vacancies} {offer.vacancies === 1 ? 'vacante' : 'vacantes'}</p></div></div>
    <div><h4 className="text-sm font-bold text-pine-950">Requisitos</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{offer.requirements}</p></div>
    {offer.benefits && <div><h4 className="text-sm font-bold text-pine-950">Beneficios</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{offer.benefits}</p></div>}
    {offer.deadline && <p className="border-l-2 border-lime-500 pl-3 text-sm text-muted">Postulaciones hasta el {offer.deadline} inclusive (hora de Santiago).</p>}
    {account?.role === 'estudiante'
      ? <Link className={buttonClass} to="/estudiante#oportunidades">Ir a postular <span aria-hidden="true">↗</span></Link>
      : <button className={buttonClass} onClick={onApply}>Ingresar para postular <span aria-hidden="true">↗</span></button>}
  </div>
}

export function Opportunities({ account, onExpire }: { account: Account | null; onExpire: () => void }) {
  const company = account?.role === 'empresa'
  const student = account?.role === 'estudiante'
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [offers, setOffers] = useState<Offer[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [region, setRegion] = useState(params.get('region') ?? '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<number | null>(null)
  const [selected, setSelected] = useState<Offer | null>(null)
  const [detail, setDetail] = useState<Offer | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<Offer | null>(null)
  useOfferDetails(setSelectedDetail, offers)

  async function load(nextSearch = search, nextRegion = region) {
    setLoading(true)
    try {
      const path = company ? '/empresa/ofertas' : '/ofertas'
      const query = !company ? new URLSearchParams({ q: nextSearch, region: nextRegion }) : null
      setOffers(await api<Offer[]>(path + (query && (nextSearch || nextRegion) ? '?' + query : '')))
      if (student) setApplications(await api<Application[]>('/estudiante/postulaciones'))
      else setApplications([])
      setError('')
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    } finally { setLoading(false) }
  }
  useEffect(() => { void load(params.get('q') ?? '', params.get('region') ?? '') }, [account?.email, account?.role])
  useEffect(() => {
    const refresh = () => { void load(); if (company && selected) void listApplicants(selected) }
    window.addEventListener('applications-updated', refresh)
    return () => window.removeEventListener('applications-updated', refresh)
  }, [account?.email, search, region, selected])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    const form = new FormData(element)
    const data: Record<string, string | number | null> = Object.fromEntries(form) as Record<string, string>
    data.hours = Number(data.hours); data.vacancies = Number(data.vacancies)
    data.deadline = data.deadline || null; data.benefits = data.benefits || null
    data.city = data.city || null; data.region = data.region || null
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/ofertas', 'POST', data)
      element.reset(); setNotice('La oferta se publicó y ya puede ser encontrada por estudiantes.')
      await load()
    } catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function apply(id: number) {
    if (!account) { navigate('/ingresar', { state: { from: location } }); return }
    setBusy(true); setError(''); setNotice('')
    try { await api('/ofertas/' + id + '/postulaciones', 'POST', { message: '' }); setNotice('Postulación enviada. Puedes revisar su estado en tu espacio.'); await load() }
    catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function changeStatus(offer: Offer, status: string) {
    setBusy(true); setError('')
    try {
      await api('/ofertas/' + offer.id, 'PUT', { ...offer, status, company_name: undefined, company_id: undefined, id: undefined, created_at: undefined })
      await load()
    } catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
    finally { setBusy(false) }
  }

  async function listApplicants(offer: Offer) {
    setSelected(offer); setError('')
    try { setApplications(await api<Application[]>('/empresa/ofertas/' + offer.id + '/postulaciones')) }
    catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
  }

  async function updateApplication(id: number, status: string) {
    try { await api('/postulaciones/' + id, 'PATCH', { status }); if (selected) await listApplicants(selected) }
    catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
  }

  async function withdraw(id: number) {
    try { await api('/postulaciones/' + id + '/retirar', 'POST'); setNotice('Retiraste tu postulación.'); await load() }
    catch (failure) { if (failure instanceof ApiError && failure.status === 401) onExpire(); else setError((failure as Error).message) }
  }

  async function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (search.trim()) next.set('q', search.trim())
    if (region.trim()) next.set('region', region.trim())
    setParams(next, { replace: true })
    await load(search.trim(), region.trim())
  }

  return <>
    <section className="catalog-content" aria-labelledby="catalog-title">
      <header className="catalog-intro">
        <p className="eyebrow"><span className="eyebrow-line" />{company ? 'Tu espacio de selección' : 'Oportunidades de práctica'}</p>
        <div className="flex flex-wrap items-end justify-between gap-5"><div><h1 id="catalog-title" className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-pine-950 sm:text-5xl">{company ? 'Tus oportunidades.' : 'Encuentra tu lugar.'}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">{company ? 'Publica vacantes, consulta postulaciones y acompaña el proceso.' : 'Explora ofertas reales publicadas por empresas y revisa sus condiciones.'}</p></div>{!account && <p className="rounded-full bg-lime-100 px-4 py-2 text-xs font-bold text-pine-950">Puedes explorar sin iniciar sesión</p>}</div>
      </header>

      {error && <Notice kind="error">{error}</Notice>}{notice && <Notice kind="success">{notice}</Notice>}
      {company && <form className="publish-form" onSubmit={submitOffer}>
        <div className="publish-heading"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">Nueva oportunidad</p><h2 className="mt-1 font-display text-2xl font-semibold text-pine-950">Publicar una práctica</h2></div><span className="text-xs text-muted">Los campos marcados son obligatorios</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">Título<input className={inputClass} name="title" required maxLength={150} placeholder="Ej. Práctica en desarrollo web" /></label>
          <label className="form-label">Área<input className={inputClass} name="area" required maxLength={150} placeholder="Tecnología, diseño, administración…" /></label>
          <label className="form-label sm:col-span-2">Descripción<textarea className={inputClass + ' min-h-24 resize-y'} name="description" required maxLength={1500} rows={3} /></label>
          <label className="form-label sm:col-span-2">Requisitos<textarea className={inputClass + ' min-h-20 resize-y'} name="requirements" required maxLength={1500} rows={2} /></label>
          <label className="form-label">Ciudad<input className={inputClass} name="city" maxLength={150} /></label>
          <label className="form-label">Región<input className={inputClass} name="region" maxLength={150} /></label>
          <label className="form-label">Modalidad<select className={inputClass} name="modality"><option>presencial</option><option>híbrida</option><option>remota</option></select></label>
          <label className="form-label">Horas de práctica<input className={inputClass} name="hours" type="number" min="1" required /></label>
          <label className="form-label">Vacantes<input className={inputClass} name="vacancies" type="number" min="1" defaultValue="1" required /></label>
          <label className="form-label">Fecha límite<input className={inputClass} name="deadline" type="date" /></label>
          <label className="form-label sm:col-span-2">Beneficios<textarea className={inputClass + ' min-h-20 resize-y'} name="benefits" maxLength={1500} rows={2} /></label>
        </div>
        <button className={buttonClass} disabled={busy}>{busy ? 'Publicando…' : 'Publicar oferta'} <span aria-hidden="true">↗</span></button>
      </form>}

      {!company && <form className="catalog-filters" onSubmit={filter} role="search">
        <label className="form-label">Palabra clave<input className={inputClass} value={search} onChange={event => setSearch(event.target.value)} placeholder="Cargo, área o requisito" /></label>
        <label className="form-label">Región<input className={inputClass} value={region} onChange={event => setRegion(event.target.value)} placeholder="Ej. Maule" /></label>
        <button className={buttonClass}>Buscar <span aria-hidden="true">↗</span></button>
      </form>}

      <div className="catalog-results-head"><span>{loading ? 'Buscando…' : `${offers.length} ${offers.length === 1 ? 'oportunidad' : 'oportunidades'}`}</span>{(search || region) && <button className="text-sm font-bold text-pine-800 underline underline-offset-4" onClick={() => { setSearch(''); setRegion(''); setParams({}); void load('', '') }}>Limpiar filtros</button>}</div>
      {loading ? <LoadingState label="Cargando ofertas…" /> : offers.length ? <div className="offer-list">{offers.map(offer => <OfferRow key={offer.id} offer={offer}
        secondary={company
          ? <button className={quietButtonClass} disabled={busy} onClick={() => void listApplicants(offer)}>Ver postulaciones <span aria-hidden="true">↗</span></button>
          : <button className={quietButtonClass} onClick={() => setDetail(offer)}>Ver detalles <span aria-hidden="true">↗</span></button>}
        action={company
          ? <div className="flex flex-wrap gap-2">{offer.status === 'publicada' && <button className={quietButtonClass} disabled={busy} onClick={() => void changeStatus(offer, 'pausada')}>Pausar</button>}{offer.status === 'pausada' && <button className={quietButtonClass} disabled={busy} onClick={() => void changeStatus(offer, 'publicada')}>Reactivar</button>}{offer.status !== 'cerrada' && <button className="text-sm font-bold text-stone-500 underline underline-offset-4" disabled={busy} onClick={() => void changeStatus(offer, 'cerrada')}>Cerrar oferta</button>}</div>
          : student
            ? <button className={buttonClass} disabled={busy || applications.some(item => item.offer_id === offer.id)} onClick={() => void apply(offer.id)}>{applications.some(item => item.offer_id === offer.id) ? 'Ya postulaste' : 'Postular'} <span aria-hidden="true">↗</span></button>
            : <button className={buttonClass} onClick={() => navigate('/ingresar', { state: { from: location } })}>Ingresar para postular <span aria-hidden="true">↗</span></button>} />)}</div>
        : <EmptyState title={company ? 'Aún no publicas ofertas.' : 'No encontramos prácticas con esos filtros.'}>{company ? 'Cuando publiques una oportunidad, aparecerá en tu catálogo.' : 'Prueba con otra palabra o región, o vuelve a revisar más adelante.'}</EmptyState>}

      {student && <section className="applications-section" aria-labelledby="applications-title"><div className="applications-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Tu actividad</p><h2 id="applications-title" className="font-display text-2xl font-semibold text-pine-950">Mis postulaciones</h2></div><Link className="arrow-link" to="/propuestas">Ver propuestas <span aria-hidden="true">→</span></Link></div>
        {applications.length ? <div className="divide-y divide-stone-200">{applications.map(item => <div className="application-row" key={item.id}><div><p className="font-semibold text-pine-950">{item.offer_title}</p><p className="mt-1 text-sm text-muted">{item.company_name}</p></div><StatusBadge value={item.status} label={statusLabels[item.status] ?? item.status} />{item.can_withdraw && <button className="text-sm font-bold text-stone-600 underline underline-offset-4" onClick={() => void withdraw(item.id)}>Retirar</button>}</div>)}</div>
          : <EmptyState title="Todavía no has postulado">Cuando encuentres una oportunidad, envía tu postulación y sigue aquí su estado.</EmptyState>}</section>}
    </section>

    <Dialog open={!!detail} title={detail?.title ?? 'Detalle de práctica'} onClose={() => setDetail(null)}>{detail && <OfferDetails offer={detail} account={account} onApply={() => void apply(detail.id)} />}</Dialog>
    <Dialog open={!!selected} title="Postulaciones recibidas" onClose={() => setSelected(null)}>
      {selected && <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">{selected.title}</p><h3 className="mt-2 font-display text-2xl font-semibold text-pine-950">Candidaturas</h3></div>
        {applications.length ? <div className="divide-y divide-stone-200">{applications.map(item => <article className="space-y-4 py-5 first:pt-0 last:pb-0" key={item.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-pine-950">{item.student_name}</p><p className="mt-1 text-sm text-muted">{item.message || 'Sin mensaje adicional'}</p></div><StatusBadge value={item.status} label={statusLabels[item.status] ?? item.status} /></div><div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor={`status-${item.id}`}>Estado de postulación de {item.student_name}</label><select id={`status-${item.id}`} className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm" disabled={!item.allowed_statuses.length} value={item.status} onChange={event => void updateApplication(item.id, event.target.value)}><option value={item.status}>{statusLabels[item.status] ?? item.status}</option>{item.allowed_statuses.map(status => <option key={status} value={status}>{statusLabels[status] ?? status}</option>)}</select>{item.can_propose && <button className={buttonClass} onClick={() => setProposing(item.id)}>Preparar propuesta <span aria-hidden="true">↗</span></button>}</div></article>)}</div>
          : <EmptyState title="Aún no hay postulaciones">Las nuevas candidaturas aparecerán aquí.</EmptyState>}</div>}
    </Dialog>
    <Dialog open={proposing !== null} title="Presentar propuesta de práctica" onClose={() => setProposing(null)}>
      {proposing !== null && <ProposalForm applicationId={proposing} onClose={() => setProposing(null)} onExpire={onExpire} onCreated={() => { setProposing(null); if (selected) void listApplicants(selected); window.dispatchEvent(new Event('proposals-updated')) }} />}
    </Dialog>
  </>
}
