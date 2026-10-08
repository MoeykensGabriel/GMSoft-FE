import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, newRequestId } from '../../core'
import { sessionService, SESION_ACTUAL } from '../../sessions'
import type { RegisterRestockRequest } from '../../sessions'

/** Congela el cuerpo y la clave; el ref bloquea doble toque incluso antes del render. */
export function useRestockWrite(sessionId: string) {
  const cache = useQueryClient()
  const sending = useRef(false)
  const completed = useRef(false)
  const attempt = useRef<RegisterRestockRequest | null>(null)
  const [locked, setLocked] = useState(false)
  const mutation = useMutation({
    mutationFn: (body: RegisterRestockRequest) => sessionService.registerRestock(sessionId, body),
    retry: false,
    onSuccess: () => {
      completed.current = true
      // El stock vive en las consultas de salida; también refrescamos flota y salidas activas.
      void cache.invalidateQueries({ queryKey: ['sessions'] })
      void cache.invalidateQueries({ queryKey: SESION_ACTUAL })
      void cache.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
  async function send(body: Omit<RegisterRestockRequest, 'clientRequestId'>) {
    if (sending.current || completed.current) return
    sending.current = true
    if (!attempt.current) attempt.current = structuredClone({ ...body, clientRequestId: newRequestId() })
    setLocked(true)
    try { await mutation.mutateAsync(attempt.current) }
    catch { /* ErrorMessage muestra el error. El intento sigue intacto para reintentar. */ }
    finally { sending.current = false }
  }
  const canCorrect = mutation.error instanceof ApiError && [400, 403, 404, 409].includes(mutation.error.status)
  function correct() {
    if (sending.current || !canCorrect) return
    attempt.current = null
    setLocked(false)
    mutation.reset()
  }
  function startAnother() {
    if (sending.current || !completed.current) return
    attempt.current = null
    completed.current = false
    setLocked(false)
    mutation.reset()
  }
  return { ...mutation, send, locked, canCorrect, correct, startAnother }
}
