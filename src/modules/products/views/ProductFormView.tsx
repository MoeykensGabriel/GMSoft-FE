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

  if (id && producto.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (id && !producto.data) return <p className="p-6 text-red-600">No se encontró el producto.</p>

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <div>
        <Link to="/panel/catalogo" className="text-sm text-slate-500 hover:underline">
          ← Catálogo
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          {id ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      <ProductForm
        inicial={producto.data}
        guardando={guardar.isPending}
        error={guardar.error}
        onSubmit={(input) => guardar.mutate(input)}
      />
    </main>
  )
}
