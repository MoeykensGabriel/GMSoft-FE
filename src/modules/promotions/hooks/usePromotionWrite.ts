import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, newRequestId } from '../../core'
import { SESION_ACTUAL } from '../../sessions'
import type { PromotionResult } from '../services/promotionService'

/** Congela clave y cuerpo al confirmar. El ref bloquea incluso dos toques antes del render. */
export function usePromotionWrite<T extends { clientRequestId: string }>(write: (body: T) => Promise<PromotionResult>) {
  const cache = useQueryClient()
  const sending = useRef(false)
  const attempt = useRef<T | null>(null)
  const [locked, setLocked] = useState(false)
  const mutation = useMutation({ mutationFn: write, retry: false,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ['promotions'] })
      void cache.invalidateQueries({ queryKey: SESION_ACTUAL })
      void cache.invalidateQueries({ queryKey: ['customers'] })
    },
  })
  async function send(body: Omit<T, 'clientRequestId'>) {
    if (sending.current || mutation.isSuccess) return
    sending.current = true
    if (!attempt.current) attempt.current = structuredClone({ ...body, clientRequestId: newRequestId() }) as T
    setLocked(true)
    try { await mutation.mutateAsync(attempt.current) }
    catch { /* ErrorMessage presenta el error; se conserva el intento exacto. */ }
    finally { sending.current = false }
  }
  const canCorrect = mutation.error instanceof ApiError && [400, 403, 404, 409].includes(mutation.error.status)
  function correct() {
    if (sending.current || !canCorrect) return
    attempt.current = null
    setLocked(false)
    mutation.reset()
  }
  return { ...mutation, send, locked, canCorrect, correct }
}
