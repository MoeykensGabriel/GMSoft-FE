import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Un 401 o un 403 no se arreglan reintentando: el token vencio o al usuario
      // le falta permiso. Reintentar solo demora el mensaje de error.
      retry: (intentos, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return intentos < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
