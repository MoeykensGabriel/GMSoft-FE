import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../services/sessionService'
import type { OpenSessionRequest } from '../services/sessionService'

export const SESION_ACTUAL = ['session', 'current'] as const

/** La salida en curso del chofer. Null si todavia no abrio ninguna. */
export function useCurrentSession() {
  return useQuery({
    queryKey: SESION_ACTUAL,
    queryFn: sessionService.getCurrent,
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

export function usePostponeVisit() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: sessionService.postponeVisit,
    onSuccess: () => cache.invalidateQueries({ queryKey: SESION_ACTUAL }),
  })
}
