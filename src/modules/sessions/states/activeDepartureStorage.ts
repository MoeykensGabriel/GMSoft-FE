const CHANGED = 'gmsoft:departure-changed'
const key = (userId: string) => `gmsoft.departure.${userId}`

/** Solo recuerda el ID. El estado y el permiso para cerrar siempre los decide la API. */
export const activeDepartureStorage = {
  read: (userId: string) => localStorage.getItem(key(userId)),
  write: (userId: string, id: string) => {
    if (localStorage.getItem(key(userId)) === id) return
    localStorage.setItem(key(userId), id)
    window.dispatchEvent(new Event(CHANGED))
  },
  clear: (userId: string) => {
    localStorage.removeItem(key(userId))
    window.dispatchEvent(new Event(CHANGED))
  },
  subscribe: (onChange: () => void) => {
    window.addEventListener(CHANGED, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGED, onChange)
      window.removeEventListener('storage', onChange)
    }
  },
}
