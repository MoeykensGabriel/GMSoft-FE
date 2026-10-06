import { Button } from './Button'

export function Pagination({ page, totalPages, hasPreviousPage, hasNextPage, onChange }: {
  page: number; totalPages: number; hasPreviousPage: boolean; hasNextPage: boolean; onChange: (page: number) => void
}) {
  return <nav aria-label="Páginas del listado" className="flex flex-wrap items-center justify-between gap-3">
    <Button variant="secondary" disabled={!hasPreviousPage} onClick={() => onChange(page - 1)}>Anterior</Button>
    <span className="text-sm">Página {page} de {Math.max(1, totalPages)}</span>
    <Button variant="secondary" disabled={!hasNextPage} onClick={() => onChange(page + 1)}>Siguiente</Button>
  </nav>
}
