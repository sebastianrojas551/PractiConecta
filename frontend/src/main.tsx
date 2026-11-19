import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router'
import { api, ApiError } from './api'
import type { Account, Role } from './api'
import { ProfileForm } from './profile'
import { FeaturedOffers, Opportunities } from './opportunities'
import { Proposals } from './proposals'
import { LoadingState, Notice } from './ui'
import './styles.css'

function dashboardPath(account: Account) {
  return account.role === 'empresa' ? '/empresa' : '/estudiante'
}

function SiteHeader({ account, onLogout }: { account: Account | null; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setMenuOpen(false), [location.pathname])
  return <header className="site-header">
    <div className="header-inner">
      <Link className="wordmark" to="/" aria-label="PractiConecta, inicio">
        <span className="wordmark-symbol" aria-hidden="true">P</span><span>PractiConecta</span>
      </Link>
      <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation"
        onClick={() => setMenuOpen(value => !value)}>{menuOpen ? 'Cerrar' : 'Menú'}</button>
      <nav id="primary-navigation" className={`primary-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/ofertas">Prácticas</NavLink>
        <a href="/#como-funciona">Cómo funciona</a>
        {account && <NavLink to={dashboardPath(account)}>Mi espacio</NavLink>}
        {account && <NavLink to="/propuestas">Propuestas</NavLink>}
        <div className="navigation-actions">
          {account
            ? <button className="button button-quiet" onClick={onLogout}>Cerrar sesión</button>
            : <><Link className="button button-quiet" to="/ingresar">Ingresar</Link><Link className="button button-dark" to="/registro">Crear cuenta <span aria-hidden="true">↗</span></Link></>}
        </div>
      </nav>
    </div>
  </header>
}

function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-inner">
      <Link className="wordmark wordmark-footer" to="/"><span className="wordmark-symbol" aria-hidden="true">P</span><span>PractiConecta</span></Link>
      <p>Un punto de encuentro para comenzar tu práctica profesional.</p>
      <div className="footer-links"><Link to="/ofertas">Explorar prácticas</Link><Link to="/registro?rol=empresa">Publicar como empresa</Link></div>
      <small>La autorización académica se gestiona con cada institución fuera de PractiConecta.</small>
    </div>
  </footer>
}

function HomePage({ account }: { account: Account | null }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (region.trim()) params.set('region', region.trim())
    navigate('/ofertas' + (params.size ? '?' + params.toString() : ''))
  }
  return <>
    <main id="contenido" className="page-shell home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" />Prácticas profesionales en Chile</p>
          <h1 id="hero-title">El comienzo de tu camino <em>profesional.</em></h1>
          <p className="hero-lede">Encuentra una práctica que conecte lo que sabes con lo que quieres hacer. Empresas y estudiantes, en el mismo lugar.</p>
          <form className="hero-search" onSubmit={search} role="search" aria-label="Buscar prácticas">
            <label><span>¿Qué área te interesa?</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. Diseño, tecnología…" /></label>
            <label className="search-region"><span>Región</span><input value={region} onChange={event => setRegion(event.target.value)} placeholder="Ej. Maule" /></label>
            <button className="button button-lime" type="submit">Buscar prácticas <span aria-hidden="true">↗</span></button>
          </form>
          <p className="hero-note">Explora ofertas sin crear una cuenta.</p>
        </div>
        <div className="hero-aside" aria-label="Acceso directo a las oportunidades">
          <div className="aside-index"><span>01</span><span>Tu próximo paso</span></div>
          <div className="aside-graphic" aria-hidden="true"><span className="graphic-ring ring-one" /><span className="graphic-ring ring-two" /><span className="graphic-spark">✳</span><span className="graphic-caption">Talento<br />en movimiento</span></div>
          <div className="aside-bottom"><p>Una buena práctica abre posibilidades. Empieza por encontrar dónde crecer.</p><Link to="/ofertas" className="arrow-link">Ver oportunidades <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="opportunities-section" aria-labelledby="opportunities-title">
        <div className="section-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" />Oportunidades actuales</p><h2 id="opportunities-title">Encuentra un lugar<br className="desktop-break" /> donde aportar.</h2></div>
          <Link className="arrow-link" to="/ofertas">Ver todas las prácticas <span aria-hidden="true">→</span></Link>
        </div>
        <FeaturedOffers account={account} />
      </section>

      <section className="how-section" id="como-funciona" aria-labelledby="how-title">
        <div className="how-heading"><p className="eyebrow"><span className="eyebrow-line" />Un proceso claro</p><h2 id="how-title">De la búsqueda<br />a la experiencia.</h2></div>
        <div className="steps-list">
          <article className="step-row"><span className="step-number">01</span><div><h3>Explora</h3><p>Revisa oportunidades, requisitos y condiciones publicadas por empresas.</p></div><span className="step-mark" aria-hidden="true">↗</span></article>
          <article className="step-row"><span className="step-number">02</span><div><h3>Conecta</h3><p>Postula y sigue la conversación desde tu espacio personal.</p></div><span className="step-mark" aria-hidden="true">↗</span></article>
          <article className="step-row"><span className="step-number">03</span><div><h3>Comienza</h3><p>Acuerda tu práctica con la empresa y gestiona por separado la autorización académica que corresponda.</p></div><span className="step-mark" aria-hidden="true">↗</span></article>
        </div>
      </section>

      <section className="audience-section" aria-label="Elige tu espacio">
        <article className="audience-panel audience-student"><p className="eyebrow"><span className="eyebrow-line" />Para estudiantes</p><h2>Tu formación<br />también se vive.</h2><p>Encuentra una oportunidad para poner en práctica lo que estás aprendiendo.</p><Link className="button button-lime" to={account?.role === 'estudiante' ? '/estudiante' : '/registro?rol=estudiante'}>{account?.role === 'estudiante' ? 'Ir a mi espacio' : 'Crear cuenta estudiante'} <span aria-hidden="true">↗</span></Link></article>
        <article className="audience-panel audience-company"><p className="eyebrow"><span className="eyebrow-line" />Para empresas</p><h2>Conecta con<br />nuevo talento.</h2><p>Publica oportunidades y acompaña el proceso de selección desde un solo lugar.</p><Link className="button button-outline-light" to={account?.role === 'empresa' ? '/empresa' : '/registro?rol=empresa'}>{account?.role === 'empresa' ? 'Ir a mi espacio' : 'Publicar una práctica'} <span aria-hidden="true">↗</span></Link></article>
      </section>
    </main>
  </>
}

function AuthPage({ mode, onAuthenticated }: { mode: 'login' | 'register'; onAuthenticated: (account: Account) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [role, setRole] = useState<Role>(params.get('rol') === 'empresa' ? 'empresa' : 'estudiante')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const register = mode === 'register'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    if (register) fields.role = role
    setBusy(true); setError('')
    try {
      const account = await api<Account>(register ? '/cuenta/registro' : '/cuenta/sesion', 'POST', fields)
      onAuthenticated(account)
      const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(returnTo || dashboardPath(account), { replace: true })
    } catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  return <main id="contenido" className="page-shell auth-page">
    <div className="auth-story">
      <p className="eyebrow"><span className="eyebrow-line" />{register ? 'Tu siguiente etapa' : 'Qué bueno verte'}</p>
      <h1>{register ? 'Abre la puerta a nuevas experiencias.' : 'Vuelve a donde todo comienza.'}</h1>
      <p>{register ? 'Crea tu espacio para encontrar oportunidades o conectar con estudiantes.' : 'Ingresa para continuar con tus oportunidades y procesos de práctica.'}</p>
      <Link className="arrow-link" to="/ofertas">Explorar prácticas sin ingresar <span aria-hidden="true">→</span></Link>
      <div className="auth-stamp" aria-hidden="true">Practi<br />Conecta<span>↗</span></div>
    </div>
    <section className="auth-panel" aria-labelledby="auth-title">
      <p className="eyebrow"><span className="eyebrow-line" />{register ? 'Crear una cuenta' : 'Acceso a tu espacio'}</p>
      <h2 id="auth-title">{register ? 'Empecemos.' : 'Ingresa a tu cuenta.'}</h2>
      {register && <div className="role-switch" aria-label="Tipo de cuenta">
        <button type="button" aria-pressed={role === 'estudiante'} className={role === 'estudiante' ? 'is-selected' : ''} onClick={() => setRole('estudiante')}>Soy estudiante</button>
        <button type="button" aria-pressed={role === 'empresa'} className={role === 'empresa' ? 'is-selected' : ''} onClick={() => setRole('empresa')}>Soy empresa</button>
      </div>}
      <form className="form-stack" onSubmit={submit}>
        {register && <label>{role === 'empresa' ? 'Nombre del representante' : 'Nombre completo'}<input name="nombre" autoComplete="name" required maxLength={150} /></label>}
        <label>Correo electrónico<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
        <label>Contraseña<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : 1} maxLength={128} aria-describedby={register ? 'password-hint' : undefined} /></label>
        {register && <p id="password-hint" className="form-hint">Usa al menos 12 caracteres.</p>}
        {error && <Notice kind="error">{error}</Notice>}
        <button className="button button-dark button-wide" disabled={busy}>{busy ? 'Un momento…' : register ? 'Crear mi cuenta' : 'Ingresar'} <span aria-hidden="true">↗</span></button>
      </form>
      <p className="auth-switch">{register ? '¿Ya tienes una cuenta?' : '¿Primera vez por aquí?'} <Link to={register ? '/ingresar' : '/registro'}>{register ? 'Ingresa' : 'Crea una cuenta'}</Link></p>
    </section>
  </main>
}

function ProtectedPage({ account, ready, role, children }: { account: Account | null; ready: boolean; role?: Role; children: ReactNode }) {
  const location = useLocation()
  if (!ready) return <main id="contenido" className="page-shell"><LoadingState label="Revisando tu sesión…" /></main>
  if (!account) return <Navigate to="/ingresar" replace state={{ from: location }} />
  if (role && account.role !== role) return <Navigate to={dashboardPath(account)} replace />
  return <>{children}</>
}

function DashboardPage({ account, onExpire }: { account: Account; onExpire: () => void }) {
  const student = account.role === 'estudiante'
  return <main id="contenido" className="page-shell dashboard-page">
    <section className="dashboard-intro">
      <div><p className="eyebrow"><span className="eyebrow-line" />Espacio {student ? 'estudiante' : 'empresa'}</p><h1>{student ? 'Tu camino profesional, en marcha.' : 'Talento y oportunidades, más cerca.'}</h1><p>{student ? 'Administra tu perfil, explora prácticas y revisa tus propuestas.' : 'Presenta oportunidades y acompaña cada postulación desde tu espacio.'}</p></div>
      <nav className="dashboard-jumps" aria-label="Secciones de tu espacio"><a href="#perfil">Mi perfil <span>01</span></a><a href="#oportunidades">{student ? 'Oportunidades' : 'Ofertas'} <span>02</span></a><a href="#propuestas">Propuestas <span>03</span></a></nav>
    </section>
    <section id="perfil" className="dashboard-section"><div className="section-kicker"><span>01</span><span>Tu información</span></div><ProfileForm key={account.email} account={account} onExpire={onExpire} /></section>
    <section id="oportunidades" className="dashboard-section"><div className="section-kicker"><span>02</span><span>{student ? 'Explora y postula' : 'Publica y selecciona'}</span></div><Opportunities account={account} onExpire={onExpire} /></section>
    <section id="propuestas" className="dashboard-section"><div className="section-kicker"><span>03</span><span>Acuerdos de práctica</span></div><Proposals account={account} onExpire={onExpire} /></section>
  </main>
}

function NotFound() {
  return <main id="contenido" className="page-shell not-found"><p className="eyebrow"><span className="eyebrow-line" />404 · No encontramos esta página</p><h1>Sigamos buscando.</h1><Link className="button button-dark" to="/">Volver al inicio <span aria-hidden="true">↗</span></Link></main>
}

function App() {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const loadAccount = useCallback(async () => {
    setSessionError('')
    try { setAccount(await api<Account>('/cuenta/yo')) }
    catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) setAccount(null)
      else setSessionError((failure as Error).message)
    } finally { setReady(true) }
  }, [])
  useEffect(() => { void loadAccount() }, [loadAccount])

  async function logout() {
    try { await api<void>('/cuenta/sesion', 'DELETE'); setAccount(null); navigate('/') }
    catch (failure) { setSessionError((failure as Error).message) }
  }
  const expireSession = useCallback(() => {
    setAccount(null)
    navigate('/ingresar', { state: { from: location }, replace: true })
  }, [location, navigate])

  if (!ready && location.pathname !== '/') return <main className="page-shell"><LoadingState label="Preparando tu espacio…" /></main>
  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <SiteHeader account={account} onLogout={() => void logout()} />
    {sessionError && <div className="page-shell global-message"><Notice kind="error">{sessionError} <button className="inline-link" onClick={() => void loadAccount()}>Reintentar</button></Notice></div>}
    <Routes>
      <Route path="/" element={<HomePage account={account} />} />
      <Route path="/ofertas" element={<main id="contenido" className="page-shell catalog-page"><Opportunities account={account} onExpire={expireSession} /></main>} />
      <Route path="/ingresar" element={account ? <Navigate to={dashboardPath(account)} replace /> : <AuthPage mode="login" onAuthenticated={setAccount} />} />
      <Route path="/registro" element={account ? <Navigate to={dashboardPath(account)} replace /> : <AuthPage mode="register" onAuthenticated={setAccount} />} />
      <Route path="/estudiante" element={<ProtectedPage account={account} ready={ready} role="estudiante"><DashboardPage account={account!} onExpire={expireSession} /></ProtectedPage>} />
      <Route path="/empresa" element={<ProtectedPage account={account} ready={ready} role="empresa"><DashboardPage account={account!} onExpire={expireSession} /></ProtectedPage>} />
      <Route path="/propuestas" element={<ProtectedPage account={account} ready={ready}><main id="contenido" className="page-shell proposals-page"><Proposals account={account!} onExpire={expireSession} /></main></ProtectedPage>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <SiteFooter />
  </>
}

createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>)
