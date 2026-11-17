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
  return <label className={kind === 'area' ? 'full' : undefined}>{label}{required && ' (obligatorio)'}
    {kind === 'area' ? <textarea name={name} defaultValue={value ?? ''} maxLength={1500} rows={3} />
      : kind === 'modality' ? <select name={name} defaultValue={value ?? ''}>
        <option value="">Sin preferencia</option>
        <option value="presencial">Presencial</option>
        <option value="híbrida">Híbrida</option>
        <option value="remota">Remota</option>
      </select>
      : kind === 'hours' ? <input name={name} type="number" min={1} max={2147483647} step={1} defaultValue={value ?? ''} />
      : <input name={name} required={required} maxLength={150} defaultValue={value ?? ''} />}
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

  return <section className="card" aria-labelledby="profile-title">
    <h1 id="profile-title">Perfil de {account.role}</h1>
    <p className="account-email">{account.email}</p>
    {error && <p className="error" role="alert">{error}</p>}
    {profile ? (
      <form onSubmit={save} onChange={() => setSaved(false)}>
        <fieldset key={revision} disabled={busy} className="profile-grid">
          {fields.map(field => <ProfileField key={field.name} field={field} value={profile[field.name]} />)}
        </fieldset>
        <div className="actions">
          <button disabled={busy}>{busy ? 'Guardando…' : 'Guardar perfil'}</button>
          <span role="status">{saved ? 'Perfil guardado.' : ''}</span>
        </div>
      </form>
    ) : error
      ? <button onClick={() => { setError(''); setAttempt(previous => previous + 1) }}>Reintentar</button>
      : <p role="status">Cargando tu perfil…</p>}
  </section>
}
