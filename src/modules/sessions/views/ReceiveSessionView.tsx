import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Field } from '../../core'
import { ReturnsEditor } from '../components/ReturnsEditor'
import type { ReturnLine } from '../components/ReturnsEditor'
import { sessionService } from '../services/sessionService'
import type { CloseSessionResult } from '../services/sessionService'

/**
 * El control de recepcion, del lado de la oficina: vuelve el camion, se cuenta lo
 * que trae y con eso se cierra la salida.
 *
 * Lo hace quien recibe y no quien trae el camion. Si contara el mismo chofer, el
 * control seria una copia de lo que el ya dijo y el faltante nunca aparecería.
 */
export function ReceiveSessionView() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const sesion = useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionService.getById(id),
  })

  const [kilometros, setKilometros] = useState('')
  const [devoluciones, setDevoluciones] = useState<ReturnLine[]>([])
  const [resultado, setResultado] = useState<CloseSessionResult | null>(null)

  const recibir = useMutation({
    mutationFn: (body: Parameters<typeof sessionService.close>[1]) =>
      sessionService.close(id, body),
    onSuccess: (r) => {
      setResultado(r)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  if (sesion.isLoading) return <p className="p-6 text-slate-500">Cargando...</p>
  if (!sesion.data) return <p className="p-6 text-red-600">No se encontró la salida.</p>

  const s = sesion.data

  if (resultado) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-slate-900">Camión recibido</h1>

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
              Queda registrado en la salida. No se le descuenta a nadie.
            </p>
          </div>
        )}

        <Link
          to={`/panel/salidas/${id}`}
          className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
        >
          Ver la salida y liquidar
        </Link>
      </main>
    )
  }

  if (s.status === 'Closed') {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-3 p-6">
        <h1 className="text-xl font-semibold text-slate-900">Ya recibido</h1>
        <p className="text-sm text-slate-600">
          Esta salida ya está cerrada. La recepción se hace una sola vez.
        </p>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-slate-900 underline">
          Ver la salida
        </Link>
      </main>
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()

    recibir.mutate({
      kilometersAtClose: Number(kilometros),
      // Solo las cantidades mayores a cero: devolver cero no es una devolucion, y
      // el backend rechaza esas lineas.
      returns: devoluciones.flatMap((l) => [
        ...(l.llenos > 0
          ? [{ productId: l.productId, state: 'Full' as const, quantity: l.llenos }]
          : []),
        ...(l.vacios > 0
          ? [{ productId: l.productId, state: 'Empty' as const, quantity: l.vacios }]
          : []),
      ]),
    })
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-slate-500 hover:underline">
          ← Salida
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Recepción del camión</h1>
        <p className="mt-1 text-sm text-slate-600">
          {s.driverName} · {s.zoneName} · {s.vehicleName} ({s.vehicleLicensePlate})
        </p>
        <p className="text-sm text-slate-500">Salió con {s.kilometersAtOpen} km</p>
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

      <ReturnsEditor stock={s.stock} lineas={devoluciones} onChange={setDevoluciones} />

      <ErrorMessage error={recibir.error} />

      <Button type="submit" disabled={recibir.isPending}>
        {recibir.isPending ? 'Recibiendo...' : 'Recibir y cerrar la salida'}
      </Button>
    </form>
  )
}
