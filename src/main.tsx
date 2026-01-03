import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Garante registro/atualização do Service Worker (evita ficar preso em versão antiga no Android)
const intervalMS = 60 * 60 * 1000
const updateSW = registerSW({
  immediate: true,
  onRegistered(r) {
    // checa updates periodicamente
    r && setInterval(() => r.update(), intervalMS)
  },
  onNeedRefresh() {
    // evita loop de reload
    const key = 'pwa:reloaded'
    if (sessionStorage.getItem(key) === '1') return
    sessionStorage.setItem(key, '1')
    updateSW(true)
  },
  onRegisterError(error) {
    console.log('[PWA] SW registration error', error)
  },
})

createRoot(document.getElementById("root")!).render(<App />);
