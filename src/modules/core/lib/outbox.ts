import { useSyncExternalStore } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { api, ApiError, tokenStorage } from './api'

/**
 * Bandeja de salida del celular. Un envío cuya respuesta se perdió queda guardado acá con
 * su clave (`id` = clientRequestId) y se reenvía solo, siempre igual: el backend devuelve
 * el registro original si ya había llegado, así que nunca se duplica. Sobrevive a salir de
 * la pantalla, a recargar la app y a volver a iniciar sesión.
 *
 * Es técnica a propósito: no sabe qué es una venta. Cada módulo pone su envío con una
 * descripción para mostrar y las consultas que hay que refrescar cuando se confirma.
 */
export interface OutboxItem {
  id: string
  userId: string
  /** La salida en que se cargó: los pendientes se muestran con su salida. */
  sessionId: string
  /** Para no dejar cargar otra visita al mismo cliente mientras esta no se confirme. */
  customerId: string | null
  label: string
  path: string
  body: unknown
  invalidate: unknown[][]
  /** pending: se sigue reenviando. failed: la API lo rechazó y hay que revisarlo a mano. */
  status: 'pending' | 'failed'
  error?: string
  createdAt: string
}

// Una clave por envío: guardar o quitar uno no reescribe los demás, así dos pestañas no se pisan.
const PREFIX = 'gmsoft.outbox.'
const userPrefix = (userId: string) => `${PREFIX}${userId}.`
const itemKey = (userId: string, id: string) => `${userPrefix(userId)}${id}`
const EMPTY: OutboxItem[] = []
// Solo si el celular no deja guardar: los envíos quedan en memoria mientras la app siga abierta.
const memory = new Map<string, Map<string, OutboxItem>>()
const storageFailed = new Set<string>()
// Se recuerda por texto guardado: mientras no cambie, React recibe la misma lista.
const cache = new Map<string, { raw: string; items: OutboxItem[] }>()
const listeners = new Set<() => void>()

function isItem(value: unknown): value is OutboxItem {
  return Boolean(value) && typeof value === 'object' && typeof (value as OutboxItem).id === 'string'
    && typeof (value as OutboxItem).path === 'string'
}

/** Lo guardado en el celular; null si el almacenamiento no se puede leer. */
function readStorage(userId: string): OutboxItem[] | null {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(userPrefix(userId))) keys.push(key)
    }
    keys.sort()
    const raws = keys.map((key) => localStorage.getItem(key) ?? '')
    const raw = raws.join('\n')
    const cached = cache.get(userId)
    if (cached && cached.raw === raw) return cached.items
    const items = raws.flatMap((text) => {
      try { const parsed: unknown = JSON.parse(text); return isItem(parsed) ? [parsed] : [] } catch { return [] }
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    cache.set(userId, { raw, items })
    return items
  } catch { return null }
}

function read(userId: string): OutboxItem[] {
  if (storageFailed.has(userId)) return [...(memory.get(userId)?.values() ?? [])]
  return readStorage(userId) ?? EMPTY
}

/** Lo pasa a memoria: desde ahora se lee de ahí, con lo que ya estaba guardado incluido. */
function fallBack(userId: string) {
  if (storageFailed.has(userId)) return memory.get(userId)!
  const map = new Map((readStorage(userId) ?? []).map((item) => [item.id, item]))
  memory.set(userId, map)
  storageFailed.add(userId)
  return map
}

const notify = () => listeners.forEach((listener) => listener())

/** 401, 408 y 429 no dicen nada de este envío (sesión vencida, demora, límite). */
export function isDefiniteRejection(status: number): boolean {
  return status >= 400 && status < 500 && ![401, 408, 429].includes(status)
}

export const outbox = {
  list: read,
  /**
   * Se guarda antes de mandar: si la respuesta se pierde, ya está a salvo. Devuelve false si
   * el celular no lo pudo guardar (queda solo en memoria hasta cerrar la app).
   */
  put(item: OutboxItem): boolean {
    let saved = false
    if (!storageFailed.has(item.userId)) {
      try { localStorage.setItem(itemKey(item.userId, item.id), JSON.stringify(item)); saved = true } catch { /* Abajo. */ }
    }
    if (!saved) fallBack(item.userId).set(item.id, item)
    notify()
    return saved
  },
  remove(userId: string, id: string) {
    memory.get(userId)?.delete(id)
    try { localStorage.removeItem(itemKey(userId, id)) } catch { /* Ya no está en memoria. */ }
    notify()
  },
  fail(userId: string, id: string, error: string) {
    const item = read(userId).find((i) => i.id === id)
    if (item) outbox.put({ ...item, status: 'failed', error })
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key.startsWith(PREFIX)) listener() }
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage) }
  },
}

export function useOutbox(userId: string): OutboxItem[] {
  return useSyncExternalStore(outbox.subscribe, () => read(userId))
}

const flushing = new Set<string>()

/**
 * Reenvía lo pendiente, de a uno y en el orden en que se cargó. Si no hay señal se corta y
 * se prueba en la próxima vuelta; un rechazo de la API queda marcado para revisar. Se corta
 * también si cambia la sesión del celular: un envío de un chofer nunca sale con el token de otro.
 */
export async function flushOutbox(userId: string, client: QueryClient): Promise<void> {
  if (!userId || flushing.has(userId)) return
  flushing.add(userId)
  const token = tokenStorage.get()
  try {
    for (const item of read(userId).filter((i) => i.status === 'pending')) {
      if (!token || tokenStorage.get() !== token) return
      try {
        await api.post(item.path, item.body)
        outbox.remove(userId, item.id)
        item.invalidate.forEach((queryKey) => { void client.invalidateQueries({ queryKey }) })
      } catch (error) {
        if (error instanceof ApiError && isDefiniteRejection(error.status)) {
          outbox.fail(userId, item.id, error.fieldMessages[0] ?? error.detail ?? error.title)
          continue
        }
        return // Sin señal o el servidor no respondió: se reintenta en la próxima vuelta.
      }
    }
  } finally {
    flushing.delete(userId)
  }
}
