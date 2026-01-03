import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Garante registro do Service Worker (necessário para aparecer o prompt de instalar no Android)
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(<App />);
