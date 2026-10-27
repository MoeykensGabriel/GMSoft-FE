/** Único criterio para reconocer dispenser, independiente del tracking. */
export function isDispenser(detail: string): boolean {
  return detail.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes('dispenser')
}

/** Devuelve una copia: conserva los objetos y no modifica la lista original. */
export function sortProducts<T>(list: readonly T[], getDetail: (product: T) => string): T[] {
  return [...list].sort((a, b) => Number(isDispenser(getDetail(a))) - Number(isDispenser(getDetail(b)))
    || getDetail(a).localeCompare(getDetail(b), 'es'))
}
