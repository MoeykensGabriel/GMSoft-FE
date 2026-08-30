import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../services/sessionService'
import type { CloseSessionRequest, OpenSessionRequest } from '../services/sessionService'

export const SESION_ACTUAL = ['session', 'current'] as const

/** La salida en curso del chofer. Null si todavia no abrio ninguna. */
export function useCurrentSession() {
  return useQuery({
    queryKey: SESION_ACTUAL,
    queryFn: sessionService.getCurrent,
  })
}

export function useCloseSession(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CloseSessionRequest) => sessionService.close(sessionId, body),
    // Cerrada deja de ser la sesion en curso: lo cacheado dice que sigue abierta.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESION_ACTUAL }),
  })
}

export function useOpenSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: OpenSessionRequest) => sessionService.open(body),
    // Al abrir, lo que estaba cacheado como "no hay sesion" quedo viejo.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESION_ACTUAL }),
  })
}
