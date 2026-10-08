import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../services/sessionService'
import type { OpenSessionRequest } from '../services/sessionService'
import { useAuth, ROLES } from '../../auth'
import { activeDepartureStorage } from '../states/activeDepartureStorage'

export const SESION_ACTUAL = ['session', 'current'] as const

/** La salida en curso del chofer. Null si todavia no abrio ninguna. */
export function useCurrentSession() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...SESION_ACTUAL, user?.userId],
    queryFn: sessionService.getCurrent,
    enabled: Boolean(user?.roles.includes(ROLES.driver)),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
  })
}

export function useOpenSession() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (body: OpenSessionRequest) => sessionService.open(body),
    // Al abrir, lo que estaba cacheado como "no hay sesion" quedo viejo.
    onSuccess: (id) => {
      if (user) activeDepartureStorage.write(user.userId, id)
      return queryClient.invalidateQueries({ queryKey: SESION_ACTUAL })
    },
  })
}

export function usePostponeVisit() {
  const cache = useQueryClient()
  return useMutation({
    mutationFn: sessionService.postponeVisit,
    onSuccess: () => cache.invalidateQueries({ queryKey: SESION_ACTUAL }),
  })
}
