interface SeenRecord { sessionId: string; ids: string[] }
const key = (userId: string) => `gmsoft.restocks.seen.${userId}`
// Un único registro por usuario: cambiar de salida reemplaza las marcas anteriores.
// La memoria tiene prioridad incluso cuando localStorage existe pero rechaza escrituras.
const memory = new Map<string, SeenRecord | null>()
const listeners = new Set<() => void>()

function read(userId: string): SeenRecord | null {
  if (memory.has(userId)) return memory.get(userId) ?? null
  let record: SeenRecord | null = null
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? 'null')
    if (parsed && typeof parsed === 'object' && 'sessionId' in parsed && typeof parsed.sessionId === 'string' &&
      'ids' in parsed && Array.isArray(parsed.ids) && parsed.ids.every((id) => typeof id === 'string')) {
      record = { sessionId: parsed.sessionId, ids: parsed.ids }
    }
  } catch { /* Almacenamiento bloqueado o datos inválidos: empezamos en memoria. */ }
  memory.set(userId, record)
  return record
}

function write(userId: string, record: SeenRecord | null) {
  memory.set(userId, record)
  try {
    if (record) localStorage.setItem(key(userId), JSON.stringify(record))
    else localStorage.removeItem(key(userId))
  } catch { /* Las marcas siguen disponibles en memoria durante esta ejecución. */ }
  listeners.forEach((listener) => listener())
}

export const restockSeenStorage = {
  activate(userId: string, sessionId: string) {
    if (read(userId)?.sessionId !== sessionId) write(userId, { sessionId, ids: [] })
  },
  snapshot(userId: string, sessionId: string): string {
    const record = read(userId)
    return JSON.stringify(record?.sessionId === sessionId ? record.ids : [])
  },
  acknowledge(userId: string, sessionId: string, restockId: string) {
    const record = read(userId)
    const ids = record?.sessionId === sessionId ? record.ids : []
    write(userId, { sessionId, ids: [...new Set([...ids, restockId])] })
  },
  clear(userId: string) { write(userId, null) },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
}
