import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Field, Page, PageHeader } from '../../core'
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

  if (sesion.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (!sesion.data) return <p className="p-6 text-danger">No se encontró la salida.</p>

  const s = sesion.data

  if (resultado) {
    return (
      <Page className="ui-card mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <PageHeader title={<>Camión recibido</>} />

        {resultado.cuadraTodo ? (
          <p className="rounded border border-success/30 bg-success-soft p-3 text-sm text-success-dark">
            Cuadra todo: no falta nada.
          </p>
        ) : (
          <div className="rounded border border-danger/30 bg-danger-soft p-3 text-sm">
            <p className="font-medium text-danger-dark">Faltante</p>
            <ul className="mt-1">
              {resultado.faltante.map((l) => (
                <li key={l.productId} className="flex justify-between text-danger">
                  <span>{l.productDetail}</span>
                  <span>
                    {l.fullOnBoard !== 0 && `${l.fullOnBoard} llenos`}
                    {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                    {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} vacíos`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-danger">
              Queda registrado en la salida. No se le descuenta a nadie.
            </p>
          </div>
        )}

        <Link
          to={`/panel/salidas/${id}`}
          className="rounded bg-success px-4 py-2 text-center text-sm font-medium text-white hover:bg-success-dark"
        >
          Ver la salida y liquidar
        </Link>
      </Page>
    )
  }

  if (s.status === 'Closed') {
    return (
      <Page className="ui-card mx-auto flex max-w-3xl flex-col gap-3 p-6">
        <PageHeader title={<>Ya recibido</>} />
        <p className="text-sm text-muted">
          Esta salida ya está cerrada. La recepción se hace una sola vez.
        </p>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-ink underline">
          Ver la salida
        </Link>
      </Page>
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
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <div>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-muted hover:underline">
          ← Salida
        </Link>
        <PageHeader title={<>Recepción del camión</>} />
        <p className="mt-1 text-sm text-muted">
          {s.driverName} · {s.zoneName} · {s.vehicleName} ({s.vehicleLicensePlate})
        </p>
        <p className="text-sm text-muted">Salió con {s.kilometersAtOpen} km</p>
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
