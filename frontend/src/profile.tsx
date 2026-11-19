import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from './api'
import type { Account, Profile } from './api'

type Field = {
  name: string
  label: string
  kind?: 'area' | 'hours' | 'modality'
  required?: boolean
}

const location: Field[] = [
  { name: 'ciudad', label: 'Ciudad' },
  { name: 'region', label: 'Región' },
]

const student: Field[] = [
  { name: 'nombre', label: 'Nombre completo', required: true },
  { name: 'carrera', label: 'Carrera' },
  { name: 'institucion', label: 'Institución educativa' },
  { name: 'nivel', label: 'Nivel o semestre' },
  ...location,
  { name: 'horas_objetivo', label: 'Horas requeridas', kind: 'hours' },
  { name: 'modalidad', label: 'Modalidad preferida', kind: 'modality' },
  { name: 'disponibilidad', label: 'Disponibilidad y fechas posibles', kind: 'area' },
  { name: 'habilidades', label: 'Habilidades', kind: 'area' },
  { name: 'areas_interes', label: 'Áreas de interés', kind: 'area' },
]

const company: Field[] = [
  { name: 'representante', label: 'Nombre del representante', required: true },
  { name: 'razon_social', label: 'Razón social' },
  { name: 'rut', label: 'RUT de la empresa' },
  { name: 'rubro', label: 'Rubro' },
  ...location,
  { name: 'contacto', label: 'Contacto de la empresa' },
  { name: 'descripcion', label: 'Descripción de la empresa', kind: 'area' },
]

function ProfileField({ field, value }: { field: Field; value: string | number | null }) {
  const { name, kind, label, required } = field
  const control = 'mt-2 block w-full rounded-lg border border-stone-300 bg-white px-3.5 py-3 text-[15px] text-pine-950 outline-none transition focus:border-pine-800 focus:ring-2 focus:ring-pine-800/15 disabled:bg-stone-100'
  return <label className={`block text-sm font-semibold text-pine-950 ${kind === 'area' ? 'sm:col-span-2' : ''}`}>{label}{required && ' (obligatorio)'}
    {kind === 'area' ? <textarea className={control + ' min-h-28 resize-y'} name={name} defaultValue={value ?? ''} maxLength={1500} rows={3} />
      : kind === 'modality' ? <select className={control} name={name} defaultValue={value ?? ''}>
        <option value="">Sin preferencia</option>
        <option value="presencial">Presencial</option>
        <option value="híbrida">Híbrida</option>
        <option value="remota">Remota</option>
      </select>
      : kind === 'hours' ? <input className={control} name={name} type="number" min={1} max={2147483647} step={1} defaultValue={value ?? ''} />
      : <input className={control} name={name} required={required} maxLength={150} defaultValue={value ?? ''} />}
  </label>
}

export function ProfileForm({ account, onExpire }: { account: Account; onExpire: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [revision, setRevision] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const endpoint = '/perfil/' + account.role
  const fields = account.role === 'estudiante' ? student : company

  useEffect(() => {
    let cancelled = false
    api<Profile>(endpoint).then(value => {
      if (!cancelled) setProfile(value)
    }).catch(failure => {
      if (cancelled) return
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError(failure.message)
    })
    return () => { cancelled = true }
  }, [endpoint, attempt, onExpire])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = new FormData(event.currentTarget)
    const data: Profile = {}
    for (const field of fields) {
      const value = String(input.get(field.name) ?? '').trim()
      data[field.name] = field.kind === 'hours' && value ? Number(value) : value || null
    }
    setBusy(true)
    setSaved(false)
    setError('')
    try {
      setProfile(await api<Profile>(endpoint, 'PUT', data))
      setRevision(previous => previous + 1)
      setSaved(true)
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) onExpire()
      else setError((failure as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-labelledby="profile-title">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
      <div><p className="text-xs font-bold uppercase tracking-[.14em] text-pine-800">Tu información</p><h2 id="profile-title" className="mt-2 font-display text-2xl font-semibold tracking-tight text-pine-950 sm:text-3xl">Mi perfil</h2></div>
      <p className="max-w-full break-all text-sm text-muted">{account.email}</p>
    </header>
    <div className="p-5 sm:p-7">
    <p className="mb-6 max-w-2xl text-sm leading-6 text-muted">Mantén tus datos al día para que cada proceso de práctica parta con información clara.</p>
    {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">{error}</p>}
    {profile ? (
      <form onSubmit={save} onChange={() => setSaved(false)}>
        <fieldset key={revision} disabled={busy} className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {fields.map(field => <ProfileField key={field.name} field={field} value={profile[field.name]} />)}
        </fieldset>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button className="rounded-full bg-pine-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-lime-500 disabled:opacity-60" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'} <span aria-hidden="true">↗</span></button>
          <span className="text-sm text-emerald-800" role="status">{saved ? 'Tus cambios quedaron guardados.' : ''}</span>
        </div>
      </form>
    ) : error
      ? <button className="text-sm font-bold text-pine-900 underline underline-offset-4" onClick={() => { setError(''); setAttempt(previous => previous + 1) }}>Reintentar</button>
      : <p className="py-5 text-sm text-muted" role="status">Cargando tu perfil…</p>}
    </div>
  </section>
}
