import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, Button, Field } from '../../core'
import { ReturnsEditor } from '../components/ReturnsEditor'
import type { ReturnLine } from '../components/ReturnsEditor'
import { useCloseSession, useCurrentSession } from '../hooks/useCurrentSession'
import type { CloseSessionResult } from '../services/sessionService'

/**
 * Cierre de la salida. Es el control de recepcion: se cuenta lo que volvio y el
 * sistema informa el faltante, que queda como dato del admin y no se le descuenta
 * a nadie.
 */
export function CloseSessionView() {
  const navigate = useNavigate()
  const { data: sesion, isLoading } = useCurrentSession()
  const cerrar = useCloseSession(sesion?.id ?? '')

  const [kilometros, setKilometros] = useState('')
  const [devoluciones, setDevoluciones] = useState<ReturnLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<CloseSessionResult | null>(null)

  if (isLoading) return <p className="p-6 text-slate-500">Cargando...</p>

  if (!sesion && !resultado) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-slate-700">No hay una salida abierta para cerrar.</p>
        <Link to="/reparto" className="mt-2 inline-block text-sm text-slate-900 underline">
          Volver
        </Link>
      </div>
    )
  }

  if (resultado) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-slate-900">Salida cerrada</h1>

        {resultado.cuadraTodo ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Cuadra todo: no falta nada.
          </p>
        ) : (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-800">Faltante</p>
            <ul className="mt-1">
              {resultado.faltante.map((l) => (
                <li key={l.productId} className="flex justify-between text-red-700">
                  <span>{l.productDetail}</span>
                  <span>
                    {l.fullOnBoard !== 0 && `${l.fullOnBoard} llenos`}
                    {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                    {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} vacíos`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-700">
              Queda registrado para que lo revise el admin. No se le descuenta a nadie.
            </p>
          </div>
        )}

        <Button onClick={() => navigate('/reparto')}>Volver</Button>
      </div>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const r = await cerrar.mutateAsync({
        kilometersAtClose: Number(kilometros),
        // Solo se mandan las cantidades mayores a cero: devolver cero no es una
        // devolucion, y el backend rechaza esas lineas.
        returns: devoluciones.flatMap((l) => [
          ...(l.llenos > 0
            ? [{ productId: l.productId, state: 'Full' as const, quantity: l.llenos }]
            : []),
          ...(l.vacios > 0
            ? [{ productId: l.productId, state: 'Empty' as const, quantity: l.vacios }]
            : []),
        ]),
      })

      setResultado(r)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.fieldMessages[0] ?? err.detail ?? err.title)
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cerrar salida</h1>
        <p className="mt-1 text-sm text-slate-600">
          {sesion!.zoneName} · {sesion!.vehicleName} ({sesion!.vehicleLicensePlate})
        </p>
        <p className="text-sm text-slate-500">Salió con {sesion!.kilometersAtOpen} km</p>
      </div>

      <Field
        label="Kilometraje de vuelta"
        name="kilometersAtClose"
        type="number"
        min={0}
        inputMode="numeric"
        required
        value={kilometros}
        onChange={(e) => setKilometros(e.target.value)}
      />

      <ReturnsEditor
        stock={sesion!.stock}
        lineas={devoluciones}
        onChange={setDevoluciones}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={cerrar.isPending}>
          {cerrar.isPending ? 'Cerrando...' : 'Cerrar salida'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/reparto')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
