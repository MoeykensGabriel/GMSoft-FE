import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, ErrorMessage, Field } from '../../core'
import type { Zone, ZoneInput } from '../services/zoneService'

interface Props {
  /** La zona a editar. Sin esto el formulario es un alta. */
  inicial?: Zone
  guardando: boolean
  error: unknown
  onSubmit: (input: ZoneInput) => void
}

export function ZoneForm({ inicial, guardando, error, onSubmit }: Props) {
  const [name, setName] = useState(inicial?.name ?? '')
  const [notes, setNotes] = useState(inicial?.notes ?? '')
  const [isActive, setIsActive] = useState(inicial?.isActive ?? true)

  function submit(e: FormEvent) {
    e.preventDefault()

    onSubmit({
      name: name.trim(),
      notes: notes.trim() || null,
      // El alta no lo manda: una zona nueva nace activa y ofrecer la casilla ahi
      // seria ofrecer crear algo ya apagado.
      ...(inicial ? { isActive } : {}),
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        label="Nombre"
        name="name"
        required
        maxLength={100}
        placeholder="Tafí Viejo"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Field
        label="Notas (opcional)"
        name="notes"
        maxLength={500}
        placeholder="Referencias del recorrido"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {inicial && (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">Activa</span>
            <span className="text-xs text-slate-500">
              Solo las activas se ofrecen al abrir una salida. Los clientes que ya tiene
              siguen donde están.
            </span>
          </span>
        </label>
      )}

      <ErrorMessage error={error} />

      <Button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
