import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const root = document.getElementById('root')!

async function init() {
  try {
    await import('./i18n')
    const { default: App } = await import('./App.tsx')
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (e) {
    const msg = (e as Error).message
    const isEnv = msg.includes('Missing Supabase') || msg.includes('environment')
    root.innerHTML = `
      <div style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:24px;text-align:center;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
        <h2 style="color:#b91c1c;margin:0 0 12px;">خطأ في الإعداد</h2>
        <p style="color:#991b1b;margin:0 0 16px;">${isEnv ? 'المتغيرات البيئية (Supabase) غير مضبوطة. أضف VITE_PUBLIC_SUPABASE_URL و VITE_PUBLIC_SUPABASE_ANON_KEY في Vercel → Settings → Environment Variables ثم أعد النشر.' : msg}</p>
        <a href="https://vercel.com/docs/environment-variables" target="_blank" rel="noopener" style="color:#dc2626;text-decoration:underline;">كيفية إضافة المتغيرات في Vercel</a>
      </div>
    `
  }
}

init()
