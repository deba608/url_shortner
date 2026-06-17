import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Set it in frontend/.env.local (dev) and your Vercel env vars (prod).')
}

// Configure Clerk's bot-protection CAPTCHA widget to match our dark UI.
// The "clerk-captcha" div id in Register.jsx acts as the mount point for the
// Cloudflare Turnstile widget that Clerk renders during custom sign-up flows.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        captcha: {
          theme: 'dark',
          size: 'flexible',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
