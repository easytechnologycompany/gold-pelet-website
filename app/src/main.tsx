import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// After index.css: the admin's few scoped overrides need to land last.
import './admin.css'

/**
 * Recover from a deploy that happened while the tab was open.
 *
 * The admin screens are lazy chunks with content-hashed names. Deploy, and
 * the old names stop existing -- so a tab that has been open across a deploy
 * and then navigates within the app asks for a file that is no longer there.
 * The dynamic import rejects, React renders nothing, and the page goes blank
 * with no error a visitor could act on. Vite raises `vite:preloadError` for
 * exactly this.
 *
 * Reloading picks up the current index.html and its current chunk names.
 * `sessionStorage` guards it: if the reload does not fix the problem -- the
 * chunk is genuinely missing rather than renamed -- the second failure is
 * left alone rather than becoming a refresh loop.
 */
const RELOAD_GUARD = 'gp-chunk-reload'
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem(RELOAD_GUARD)) return
  event.preventDefault()
  sessionStorage.setItem(RELOAD_GUARD, '1')
  location.reload()
})
window.addEventListener('load', () => sessionStorage.removeItem(RELOAD_GUARD))

const root = document.getElementById('root')
if (!root) throw new Error('#root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
