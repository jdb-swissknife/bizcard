import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// GitHub Pages SPA redirect: if we got here via the 404.html trick,
// replace the URL with the actual path
const params = new URLSearchParams(window.location.search)
const redirect = params.get('_redirect')
if (redirect) {
  const decoded = decodeURIComponent(redirect)
  params.delete('_redirect')
  const qs = params.toString()
  window.history.replaceState(null, '', decoded + (qs ? '?' + qs : ''))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/bizcard">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
