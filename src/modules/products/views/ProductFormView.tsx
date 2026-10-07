import { Page, PageHeader } from '../../core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '../components/ProductForm'
import { productService } from '../services/productService'
import type { ProductInput } from '../services/productService'

/**
 * Alta y edicion de un producto. Es la misma pantalla: la unica diferencia es si hay
 * un id en la ruta, y separarlas duplicaria el formulario entero por esa sola linea.
 */
export function ProductFormView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const producto = useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => productService.getById(id!),
    enabled: Boolean(id),
  })

  const guardar = useMutation({
    // El alta devuelve el id y la edicion no devuelve nada; aca no se usa ninguno de
    // los dos, asi que la mutacion se queda sin resultado y las dos ramas encajan.
    mutationFn: async (input: ProductInput) => {
      if (id) await productService.update(id, input)
      else await productService.create(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/panel/catalogo')
    },
  })

  if (id && producto.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (id && !producto.data) return <p className="p-6 text-danger">No se encontró el producto.</p>

  return (
    <Page className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div>
        <Link to="/panel/catalogo" className="text-sm text-muted hover:underline">
          ← Catálogo
        </Link>
        <PageHeader title={<>
          {id ? 'Editar producto' : 'Nuevo producto'}
        </>} />
      </div>

      <ProductForm
        inicial={producto.data}
        guardando={guardar.isPending}
        error={guardar.error}
        onSubmit={(input) => guardar.mutate(input)}
      />
    </Page>
  )
}
