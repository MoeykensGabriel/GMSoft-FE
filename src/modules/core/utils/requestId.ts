/**
 * Identificador de un envio, para que el backend reconozca un reintento y no lo
 * registre dos veces.
 *
 * No usa crypto.randomUUID: solo existe en contextos seguros, y el panel tambien se
 * abre por http://<ip de la red>, donde no esta. getRandomValues si.
 */
export function newRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
