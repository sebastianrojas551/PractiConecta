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
  deadline: string | null; cv_required: boolean; cover_letter_required: boolean
  additional_requirements: string[]; status: string; created_at: string
}
type ApplicationDocument = { id: number; kind: 'cv' | 'carta_presentacion' | 'adicional'; label: string; filename: string; size: number; version: number; is_current: boolean; created_at: string }
type Application = {
  allowed_statuses: string[]; can_propose: boolean; can_withdraw: boolean
  id: number; offer_id: number; student_id: number; message: string | null
  cover_letter_text: string | null; profile_snapshot: Record<string, string | number | null>; documents: ApplicationDocument[]
  status: string; created_at: string; offer_title: string; company_name: string; student_name: string
}
type ApplicationDraft = { profile: Record<string, string | number | null>; cv: File | null; letterPdf: File | null; letterText: string; additional: { label: string; file: File }[] }

const inputClass = 'mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-[15px] text-pine-950 outline-none transition focus:border-pine-800 focus:ring-2 focus:ring-pine-800/15'
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-pine-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:cursor-wait disabled:opacity-50'
const quietButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-pine-900 transition hover:border-pine-800 hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:opacity-50'
const statusLabels: Record<string, string> = { enviada: 'Enviada', en_revision: 'En revisión', entrevista: 'Entrevista', rechazada: 'Rechazada', retirada: 'Retirada' }
const profileLabels: Record<string, string> = { nombre: 'Nombre', carrera: 'Carrera', institucion: 'Institución', nivel: 'Nivel o semestre', habilidades: 'Habilidades', modalidad: 'Modalidad preferida', areas_interes: 'Áreas de interés', horas_objetivo: 'Horas requeridas' }

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
      <p className="mt-3 text-xs leading-5 text-stone-600"><span className="font-bold text-pine-900">Antecedentes:</span> {applicationRequirements(offer).join(' · ')}</p>
    </div>
    <div className="offer-actions">{secondary}{action}</div>
  </article>
}

function applicationRequirements(offer: Offer) {
  return [
    offer.cv_required ? 'CV PDF (requerido)' : 'CV PDF (opcional)',
    offer.cover_letter_required ? 'Carta de presentación (requerida)' : 'Carta de presentación (opcional)',
    ...(offer.additional_requirements ?? []).map(item => `${item} (requerido)`),
  ]
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
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4"><h4 className="text-sm font-bold text-pine-950">Antecedentes para postular</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone-700">{applicationRequirements(offer).map(item => <li key={item}>{item}</li>)}</ul><p className="mt-3 text-xs leading-5 text-muted">No se exige autorización académica ni documento de seguro escolar en esta postulación inicial. Si corresponde, se gestiona por separado al formalizar la práctica.</p></div>
    {offer.benefits && <div><h4 className="text-sm font-bold text-pine-950">Beneficios</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{offer.benefits}</p></div>}
    {offer.deadline && <p className="border-l-2 border-lime-500 pl-3 text-sm text-muted">Postulaciones hasta el {offer.deadline} inclusive (hora de Santiago).</p>}
    {account?.role === 'estudiante'
      ? <button className={buttonClass} type="button" onClick={onApply}>Iniciar postulación <span aria-hidden="true">↗</span></button>
      : account?.role === 'empresa'
        ? <Link className={quietButtonClass} to="/empresa#oportunidades">Volver a mis ofertas</Link>
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
  const [modality, setModality] = useState(params.get('modality') ?? '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState<number | null>(null)
  const [selected, setSelected] = useState<Offer | null>(null)
  const [detail, setDetail] = useState<Offer | null>(null)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [applying, setApplying] = useState<Offer | null>(null)
  const [applicationProfile, setApplicationProfile] = useState<Record<string, string | number | null> | null>(null)
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null)
  const [applicationReview, setApplicationReview] = useState(false)
  useOfferDetails(setDetail, offers)

  async function load(nextSearch = search, nextRegion = region, nextModality = modality) {
    setLoading(true)
    try {
      const path = company ? '/empresa/ofertas' : '/ofertas'
      const query = new URLSearchParams()
      if (nextSearch.trim()) query.set('q', nextSearch.trim())
      if (nextRegion.trim()) query.set('region', nextRegion.trim())
      if (nextModality) query.set('modality', nextModality)
      setOffers(await api<Offer[]>(path + (!company && query.size ? '?' + query : '')))
      if (student) setApplications(await api<Application[]>('/estudiante/postulaciones'))
      else setApplications([])
      setError('')
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    } finally { setLoading(false) }
  }
  useEffect(() => {
    const nextSearch = params.get('q') ?? ''
    const nextRegion = params.get('region') ?? ''
    const nextModality = params.get('modality') ?? ''
    setSearch(nextSearch); setRegion(nextRegion); setModality(nextModality)
    void load(nextSearch, nextRegion, nextModality)
  }, [account?.email, account?.role, params])
  useEffect(() => {
    const refresh = () => { void load(); if (company && selected) void listApplicants(selected) }
    window.addEventListener('applications-updated', refresh)
    return () => window.removeEventListener('applications-updated', refresh)
  }, [account?.email, search, region, selected])

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const element = event.currentTarget
    const form = new FormData(element)
    const data: Record<string, unknown> = Object.fromEntries(form) as Record<string, string>
    data.hours = Number(data.hours); data.vacancies = Number(data.vacancies)
    data.cv_required = form.get('cv_required') === 'on'
    data.cover_letter_required = form.get('cover_letter_required') === 'on'
    data.additional_requirements = String(form.get('additional_requirements') ?? '').split(/\r?\n/).map(item => item.trim()).filter(Boolean)
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

  async function updateOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, FormDataEntryValue>
    const payload = {
      title: String(values.title).trim(), area: String(values.area).trim(),
      description: String(values.description).trim(), requirements: String(values.requirements).trim(),
      city: String(values.city).trim() || null, region: String(values.region).trim() || null,
      modality: String(values.modality), hours: Number(values.hours), vacancies: Number(values.vacancies),
      benefits: String(values.benefits).trim() || null, deadline: String(values.deadline) || null,
      cv_required: values.cv_required === 'on', cover_letter_required: values.cover_letter_required === 'on',
      additional_requirements: String(values.additional_requirements ?? '').split(/\r?\n/).map(item => item.trim()).filter(Boolean),
      status: editing.status,
    }
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/ofertas/' + editing.id, 'PUT', payload)
      setNotice('Los cambios de la oferta se guardaron.')
      setEditing(null)
      await load()
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    } finally { setBusy(false) }
  }

  async function openApplication(offer: Offer) {
    if (!account) { navigate('/ingresar', { state: { from: location } }); return }
    if (account.role !== 'estudiante') return
    setError(''); setNotice(''); setApplicationDraft(null); setApplicationReview(false)
    try {
      setApplicationProfile(await api<Record<string, string | number | null>>('/perfil/estudiante'))
      setApplying(offer)
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    }
  }

  function reviewApplication(event: FormEvent<HTMLFormElement>) {
    if (!applying || !applicationProfile) return
    const form = new FormData(event.currentTarget)
    const picked = (name: string) => {
      const value = form.get(name)
      return value instanceof File && value.size ? value : null
    }
    const cv = picked('cv')
    const letterPdf = picked('cover_letter_pdf')
    const letterText = String(form.get('cover_letter_text') ?? '').trim()
    const additional = applying.additional_requirements.map((label, index) => ({ label, file: picked(`additional_${index}`) })).filter((item): item is { label: string; file: File } => item.file !== null)
    const allFiles = [cv, letterPdf, ...additional.map(item => item.file)].filter((item): item is File => item !== null)
    if (applying.cv_required && !cv) { setError('Adjunta el CV en PDF solicitado por esta oferta.'); return }
    if (applying.cover_letter_required && !letterPdf && !letterText) { setError('Escribe o adjunta la carta de presentación solicitada.'); return }
    if (letterPdf && letterText) { setError('Elige una carta redactada o un PDF, no ambos.'); return }
    if (additional.length !== applying.additional_requirements.length) { setError('Adjunta cada antecedente adicional solicitado por la oferta.'); return }
    if (letterText.length > 5000) { setError('La carta de presentación puede tener hasta 5.000 caracteres.'); return }
    if (allFiles.some(file => file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf'))) { setError('Adjunta los antecedentes en formato PDF.'); return }
    if (allFiles.some(file => file.size > 5 * 1024 * 1024)) { setError('Cada documento puede pesar hasta 5 MiB.'); return }
    if (allFiles.reduce((total, file) => total + file.size, 0) > 20 * 1024 * 1024) { setError('El total de documentos puede pesar hasta 20 MiB.'); return }
    setApplicationDraft({ profile: applicationProfile, cv, letterPdf, letterText, additional })
    setError(''); setApplicationReview(true)
  }

  async function confirmApplication() {
    if (!applying || !applicationDraft) return
    const body = new FormData()
    body.set('profile_snapshot', JSON.stringify(applicationDraft.profile))
    if (applicationDraft.cv) body.set('cv', applicationDraft.cv)
    if (applicationDraft.letterPdf) body.set('cover_letter_pdf', applicationDraft.letterPdf)
    if (applicationDraft.letterText) body.set('cover_letter_text', applicationDraft.letterText)
    for (const item of applicationDraft.additional) {
      body.append('additional_labels', item.label)
      body.append('additional_files', item.file)
    }
    setBusy(true); setError('')
    try {
      await api('/ofertas/' + applying.id + '/postulaciones', 'POST', body)
      setApplying(null); setApplicationDraft(null); setApplicationReview(false)
      setNotice('Postulación enviada con los antecedentes revisados. Puedes consultar los documentos y el estado en tu espacio.')
      await load()
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    } finally { setBusy(false) }
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
    if (modality) next.set('modality', modality)
    setParams(next, { replace: true })
  }

  function clearFilters() {
    setSearch(''); setRegion(''); setModality('')
    setParams({}, { replace: true })
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
          <label className="form-label">Modalidad<select className={inputClass} name="modality"><option value="presencial">Presencial</option><option value="híbrida">Híbrida</option><option value="remota">Remota</option></select></label>
          <label className="form-label">Horas de práctica<input className={inputClass} name="hours" type="number" min="1" required /></label>
          <label className="form-label">Vacantes<input className={inputClass} name="vacancies" type="number" min="1" defaultValue="1" required /></label>
          <label className="form-label">Fecha límite<input className={inputClass} name="deadline" type="date" /></label>
          <label className="form-label sm:col-span-2">Beneficios<textarea className={inputClass + ' min-h-20 resize-y'} name="benefits" maxLength={1500} rows={2} /></label>
          <fieldset className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:col-span-2"><legend className="px-1 text-sm font-bold text-pine-950">Antecedentes para postular</legend>
            <label className="flex items-start gap-3 text-sm text-stone-700"><input className="mt-1 accent-pine-900" type="checkbox" name="cv_required" defaultChecked /><span><strong className="text-pine-950">Solicitar CV en PDF</strong><br /><span className="text-xs text-muted">El CV es obligatorio para postular a esta oferta.</span></span></label>
            <label className="flex items-start gap-3 text-sm text-stone-700"><input className="mt-1 accent-pine-900" type="checkbox" name="cover_letter_required" /><span><strong className="text-pine-950">Solicitar carta de presentación</strong><br /><span className="text-xs text-muted">La persona puede redactarla en la plataforma o adjuntar un PDF.</span></span></label>
            <label className="form-label">Otros antecedentes pertinentes<textarea className={inputClass + ' min-h-20 resize-y'} name="additional_requirements" maxLength={600} rows={3} placeholder={'Un antecedente por línea, máximo 5. Ej.: Portafolio'} /><span className="mt-1 text-xs font-normal leading-5 text-muted">Cada antecedente indicado será requerido. No solicites datos personales innecesarios. Autorización académica y seguro escolar se gestionan por separado al formalizar la práctica.</span></label>
          </fieldset>
        </div>
        <button className={buttonClass} disabled={busy}>{busy ? 'Publicando…' : 'Publicar oferta'} <span aria-hidden="true">↗</span></button>
      </form>}

      {!company && <form className="catalog-filters" onSubmit={filter} role="search">
        <label className="form-label">Palabra clave<input className={inputClass} value={search} onChange={event => setSearch(event.target.value)} placeholder="Cargo, área o requisito" /></label>
        <label className="form-label">Región<input className={inputClass} value={region} onChange={event => setRegion(event.target.value)} placeholder="Ej. Maule" /></label>
        <label className="form-label">Modalidad<select className={inputClass} value={modality} onChange={event => setModality(event.target.value)}><option value="">Todas las modalidades</option><option value="presencial">Presencial</option><option value="híbrida">Híbrida</option><option value="remota">Remota</option></select></label>
        <button className={buttonClass}>Buscar <span aria-hidden="true">↗</span></button>
      </form>}

      <div className="catalog-results-head"><span>{loading ? 'Buscando…' : `${offers.length} ${offers.length === 1 ? 'oportunidad' : 'oportunidades'}`}</span>{(search || region || modality) && <button className="text-sm font-bold text-pine-800 underline underline-offset-4" onClick={clearFilters}>Limpiar filtros</button>}</div>
      {loading ? <LoadingState label="Cargando ofertas…" /> : offers.length ? <div className="offer-list">{offers.map(offer => <OfferRow key={offer.id} offer={offer}
        secondary={company
          ? <button className={quietButtonClass} disabled={busy} onClick={() => void listApplicants(offer)}>Ver postulaciones <span aria-hidden="true">↗</span></button>
          : <button className={quietButtonClass} onClick={() => setDetail(offer)}>Ver detalles <span aria-hidden="true">↗</span></button>}
        action={company
          ? <div className="flex flex-wrap gap-2"><button className={quietButtonClass} disabled={busy} onClick={() => setEditing(offer)}>Editar oferta</button>{offer.status === 'publicada' && <button className={quietButtonClass} disabled={busy} onClick={() => void changeStatus(offer, 'pausada')}>Pausar</button>}{offer.status === 'pausada' && <button className={quietButtonClass} disabled={busy} onClick={() => void changeStatus(offer, 'publicada')}>Reactivar</button>}{offer.status !== 'cerrada' && <button className="text-sm font-bold text-stone-500 underline underline-offset-4" disabled={busy} onClick={() => void changeStatus(offer, 'cerrada')}>Cerrar oferta</button>}</div>
          : student
            ? <button className={buttonClass} disabled={busy || applications.some(item => item.offer_id === offer.id)} onClick={() => void openApplication(offer)}>{applications.some(item => item.offer_id === offer.id) ? 'Ya postulaste' : 'Postular'} <span aria-hidden="true">↗</span></button>
            : <button className={buttonClass} onClick={() => navigate('/ingresar', { state: { from: location } })}>Ingresar para postular <span aria-hidden="true">↗</span></button>} />)}</div>
        : <EmptyState title={company ? 'Aún no publicas ofertas.' : 'No encontramos prácticas con esos filtros.'}>{company ? 'Cuando publiques una oportunidad, aparecerá en tu catálogo.' : 'Prueba con otra palabra o región, o vuelve a revisar más adelante.'}</EmptyState>}

      {student && <section className="applications-section" aria-labelledby="applications-title"><div className="applications-heading"><div><p className="eyebrow"><span className="eyebrow-line" />Tu actividad</p><h2 id="applications-title" className="font-display text-2xl font-semibold text-pine-950">Mis postulaciones</h2></div><Link className="arrow-link" to="/propuestas">Ver propuestas <span aria-hidden="true">→</span></Link></div>
        {applications.length ? <div className="divide-y divide-stone-200">{applications.map(item => <article className="space-y-3 py-5 first:pt-0" key={item.id}><div className="application-row"><div><p className="font-semibold text-pine-950">{item.offer_title}</p><p className="mt-1 text-sm text-muted">{item.company_name}</p></div><StatusBadge value={item.status} label={statusLabels[item.status] ?? item.status} />{item.can_withdraw && <button className="text-sm font-bold text-stone-600 underline underline-offset-4" onClick={() => void withdraw(item.id)}>Retirar</button>}</div>
          {item.cover_letter_text && <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.cover_letter_text}</p>}
          <details className="rounded-lg border border-stone-200 bg-white px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-pine-900">Antecedentes enviados</summary><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(item.profile_snapshot ?? {}).filter(([, value]) => value !== null && value !== '').map(([key, value]) => <div key={key}><dt className="text-xs text-muted">{profileLabels[key] ?? key}</dt><dd className="text-pine-950">{value}</dd></div>)}</dl><ul className="mt-3 space-y-2 text-sm">{item.documents.map(document => <li key={document.id} className="flex flex-wrap items-center justify-between gap-2"><span>{document.label} · {document.filename}{!document.is_current && ` · versión ${document.version}`}</span><a className="font-bold text-pine-900 underline underline-offset-4" href={`/api/postulaciones/${item.id}/documentos/${document.id}`}>Descargar</a></li>)}</ul></details>
        </article>)}</div>
          : <EmptyState title="Todavía no has postulado">Cuando encuentres una oportunidad, envía tu postulación y sigue aquí su estado.</EmptyState>}</section>}
    </section>

    <Dialog open={!!applying} title="Postular a esta práctica" onClose={() => { if (!busy) { setApplying(null); setApplicationDraft(null); setApplicationReview(false); setError('') } }}>
      {applying && applicationProfile && <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (!applicationReview) reviewApplication(event) }}>
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">{applying.company_name}</p><h3 className="mt-1 font-display text-2xl font-semibold text-pine-950">{applying.title}</h3><p className="mt-2 text-sm text-muted">Primero selecciona tus antecedentes; luego podrás revisar exactamente qué se enviará.</p></div>
        <div hidden={applicationReview} className="grid gap-4">
          <label className="form-label">CV en PDF {applying.cv_required ? '(requerido)' : '(opcional)'}<input className={inputClass} type="file" name="cv" accept="application/pdf,.pdf" required={applying.cv_required} /><span className="mt-1 text-xs font-normal text-muted">PDF de hasta 5 MiB.</span></label>
          <fieldset className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4"><legend className="px-1 text-sm font-bold text-pine-950">Carta de presentación {applying.cover_letter_required ? '(requerida)' : '(opcional)'}</legend>
            <label className="form-label">Redáctala aquí<textarea className={inputClass + ' min-h-28 resize-y'} name="cover_letter_text" maxLength={5000} rows={4} placeholder="Cuéntale a la empresa qué te interesa de esta práctica y qué puedes aportar." /></label>
            <label className="form-label">O adjunta un PDF<input className={inputClass} type="file" name="cover_letter_pdf" accept="application/pdf,.pdf" /><span className="mt-1 text-xs font-normal text-muted">Elige una modalidad, no ambas. PDF de hasta 5 MiB.</span></label>
          </fieldset>
          {applying.additional_requirements.map((label, index) => <label className="form-label" key={label}>{label} (requerido)<input className={inputClass} type="file" name={`additional_${index}`} accept="application/pdf,.pdf" required /><span className="mt-1 text-xs font-normal text-muted">PDF de hasta 5 MiB.</span></label>)}
          <p className="rounded-lg border-l-2 border-lime-600 bg-lime-50 px-4 py-3 text-xs leading-5 text-pine-950">La autorización académica externa y los antecedentes del seguro escolar se gestionan por separado en la formalización, cuando corresponda. PractiConecta no los emite ni certifica.</p>
        </div>
        <div hidden={!applicationReview} className="grid gap-4" aria-live="polite">
          <section className="rounded-xl border border-stone-200 bg-stone-50 p-4"><h4 className="font-bold text-pine-950">Datos de perfil que enviarás</h4><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(applicationDraft?.profile ?? {}).filter(([, value]) => value !== null && value !== '').map(([key, value]) => <div key={key}><dt className="text-xs text-muted">{profileLabels[key] ?? key}</dt><dd className="font-medium text-pine-950">{value}</dd></div>)}</dl></section>
          <section className="rounded-xl border border-stone-200 p-4"><h4 className="font-bold text-pine-950">Antecedentes que se enviarán</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">{applicationDraft?.cv && <li>CV · {applicationDraft.cv.name}</li>}{applicationDraft?.letterPdf && <li>Carta de presentación · {applicationDraft.letterPdf.name}</li>}{applicationDraft?.letterText && <li>Carta de presentación redactada ({applicationDraft.letterText.length} caracteres)</li>}{applicationDraft?.additional.map(item => <li key={item.label}>{item.label} · {item.file.name}</li>)}</ul></section>
          {applicationDraft?.letterText && <section className="rounded-xl border border-stone-200 p-4"><h4 className="font-bold text-pine-950">Carta redactada</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">{applicationDraft.letterText}</p></section>}
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="flex flex-wrap gap-3">
          {!applicationReview
            ? <button className={buttonClass} type="submit">Revisar antecedentes <span aria-hidden="true">↗</span></button>
            : <><button className={quietButtonClass} type="button" disabled={busy} onClick={() => { setApplicationReview(false); setError('') }}>Volver y corregir</button><button className={buttonClass} type="button" disabled={busy} onClick={() => void confirmApplication()}>{busy ? 'Enviando…' : 'Confirmar y enviar postulación'} <span aria-hidden="true">↗</span></button></>}
          <button className={quietButtonClass} type="button" disabled={busy} onClick={() => { setApplying(null); setApplicationDraft(null); setApplicationReview(false); setError('') }}>Cancelar</button>
        </div>
      </form>}
    </Dialog>
    <Dialog open={!!detail} title={detail?.title ?? 'Detalle de práctica'} onClose={() => setDetail(null)}>{detail && <OfferDetails offer={detail} account={account} onApply={() => void openApplication(detail)} />}</Dialog>
    <Dialog open={!!editing} title="Editar oferta" onClose={() => setEditing(null)}>
      {editing && <form className="grid gap-4" onSubmit={updateOffer}>
        <p className="text-sm leading-6 text-muted">Actualiza los datos de esta oferta. Los cambios se guardan en tu cuenta empresarial.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">Título<input className={inputClass} name="title" required maxLength={150} defaultValue={editing.title} /></label>
          <label className="form-label">Área<input className={inputClass} name="area" required maxLength={150} defaultValue={editing.area} /></label>
          <label className="form-label sm:col-span-2">Descripción<textarea className={inputClass + ' min-h-24 resize-y'} name="description" required maxLength={1500} rows={3} defaultValue={editing.description} /></label>
          <label className="form-label sm:col-span-2">Requisitos<textarea className={inputClass + ' min-h-20 resize-y'} name="requirements" required maxLength={1500} rows={2} defaultValue={editing.requirements} /></label>
          <label className="form-label">Ciudad<input className={inputClass} name="city" maxLength={150} defaultValue={editing.city ?? ''} /></label>
          <label className="form-label">Región<input className={inputClass} name="region" maxLength={150} defaultValue={editing.region ?? ''} /></label>
          <label className="form-label">Modalidad<select className={inputClass} name="modality" defaultValue={editing.modality}><option value="presencial">Presencial</option><option value="híbrida">Híbrida</option><option value="remota">Remota</option></select></label>
          <label className="form-label">Horas de práctica<input className={inputClass} name="hours" type="number" min="1" required defaultValue={editing.hours} /></label>
          <label className="form-label">Vacantes<input className={inputClass} name="vacancies" type="number" min="1" required defaultValue={editing.vacancies} /></label>
          <label className="form-label">Fecha límite<input className={inputClass} name="deadline" type="date" defaultValue={editing.deadline ?? ''} /></label>
          <label className="form-label sm:col-span-2">Beneficios<textarea className={inputClass + ' min-h-20 resize-y'} name="benefits" maxLength={1500} rows={2} defaultValue={editing.benefits ?? ''} /></label>
          <fieldset className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:col-span-2"><legend className="px-1 text-sm font-bold text-pine-950">Antecedentes para postular</legend>
            <label className="flex items-start gap-3 text-sm text-stone-700"><input className="mt-1 accent-pine-900" type="checkbox" name="cv_required" defaultChecked={editing.cv_required} /><span><strong className="text-pine-950">Solicitar CV en PDF</strong></span></label>
            <label className="flex items-start gap-3 text-sm text-stone-700"><input className="mt-1 accent-pine-900" type="checkbox" name="cover_letter_required" defaultChecked={editing.cover_letter_required} /><span><strong className="text-pine-950">Solicitar carta de presentación</strong></span></label>
            <label className="form-label">Otros antecedentes pertinentes<textarea className={inputClass + ' min-h-20 resize-y'} name="additional_requirements" maxLength={600} rows={3} defaultValue={editing.additional_requirements.join('\n')} /><span className="mt-1 text-xs font-normal leading-5 text-muted">Un antecedente por línea, máximo 5. Solo solicita antecedentes pertinentes.</span></label>
          </fieldset>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'} <span aria-hidden="true">↗</span></button><button className={quietButtonClass} type="button" onClick={() => setEditing(null)}>Cancelar</button></div>
      </form>}
    </Dialog>
    <Dialog open={!!selected} title="Postulaciones recibidas" onClose={() => setSelected(null)}>
      {selected && <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">{selected.title}</p><h3 className="mt-2 font-display text-2xl font-semibold text-pine-950">Candidaturas</h3></div>
        {applications.length ? <div className="divide-y divide-stone-200">{applications.map(item => <article className="space-y-4 py-5 first:pt-0 last:pb-0" key={item.id}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-pine-950">{item.student_name}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.cover_letter_text || item.message || 'Sin carta de presentación.'}</p></div><StatusBadge value={item.status} label={statusLabels[item.status] ?? item.status} /></div>
          <details className="rounded-lg border border-stone-200 bg-white px-4 py-3"><summary className="cursor-pointer text-sm font-bold text-pine-900">Perfil y antecedentes enviados</summary><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(item.profile_snapshot ?? {}).filter(([, value]) => value !== null && value !== '').map(([key, value]) => <div key={key}><dt className="text-xs text-muted">{profileLabels[key] ?? key}</dt><dd className="text-pine-950">{value}</dd></div>)}</dl>
            <ul className="mt-4 space-y-2 text-sm">{item.documents.map(document => <li key={document.id} className="flex flex-wrap items-center justify-between gap-2"><span>{document.label} · {document.filename} · {Math.ceil(document.size / 1024)} KiB{!document.is_current && ` · versión ${document.version}`}</span><a className="font-bold text-pine-900 underline underline-offset-4" href={`/api/postulaciones/${item.id}/documentos/${document.id}`}>Descargar</a></li>)}</ul>
          </details>
          <div className="flex flex-wrap items-center gap-3"><label className="sr-only" htmlFor={`status-${item.id}`}>Estado de postulación de {item.student_name}</label><select id={`status-${item.id}`} className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm" disabled={!item.allowed_statuses.length} value={item.status} onChange={event => void updateApplication(item.id, event.target.value)}><option value={item.status}>{statusLabels[item.status] ?? item.status}</option>{item.allowed_statuses.map(status => <option key={status} value={status}>{statusLabels[status] ?? status}</option>)}</select>{item.can_propose && <button className={buttonClass} onClick={() => setProposing(item.id)}>Preparar propuesta <span aria-hidden="true">↗</span></button>}</div>
        </article>)}</div>
          : <EmptyState title="Aún no hay postulaciones">Las nuevas candidaturas aparecerán aquí.</EmptyState>}</div>}
    </Dialog>
    <Dialog open={proposing !== null} title="Presentar propuesta de práctica" onClose={() => setProposing(null)}>
      {proposing !== null && <ProposalForm applicationId={proposing} onClose={() => setProposing(null)} onExpire={onExpire} onCreated={() => { setProposing(null); if (selected) void listApplicants(selected); window.dispatchEvent(new Event('proposals-updated')) }} />}
    </Dialog>
  </>
}
