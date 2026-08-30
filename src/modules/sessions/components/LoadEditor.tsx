import { Field } from '../../core'
import type { Product } from '../../products'

export interface LoadLine {
  productId: string
  quantity: number
}

interface Props {
  productos: Product[]
  valor: LoadLine[]
  onChange: (lineas: LoadLine[]) => void
}

/**
 * La carga del camion: una fila por producto publicado, con la cantidad que sube.
 * Los que quedan en cero no se mandan, asi el backend no recibe lineas vacias.
 */
export function LoadEditor({ productos, valor, onChange }: Props) {
  function setCantidad(productId: string, cantidad: number) {
    const resto = valor.filter((l) => l.productId !== productId)
    onChange(cantidad > 0 ? [...resto, { productId, quantity: cantidad }] : resto)
  }

  const cantidadDe = (productId: string) =>
    valor.find((l) => l.productId === productId)?.quantity ?? 0

  if (productos.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No hay productos publicados. El admin tiene que publicarlos antes de que puedas cargar.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-slate-700">Qué subís al camión</span>
      {productos.map((p) => (
        <Field
          key={p.id}
          label={p.detail}
          name={`carga-${p.id}`}
          type="number"
          min={0}
          inputMode="numeric"
          value={cantidadDe(p.id) || ''}
          placeholder="0"
          onChange={(e) => setCantidad(p.id, Number(e.target.value) || 0)}
        />
      ))}
    </div>
  )
}
