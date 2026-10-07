import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ErrorMessage, formatMoney, Page, Badge, Button, DataTable, Field, ManagementHeader } from '../../core'
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

  if (catalogo.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (catalogo.isError) return <p className="p-6 text-danger">No se pudo leer el catálogo.</p>

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
    <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:p-6">
      <ManagementHeader title="Catálogo" description="Productos, precios de venta y seguimiento de envases." createTo="/panel/catalogo/nuevo" createLabel="Nuevo producto" />
      <div className="ui-toolbar"><Field label="Buscar por detalle" name="productSearch" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
      <ErrorMessage error={error} />
      {total > todos.length && <p className="text-sm text-muted">Se muestran los primeros {todos.length} de {total} productos.</p>}
      {items.length === 0 ? <p className="text-sm text-muted">{todos.length === 0 ? 'Todavía no hay productos cargados.' : 'Ningún producto coincide.'}</p> :
        <DataTable label="Catálogo de productos" className="min-w-[44rem]">
          <thead><tr><th scope="col">Producto</th><th scope="col">Envases</th><th scope="col" className="text-right">Precio</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{items.map((p) => <tr key={p.id}>
            <td><span className="font-semibold">{p.detail}</span>{p.commercialDetail && <span className="block text-xs text-muted">{p.commercialDetail}</span>}</td>
            <td>{SEGUIMIENTO[p.tracking]}</td><td className="text-right whitespace-nowrap tabular-nums">{formatMoney(p.salePrice)}</td>
            <td><Badge tone={p.isPublished ? 'success' : 'neutral'}>{p.isPublished ? 'Publicado' : 'No publicado'}</Badge></td>
            <td><div className="flex flex-wrap items-center gap-2">
              <Link to={`/panel/catalogo/${p.id}`} className="ui-link inline-flex min-h-11 items-center" aria-label={`Editar producto ${p.detail}`}>Editar</Link>
              <Button type="button" variant="secondary" disabled={publicar.isPending} onClick={() => publicar.mutate(p)}>{p.isPublished ? 'Despublicar' : 'Publicar'}</Button>
              <Button type="button" variant="danger" disabled={eliminar.isPending} onClick={() => { if (confirm(`¿Eliminar "${p.detail}"?`)) eliminar.mutate(p.id) }}>Eliminar</Button>
            </div></td>
          </tr>)}</tbody>
        </DataTable>}
    </Page>
  )
}
