import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangSwitch } from '@/components/admin/LangSwitch'
import { useAdminHead } from '@/components/admin/useAdminHead'
import { mediaURL } from '@/lib/api'
import { getToken, login } from '@/lib/admin'
import { useCms } from '@/lib/cms'
import { useAdminT } from '@/lib/admin-i18n'
import { EasyTechCredit } from '@/components/ui/EasyTechCredit'

/**
 * Sign-in for the admin screens — a port of admin/login.html, same endpoint
 * (`POST /admin/auth/login`), same payload, same `gp_admin_token` storage.
 *
 * It exists because the Categories page cannot function without a session,
 * and the old dashboard's login lives on a different origin: sending an
 * operator there would store the token against that origin's localStorage,
 * where this app can never read it. Same reason the token from a
 * localhost-served dashboard is useless here — localStorage is per-origin.
 */
export function AdminLogin() {
  const navigate = useNavigate()
  const t = useAdminT()
  useAdminHead(t('login.signIn'))

  /**
   * The real brand logo, as the old login.html showed.
   *
   * No request of its own: App hydrates the public CMS store on every route,
   * admin included, and `/public/branding` is part of that. So this is a read
   * of something already in flight, and the lettermark below stands in until
   * it lands — or permanently, if the API is unreachable, which is exactly
   * when a sign-in screen most needs to still render.
   */
  const logo = useCms((s) => s.branding?.logo_url)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Already signed in: skip the form rather than asking again.
  useEffect(() => {
    if (getToken()) navigate('/admin/overview', { replace: true })
  }, [navigate])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate('/admin/overview', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin admin-login">
      <div className="admin-login-card">
        <span className="admin-brand">
          {logo ? (
            // On a fixed light plate: the mark is drawn for a light ground
            // and would vanish against the dark surface in dark mode.
            <span className="admin-brand-logo">
              <img src={mediaURL(logo)} alt="" aria-hidden="true" />
            </span>
          ) : (
            <span className="admin-brand-mark" aria-hidden="true">
              GP
            </span>
          )}
          <span className="admin-brand-text">
            Gold Pelet <span>{t('sidebar.admin')}</span>
          </span>
        </span>
        <LangSwitch />

        <h1>{t('login.title')}</h1>
        <p className="admin-login-sub">{t('login.sub')}</p>

        <form className="admin-form" onSubmit={onSubmit}>
          <div className="field full">
            <label htmlFor="admin-email">{t('login.email')}</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              autoComplete="username"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field full">
            <label htmlFor="admin-password">{t('login.password')}</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-fill admin-login-submit" disabled={busy}>
            {busy ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>

      {/* Outside the card, not in it: the card is the sign-in task and this
          is not part of it. */}
      <EasyTechCredit className="et-credit--login" label={t('sidebar.poweredBy')} />
    </div>
  )
}
