// Covo's real sidebar component, mounted on its own in the admin's left rail.
import { html, render } from '../vendor/preact-htm.js'
import { api } from './api.js'
import { set, get, setUI } from './store.js'
import { setLang } from './lib/i18n.js'
import { Sidebar } from './components/Panels.js'

const token = new URLSearchParams(location.search).get('token') || ''
document.documentElement.dataset.embed = 'sidebar'
window.COVO_EMBED_TOKEN = token

const app = document.getElementById('app')
if (!token) {
  app.textContent = 'Missing sidebar token'
} else {
  try {
    await api.refresh()
    setLang(get().settings?.profile?.language || 'en')
    setUI({ layout: 'desktop', tab: 'chat' })
    api.connect()
    render(html`<${Sidebar} />`, app)
  } catch (e) {
    app.textContent = `Sidebar unavailable: ${e.message}`
  }
}
