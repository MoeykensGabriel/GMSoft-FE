export function formerZone(notes?: string | null): string | null {
  return notes?.match(/figuraba en ([^.\r\n]+)/i)?.[1].trim() || null
}

export function normalizeZoneName(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}
