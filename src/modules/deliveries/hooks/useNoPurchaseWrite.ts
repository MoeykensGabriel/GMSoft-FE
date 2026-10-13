import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, newRequestId } from '../../core'
import { SESION_ACTUAL } from '../../sessions'
import type { NoPurchaseReason } from '../../customers'
import { deliveryService } from '../services/deliveryService'
import type { RegisterDeliveryRequest } from '../services/deliveryService'

/** Conserva cuerpo y clave ante respuesta incierta, igual que la recarga. */
export function useNoPurchaseWrite(customerId: string) {
  const cache = useQueryClient()
  const sending = useRef(false)
  const completed = useRef(false)
  const attempt = useRef<RegisterDeliveryRequest | null>(null)
  const [locked, setLocked] = useState(false)
  const mutation = useMutation({
    mutationFn: deliveryService.register,
    retry: false,
    onSuccess: () => {
      completed.current = true
      void cache.invalidateQueries({ queryKey: SESION_ACTUAL })
      void cache.invalidateQueries({ queryKey: ['sessions'] })
      void cache.invalidateQueries({ queryKey: ['customers'] })
    },
  })
  async function send(reason: NoPurchaseReason, notes: string) {
    if (sending.current || completed.current) return false
    sending.current = true
    attempt.current ??= { customerId, newCustomer: null, type: 'NoPurchase', noPurchaseReason: reason,
      notes: notes.trim() || null, items: [], containersOut: [], containersIn: [], payment: null,
      clientRequestId: newRequestId() }
    setLocked(true)
    try { await mutation.mutateAsync(attempt.current); return true }
    catch { return false } // ErrorMessage muestra el error; se conserva el intento.
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
