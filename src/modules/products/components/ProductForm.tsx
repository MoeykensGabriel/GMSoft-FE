import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ErrorMessage, Field, Select } from '../../core'
import type { ContainerTracking, Product, ProductInput } from '../services/productService'

/**
 * Como se sigue el envase, dicho en el idioma del negocio y no en el del enum.
 * Es el campo que mas define al producto y el menos obvio de todo el formulario.
 */
const SEGUIMIENTO: { valor: ContainerTracking; etiqueta: string }[] = [
  { valor: 'None', etiqueta: 'No lleva envase' },
  { valor: 'ByBalance', etiqueta: 'Por cantidad — bidones, sifones' },
  { valor: 'ByUnit', etiqueta: 'Por número de serie — dispensers frío/calor' },
]

interface Props {
  /** El producto a editar. Sin esto el formulario es un alta. */
  inicial?: Product
  guardando: boolean
  error: unknown
  onSubmit: (input: ProductInput) => void
}

export function ProductForm({ inicial, guardando, error, onSubmit }: Props) {
  const [detail, setDetail] = useState(inicial?.detail ?? '')
  const [commercialDetail, setCommercialDetail] = useState(inicial?.commercialDetail ?? '')
  const [salePrice, setSalePrice] = useState(inicial ? String(inicial.salePrice) : '')
  const [tracking, setTracking] = useState<ContainerTracking>(inicial?.tracking ?? 'ByBalance')
  const [isPublished, setIsPublished] = useState(inicial?.isPublished ?? true)
  const [imageUrl, setImageUrl] = useState(inicial?.imageUrl ?? '')

  function submit(e: FormEvent) {
    e.preventDefault()

    // Un texto vacio no es lo mismo que "sin dato": el backend espera null en los
    // opcionales y guardar "" haria que el campo parezca cargado.
    onSubmit({
      detail: detail.trim(),
      commercialDetail: commercialDetail.trim() || null,
      salePrice: Number(salePrice),
      tracking,
      isPublished,
      imageUrl: imageUrl.trim() || null,
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        label="Detalle"
        name="detail"
        required
        maxLength={200}
        placeholder="Bidón 20 litros"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />

      <Field
        label="Detalle comercial (opcional)"
        name="commercialDetail"
        maxLength={200}
        placeholder="Cómo se lo nombra al cliente"
        value={commercialDetail}
        onChange={(e) => setCommercialDetail(e.target.value)}
      />

      <Field
        label="Precio de lista"
        name="salePrice"
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        required
        value={salePrice}
        onChange={(e) => setSalePrice(e.target.value)}
      />

      <div className="flex flex-col gap-1">
        <Select
          label="Cómo se sigue el envase"
          name="tracking"
          value={tracking}
          onChange={(e) => setTracking(e.target.value as ContainerTracking)}
        >
          {SEGUIMIENTO.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.etiqueta}
            </option>
          ))}
        </Select>
        <span className="text-xs text-slate-500">
          Una vez que hay envases de este producto en la calle ya no se puede cambiar: los
          que están afuera quedarían contados de una forma que el producto ya no usa.
        </span>
      </div>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          name="isPublished"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">Publicado</span>
          <span className="text-xs text-slate-500">
            Solo los publicados aparecen para cargar el camión y vender.
          </span>
        </span>
      </label>

      <Field
        label="Imagen (opcional)"
        name="imageUrl"
        type="url"
        maxLength={500}
        placeholder="https://..."
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <ErrorMessage error={error} />

      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
