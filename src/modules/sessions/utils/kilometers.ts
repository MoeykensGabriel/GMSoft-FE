/** Más que esto sobre el último registrado casi siempre es un dígito de más. */
export const KM_SALTO_SOSPECHOSO = 1000

export type KmCheck =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; salto: number }

/**
 * Lo que puso el chofer contra el último kilometraje del camión: vacío o menor no deja
 * seguir (el sistema lo rechaza igual); un salto grande pide confirmarlo. Con el km sin
 * revisar no se compara: vale lo que marca el tablero, y la oficina lo revisa.
 */
export function checkKilometers(valor: string, ultimo: number | null | undefined, sinRevisar = false): KmCheck {
  const texto = valor.trim()
  if (!texto) return { ok: false, error: 'Poné el kilometraje que marca el camión.' }
  const km = Number(texto)
  if (!Number.isInteger(km) || km < 0) return { ok: false, error: 'Poné el kilometraje en números enteros.' }
  if (ultimo == null || sinRevisar) return { ok: true }
  if (km < ultimo) return { ok: false, error: `No puede ser menor que el último registrado (${ultimo.toLocaleString('es-AR')} km).` }
  if (km - ultimo > KM_SALTO_SOSPECHOSO) return { ok: false, salto: km - ultimo }
  return { ok: true }
}
