import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ErrorMessage, formatMoney } from '../../core'
import { productService } from '../services/productService'
import type { ContainerTracking, Product } from '../services/productService'

/** Etiqueta corta para la fila; la larga vive en el formulario, que es donde se elige. */
const SEGUIMIENTO: Record<ContainerTracking, string> = {
  None: 'Sin envase',
  ByBalance: 'Por cantidad',
  ByUnit: 'Por serie',
}

/** El catálogo del admin: qué se vende, a cuánto y cómo se sigue su envase. */
export function ProductListView() {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<unknown>(null)

  const catalogo = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productService.list(),
  })

  function alTerminar() {
    setError(null)
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  // Publicar y despublicar es el interruptor de todos los dias: decide si el producto
  // aparece o no para cargar el camion. Merece estar en la fila y no adentro del
  // formulario de edicion.
  const publicar = useMutation({
    mutationFn: (p: Product) => {
      const { id, ...input } = p
      return productService.update(id, { ...input, isPublished: !p.isPublished })
    },
    onSuccess: alTerminar,
    onError: (e) => setError(e),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: alTerminar,
    onError: (e) => setError(e),
  })

  if (catalogo.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (catalogo.isError) return <p className="p-6 text-red-600">No se pudo leer el catálogo.</p>

  const todos = catalogo.data?.items ?? []
  const total = catalogo.data?.totalCount ?? 0

  const termino = busqueda.trim().toLowerCase()
  const items = termino
    ? todos.filter(
        (p) =>
          p.detail.toLowerCase().includes(termino) ||
          (p.commercialDetail ?? '').toLowerCase().includes(termino),
      )
    : todos

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div>
        <Link to="/" className="text-sm text-slate-500 hover:underline">
          ← Panel
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Catálogo</h1>
          <Link
            to="/panel/catalogo/nuevo"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      <input
        type="search"
        placeholder="Buscar por detalle"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
      />

      <ErrorMessage error={error} />

      {total > todos.length && (
        <p className="text-xs text-slate-500">
          Se muestran los primeros {todos.length} de {total} productos.
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          {todos.length === 0 ? 'Todavía no hay productos cargados.' : 'Ningún producto coincide.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.detail}</p>
                  {p.commercialDetail && (
                    <p className="text-xs text-slate-500">{p.commercialDetail}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{SEGUIMIENTO[p.tracking]}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-slate-900">
                    {formatMoney(p.salePrice)}
                  </span>
                  {!p.isPublished && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      No publicado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-2 text-xs">
                <Link to={`/panel/catalogo/${p.id}`} className="text-slate-700 hover:underline">
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => publicar.mutate(p)}
                  disabled={publicar.isPending}
                  className="text-slate-700 hover:underline disabled:text-slate-400"
                >
                  {p.isPublished ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar "${p.detail}"?`)) eliminar.mutate(p.id)
                  }}
                  disabled={eliminar.isPending}
                  className="text-red-600 hover:underline disabled:text-slate-400"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
