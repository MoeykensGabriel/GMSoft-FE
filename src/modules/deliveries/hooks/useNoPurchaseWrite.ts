import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, isDefiniteRejection, newRequestId, outbox } from '../../core'
import { useAuth } from '../../auth'
import { SESION_ACTUAL, useCurrentSession } from '../../sessions'
import type { NoPurchaseReason } from '../../customers'
import { NO_PURCHASE_REASONS } from '../../customers'
import { deliveryService } from '../services/deliveryService'
import type { RegisterDeliveryRequest } from '../services/deliveryService'
import { visitOutboxItem } from '../utils/visitOutbox'

/**
 * Conserva cuerpo y clave ante respuesta incierta, igual que la recarga. El envío pasa por la
 * bandeja del celular: si la respuesta se pierde queda guardado y se reenvía solo.
 * `send` devuelve 'ok' (confirmado), 'saved' (guardado en el celular) o 'error' (rechazo).
 */
export function useNoPurchaseWrite(customerId: string, customerName = 'Cliente') {
  const cache = useQueryClient()
  const { user } = useAuth()
  const session = useCurrentSession()
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
  async function send(reason: NoPurchaseReason, notes: string): Promise<'ok' | 'saved' | 'error'> {
    if (sending.current || completed.current) return 'error'
    sending.current = true
    const userId = user?.userId ?? ''
    if (!attempt.current) {
      attempt.current = { customerId, newCustomer: null, type: 'NoPurchase', noPurchaseReason: reason,
        notes: notes.trim() || null, items: [], containersOut: [], containersIn: [], payment: null,
        clientRequestId: newRequestId(), expectedSessionId: session.data?.id ?? null }
      if (userId && session.data) outbox.put(visitOutboxItem({ userId, sessionId: session.data.id, body: attempt.current,
        label: `${customerName}: no compró (${NO_PURCHASE_REASONS[reason]})` }))
    }
    setLocked(true)
    try {
      await mutation.mutateAsync(attempt.current)
      outbox.remove(userId, attempt.current.clientRequestId)
      return 'ok'
    } catch (error) {
      if (error instanceof ApiError && isDefiniteRejection(error.status)) {
        outbox.remove(userId, attempt.current.clientRequestId)
        return 'error' // ErrorMessage muestra el rechazo y se puede corregir.
      }
      return 'saved' // Respuesta perdida: queda en la bandeja y se reenvía sola.
    } finally { sending.current = false }
  }
  const canCorrect = mutation.error instanceof ApiError && isDefiniteRejection(mutation.error.status)
  function correct() {
    if (sending.current || !canCorrect) return
    attempt.current = null
    setLocked(false)
    mutation.reset()
  }
  return { ...mutation, send, locked, canCorrect, correct }
}
