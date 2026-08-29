import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminHead } from '@/components/admin/useAdminHead'
import { getToken, login } from '@/lib/admin'

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
  useAdminHead('Sign in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Already signed in: skip the form rather than asking again.
  useEffect(() => {
    if (getToken()) navigate('/admin/categories', { replace: true })
  }, [navigate])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate('/admin/categories', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin admin-login">
      <div className="admin-login-card">
        <span className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            GP
          </span>
          <span className="admin-brand-text">
            Gold Pelet <span>Admin</span>
          </span>
        </span>

        <h1>Sign in</h1>
        <p className="admin-login-sub">Sign in to manage the Gold Pelet website.</p>

        <form className="admin-form" onSubmit={onSubmit}>
          <div className="field full">
            <label htmlFor="admin-email">Email</label>
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
            <label htmlFor="admin-password">Password</label>
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
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
