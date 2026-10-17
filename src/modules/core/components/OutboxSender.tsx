import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { flushOutbox } from '../lib/outbox'

/** Reenvía la bandeja de salida: al entrar, cada 30 segundos y cuando vuelve la señal. */
export function OutboxSender({ userId }: { userId: string }) {
  const client = useQueryClient()
  useEffect(() => {
    if (!userId) return
    const flush = () => { void flushOutbox(userId, client) }
    flush()
    const timer = window.setInterval(flush, 30_000)
    window.addEventListener('online', flush)
    return () => { window.clearInterval(timer); window.removeEventListener('online', flush) }
  }, [userId, client])
  return null
}
