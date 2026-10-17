import { useSyncExternalStore } from 'react'
import { postpone } from '../utils/routeLater'

// Un registro por salida: si otro chofer usa el mismo celular, no borra los pospuestos
// de una salida que sigue abierta. Una salida nueva arranca sin pospuestos.
const PREFIX = 'gmsoft.route.later.'
const key = (sessionId: string) => PREFIX + sessionId
const EMPTY: string[] = []
// Si localStorage rechaza escrituras, los pospuestos siguen en memoria en esta ejecución.
const memory = new Map<string, string[]>()
// La lectura se recuerda por texto guardado: mientras no cambie, React recibe la misma lista.
const cache = new Map<string, { raw: string | null; ids: string[] }>()
const listeners = new Set<() => void>()

function parse(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? 'null')
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string') ? parsed : EMPTY
  } catch { return EMPTY }
}

function read(sessionId: string): string[] {
  let raw: string | null
  try { raw = localStorage.getItem(key(sessionId)) } catch { return memory.get(sessionId) ?? EMPTY }
  if (raw === null && memory.has(sessionId)) return memory.get(sessionId)!
  const cached = cache.get(sessionId)
  if (cached && cached.raw === raw) return cached.ids
  const ids = parse(raw)
  cache.set(sessionId, { raw, ids })
  return ids
}

const notify = () => listeners.forEach((listener) => listener())

/** Clientes que pidieron que el chofer vuelva más tarde, en esta salida. */
export const routeLaterStorage = {
  postpone(sessionId: string, customerId: string) {
    // Se lee lo guardado justo antes de escribir: otra pestaña pudo haber pospuesto a alguien.
    const ids = postpone(read(sessionId), customerId)
    memory.set(sessionId, ids)
    try { localStorage.setItem(key(sessionId), JSON.stringify(ids)) } catch { /* Queda en memoria. */ }
    notify()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    // Lo que pospone otra pestaña llega por el evento storage.
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key.startsWith(PREFIX)) listener() }
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
  },
}

export function useRouteLater(sessionId: string): string[] {
  return useSyncExternalStore(routeLaterStorage.subscribe, () => read(sessionId))
}
