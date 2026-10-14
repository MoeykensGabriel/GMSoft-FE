import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Providers } from './app/Providers'
import { AppRouter } from './app/router'
import { ScreenErrorBoundary } from './modules/core'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <ScreenErrorBoundary>
        <AppRouter />
      </ScreenErrorBoundary>
    </Providers>
  </StrictMode>,
)
