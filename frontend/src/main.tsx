import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { api, ApiError } from './api'
import type { Account, Role } from './api'
import { ProfileForm } from './profile'
import { Opportunities } from './opportunities'
import { Proposals } from './proposals'
import './styles.css'

function AuthForm({ onAccount }: { onAccount: (account: Account) => void }) {
  const [register, setRegister] = useState(false)
  const [role, setRole] = useState<Role>('estudiante')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setError('')
    setBusy(true)
    try {
      onAccount(await api<Account>(register ? '/cuenta/registro' : '/cuenta/sesion', 'POST', fields))
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card auth" aria-labelledby="account-title">
      <h1 id="account-title">{register ? 'Crea tu cuenta' : 'Inicia sesión'}</h1>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          {register && <>
            <label>Tipo de cuenta
              <select name="role" value={role} onChange={event => setRole(event.target.value as Role)}>
                <option value="estudiante">Estudiante</option>
                <option value="empresa">Empresa</option>
              </select>
            </label>
            <label>{role === 'empresa' ? 'Nombre del representante' : 'Nombre completo'}
              <input name="nombre" autoComplete="name" required maxLength={150} />
            </label>
          </>}
          <label>Correo electrónico
            <input name="email" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label>Contraseña
            <input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'}
              required minLength={register ? 12 : 1} maxLength={128}
              aria-describedby={register ? 'password-hint' : undefined} />
          </label>
          {register && <p className="hint" id="password-hint">Usa al menos 12 caracteres.</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button>{busy ? 'Un momento…' : register ? 'Crear cuenta' : 'Ingresar'}</button>
        </fieldset>
      </form>
      <button type="button" className="text-button" disabled={busy} onClick={() => {
        setRegister(!register)
        setError('')
      }}>{register ? 'Ya tengo una cuenta' : 'Crear una cuenta'}</button>
    </section>
  )
}

function App() {
  const [account, setAccount] = useState<Account | null | undefined>()
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  async function loadAccount() {
    setError('')
    try {
      setAccount(await api<Account>('/cuenta/yo'))
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) setAccount(null)
      else setError((failure as Error).message)
    }
  }

  useEffect(() => { void loadAccount() }, [])

  async function logout() {
    setError('')
    setLeaving(true)
    try {
      await api<void>('/cuenta/sesion', 'DELETE')
      setAccount(null)
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setLeaving(false)
    }
  }

  const expireSession = useCallback(() => {
    setError('Tu sesión venció. Vuelve a ingresar para continuar.')
    setAccount(null)
  }, [])

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <span className="brand">PractiConecta</span>
          {account && <button className="secondary" disabled={leaving} onClick={() => void logout()}>
            {leaving ? 'Cerrando…' : 'Cerrar sesión'}
          </button>}
        </div>
      </header>
      <main className="shell">
        {error && <p className="error" role="alert">{error}</p>}
        {account === undefined && (error
          ? <button onClick={() => void loadAccount()}>Reintentar</button>
          : <p role="status">Comprobando tu sesión…</p>)}
        {account === null && <AuthForm onAccount={next => { setError(''); setAccount(next) }} />}
        {account && <nav className="app-nav"><a href="#perfil">Mi perfil</a><a href="#ofertas">Ofertas y postulaciones</a><a href="#propuestas">Propuestas de práctica</a></nav>}
        {account && <div id="perfil"><ProfileForm key={account.email} account={account} onExpire={expireSession} /></div>}
        {account && <div id="ofertas"><Opportunities account={account} onExpire={expireSession} /></div>}
        {account && <div id="propuestas"><Proposals key={account.email} account={account} /></div>}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
