import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { Button, ErrorMessage, tokenStorage } from '../../core'
import { useCurrentSession } from '../hooks/useCurrentSession'
import { sessionService } from '../services/sessionService'
import { activeDepartureStorage } from '../states/activeDepartureStorage'

/** Acompaña al chofer tanto en el listado como en la ficha y el formulario de venta. */
export function DriverSessionLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const current = useCurrentSession()
  const userId = user?.userId ?? ''
  const sessionId = useSyncExternalStore(activeDepartureStorage.subscribe,
    () => userId ? activeDepartureStorage.read(userId) : null)
  const status = useQuery({
    queryKey: ['session', 'status', userId, sessionId],
    queryFn: () => sessionService.getStatus(sessionId!),
    enabled: Boolean(userId && sessionId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const completeReception = useCallback(() => {
    // Aviso efímero: la protección de rutas también puede redirigir al cerrar la cuenta.
    window.sessionStorage.setItem('gmsoft.reception-completed', '1')
    navigate('/login', { replace: true, state: { receptionCompleted: true } })
    activeDepartureStorage.clear(userId)
    logout()
  }, [userId, logout, navigate])

  useEffect(() => {
    if (userId && current.data?.status === 'Open' && !sessionId)
      activeDepartureStorage.write(userId, current.data.id)
  }, [userId, sessionId, current.data])

  useEffect(() => {
    // Una respuesta vacía o una caída de red no prueban que ADMIN haya recibido el camión.
    if (!userId || !sessionId || status.data?.status !== 'Closed') return
    completeReception()
  }, [userId, sessionId, status.data, completeReception])

  const departureOpen = status.data?.status === 'Open'
  useEffect(() => {
    if (!sessionId || !departureOpen) return
    let stopped = false
    let renewing = false
    const renew = async () => {
      if (renewing) return
      renewing = true
      const previousToken = tokenStorage.get()
      try {
        const response = await sessionService.keepAlive(sessionId)
        // Una respuesta tardía nunca debe volver a iniciar una cuenta que ya salió.
        if (stopped || previousToken !== tokenStorage.get()) return
        if (response.status === 'Closed') completeReception()
        else if (response.token) tokenStorage.set(response.token)
      } catch {
        // Sin conexión se conserva la salida; el control de recepción sigue reintentando.
      } finally {
        renewing = false
      }
    }
    void renew()
    const timer = window.setInterval(() => { void renew() }, 60_000)
    window.addEventListener('online', renew)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('online', renew)
    }
  }, [sessionId, departureOpen, completeReception])

  if (sessionId && status.data?.status === 'Closed') return null
  if (sessionId && status.isPending) return <p className="p-6" role="status">Comprobando tu salida...</p>
  if (sessionId && status.isError && !status.data) return <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
    <ErrorMessage error={status.error} fallback="No se pudo comprobar la salida. Sigue pendiente hasta que ADMIN reciba el camión." />
    <Button variant="secondary" onClick={() => status.refetch()}>Reintentar</Button>
  </div>

  return <>
    {sessionId && status.isError && <p role="status" className="mx-auto max-w-3xl border-b border-neutral-300 p-3 text-sm">Se perdió la conexión. Tu salida permanece abierta; se comprobará al reconectar.</p>}
    <Outlet />
  </>
}
