const DEVICE_KEY = 'gmsoft.device-id'

/**
 * Un identificador que queda guardado en el celular. Si en la próxima entrada llega
 * otro, el celular borró los datos de la página (o se entró desde otro navegador):
 * así lo distingue el control de sesiones.
 */
export function deviceId(): string | undefined {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id && typeof crypto.randomUUID === 'function') {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id ?? undefined
  } catch {
    return undefined
  }
}

/** La app está abierta desde el ícono instalado y no desde una pestaña del navegador. */
export function isInstalledApp(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}
