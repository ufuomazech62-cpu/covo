// Covo's real Composer component, mounted on its own without the chat shell.
// Authenticated with a scoped API token passed by the host app (never a browser session).
import { html, render } from '../vendor/preact-htm.js'
import { api } from './api.js'
import { set, get } from './store.js'
import { setLang } from './lib/i18n.js'
import { Composer } from './components/Composer.js'

const token = new URLSearchParams(location.search).get('token') || ''
document.documentElement.dataset.embed = 'composer'
window.COVO_EMBED_TOKEN = token

// The host app's quick actions prefill this composer via postMessage.
window.addEventListener('message', (event) => {
  const data = event.data
  if (data?.type === 'covo:compose' && typeof data.text === 'string') {
    window.dispatchEvent(new CustomEvent('covo:compose', { detail: data.text }))
  }
})

const app = document.getElementById('app')
if (!token) {
  app.textContent = 'Missing composer token'
} else {
  try {
    await api.refresh()
    setLang(get().settings?.profile?.language || 'en')
    api.connect()
    render(html`<${Composer} autoFocus />`, app)
  } catch (e) {
    app.textContent = `Composer unavailable: ${e.message}`
  }
}
