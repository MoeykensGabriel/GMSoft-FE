import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { queryClient } from '../modules/core'
import { AuthProvider } from '../modules/auth'

/**
 * Raiz de composicion. Es el unico lugar de la app que conoce a todos los modulos:
 * los modulos entre si se hablan por sus index, nunca importandose por dentro.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
