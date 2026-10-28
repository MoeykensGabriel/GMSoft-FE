import { zonesLabel } from '../../zones'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Field, Modal, Page, PageHeader, formatMoney, BackButton } from '../../core'
import { UnvisitedCustomersPanel } from '../components/UnvisitedCustomersPanel'
import { ReturnsEditor } from '../components/ReturnsEditor'
import type { ReturnLine } from '../components/ReturnsEditor'
import { detailedSettlementQuery } from '../hooks/detailedSettlementQuery'
import { sessionService } from '../services/sessionService'
import type { CloseSessionRequest, CloseSessionResult } from '../services/sessionService'
import { cashGap, containerGaps, describeGap } from '../utils/receptionSummary'

/** «Cuadra», «faltan $ 1.000» o «sobran $ 500»: positivo es plata que falta. */
function describeCash(diferencia: number) {
  if (diferencia === 0) return 'cuadra'
  return `${diferencia > 0 ? 'faltan' : 'sobran'} ${formatMoney(Math.abs(diferencia))}`
}

/**
 * El control de recepcion, del lado de la oficina: vuelve el camion, se cuenta lo
 * que trae y la plata que entrega el chofer, y con eso se cierra la salida.
 *
 * Lo hace quien recibe y no quien trae el camion. Si contara el mismo chofer, el
 * control seria una copia de lo que el ya dijo y el faltante nunca aparecería.
 *
 * Todo va junto y pasa por una confirmacion con el resumen: los envases, los
 * kilometros y la caja se ven antes de cerrar, con el chofer todavia adelante.
 */
export function ReceiveSessionView() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const sesion = useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: () => sessionService.getById(id),
  })
  // El efectivo que cobro en la calle: es lo que tiene que entregar.
  const cobros = useQuery({ ...detailedSettlementQuery(id), enabled: sesion.data?.status === 'Open' })

  const [kilometros, setKilometros] = useState('')
  const [devoluciones, setDevoluciones] = useState<ReturnLine[]>([])
  // Vacio a proposito, como los envases: si viniera con el numero puesto no se contaria.
  const [efectivo, setEfectivo] = useState('')
  const [rindeDespues, setRindeDespues] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [resultado, setResultado] = useState<CloseSessionResult | null>(null)

  const recibir = useMutation({
    mutationFn: (body: CloseSessionRequest) => sessionService.close(id, body),
    onSuccess: (r) => {
      setConfirmando(false)
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
            Envases: cuadra todo, no falta nada.
          </p>
        ) : (
          <div className="rounded border border-danger/30 bg-danger-soft p-3 text-sm">
            <p className="font-medium text-danger-dark">Faltante de envases</p>
            <ul className="mt-1">
              {resultado.faltante.map((l) => (
                <li key={l.productId} className="flex justify-between text-danger">
                  <span>{l.productDetail}</span>
                  <span>
                    {l.fullOnBoard !== 0 && `${l.fullOnBoard} ${l.fullOnBoard === 1 ? 'lleno' : 'llenos'}`}
                    {l.fullOnBoard !== 0 && l.emptyOnBoard !== 0 && ' · '}
                    {l.emptyOnBoard !== 0 && `${l.emptyOnBoard} ${l.emptyOnBoard === 1 ? 'vacío' : 'vacíos'}`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-danger">
              Queda registrado en la salida. No se le descuenta a nadie.
            </p>
          </div>
        )}

        {resultado.cashDifference === null ? (
          <p role="alert" className="rounded border border-warning/40 bg-warning-soft p-3 text-sm font-medium text-warning">
            Falta rendir la plata de esta salida. Queda avisado en el Home hasta que la cargues en la liquidación.
          </p>
        ) : (
          <p className={`rounded border p-3 text-sm ${resultado.cashDifference === 0
            ? 'border-success/30 bg-success-soft text-success-dark' : 'border-danger/30 bg-danger-soft text-danger-dark'}`}>
            Efectivo: {resultado.cashDifference === 0 ? 'la caja cuadra.' : `${describeCash(resultado.cashDifference)}.`}
          </p>
        )}

        <Link
          to={`/panel/salidas/${id}`}
          className="rounded bg-success px-4 py-2 text-center text-sm font-medium text-white hover:bg-success-dark"
        >
          Ver la salida
        </Link>
      </Page>
    )
  }

  if (s.status === 'Closed') {
    return (
      <Page className="ui-card mx-auto flex max-w-3xl flex-col gap-3 p-6">
        <PageHeader title={<>Ya recibido</>} />
        <p className="text-sm text-muted">
          Esta salida ya está cerrada. La recepción se hace una sola vez; si se anotó algo mal, se corrige.
        </p>
        <Link to={`/panel/salidas/${id}/correccion`} className="text-sm text-ink underline">
          Corregir recepción
        </Link>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-ink underline">
          Ver la salida
        </Link>
      </Page>
    )
  }

  const esperado = cobros.data?.reduce((suma, c) => suma + c.cash, 0)
  const faltantes = containerGaps(s.stock, devoluciones)
  const recorridos = Number(kilometros) - s.kilometersAtOpen

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    recibir.reset()
    setConfirmando(true)
  }

  function confirmar() {
    recibir.mutate({
      kilometersAtClose: Number(kilometros),
      // Solo las cantidades mayores a cero: devolver cero no es una devolucion, y
      // el backend rechaza esas lineas.
      returns: devoluciones.flatMap((l) => [
        ...(l.llenos !== null && l.llenos > 0
          ? [{ productId: l.productId, state: 'Full' as const, quantity: l.llenos }]
          : []),
        ...(l.vacios !== null && l.vacios > 0
          ? [{ productId: l.productId, state: 'Empty' as const, quantity: l.vacios }]
          : []),
      ]),
      settlement: rindeDespues ? null : { amountReceived: Number(efectivo), notes: null },
    })
  }

  return (
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <div>
        <BackButton to={`/panel/salidas/${id}`} label="Volver a la salida" appearance="link" />
        <PageHeader title={<>Recepción del camión</>} />
        <p className="mt-1 text-sm text-muted">
          {s.driverName} · {zonesLabel(s)} · {s.vehicleName} ({s.vehicleLicensePlate})
        </p>
        <p className="text-sm text-muted">Salió con {s.kilometersAtOpen} km</p>
      </div>

      <Field
        label="Kilometraje de vuelta"
        name="kilometersAtClose"
        type="number"
        min={s.kilometersAtOpen}
        inputMode="numeric"
        required
        value={kilometros}
        onChange={(e) => setKilometros(e.target.value)}
      />

      <ReturnsEditor stock={s.stock} lineas={devoluciones} onChange={setDevoluciones} />

      <div className="flex flex-col gap-2 rounded border border-line bg-surface p-3">
        <span className="text-sm font-medium text-muted">Plata que entregó</span>
        <p className="text-sm text-ink">
          Cobró en efectivo: <span className="font-semibold">
            {esperado === undefined ? (cobros.isError ? 'no se pudo calcular' : 'calculando…') : formatMoney(esperado)}
          </span>
          <span className="text-muted"> · lo que tiene que entregar</span>
        </p>
        {!rindeDespues && (
          <Field
            label="Efectivo entregado"
            name="amountReceived"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            required
            placeholder="Contá y anotá"
            value={efectivo}
            onChange={(e) => setEfectivo(e.target.value)}
          />
        )}
        {!rindeDespues && efectivo !== '' && esperado !== undefined && (
          <span className={`text-xs ${cashGap(esperado, Number(efectivo)) === 0 ? 'text-success-dark'
            : cashGap(esperado, Number(efectivo)) > 0 ? 'text-danger' : 'text-warning'}`}>
            {cashGap(esperado, Number(efectivo)) === 0 ? 'La caja cuadra' : describeCash(cashGap(esperado, Number(efectivo)))}
          </span>
        )}
        <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={rindeDespues} onChange={(e) => setRindeDespues(e.target.checked)}
            className="h-5 w-5 accent-brand" />
          La plata llega después (queda marcada «Falta rendir»)
        </label>
      </div>

      <UnvisitedCustomersPanel sessionId={id} notice />

      <Button type="submit">Recibir el camión</Button>

      {confirmando && (
        <Modal
          title="Confirmar recepción"
          onClose={() => setConfirmando(false)}
          busy={recibir.isPending}
          footer={<>
            <Button type="button" variant="danger" disabled={recibir.isPending} onClick={() => setConfirmando(false)}>
              Volver a contar
            </Button>
            <Button type="button" disabled={recibir.isPending} onClick={confirmar}>
              {recibir.isPending ? 'Cerrando...' : 'Confirmar y cerrar'}
            </Button>
          </>}
        >
          <dl className="flex flex-col gap-3 text-base">
            <div>
              <dt className="text-sm text-muted">Kilómetros</dt>
              <dd className="text-ink">{Number(kilometros)} km (recorrió {recorridos} km)</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Envases</dt>
              {faltantes.length === 0 ? (
                <dd className="font-medium text-success-dark">Cuadra todo</dd>
              ) : faltantes.map((g) => (
                <dd key={g.productId} className="font-medium text-danger">{g.productDetail}: {describeGap(g)}</dd>
              ))}
            </div>
            <div>
              <dt className="text-sm text-muted">Efectivo</dt>
              {rindeDespues ? (
                <dd className="font-medium text-warning">La plata llega después: queda «Falta rendir»</dd>
              ) : esperado === undefined ? (
                <dd className="text-ink">Entregó {formatMoney(Number(efectivo))} (no se pudo calcular lo cobrado)</dd>
              ) : (
                <dd className={cashGap(esperado, Number(efectivo)) === 0 ? 'font-medium text-success-dark' : 'font-medium text-danger'}>
                  Debía entregar {formatMoney(esperado)}, entregó {formatMoney(Number(efectivo))}
                  {' → '}{describeCash(cashGap(esperado, Number(efectivo)))}
                </dd>
              )}
            </div>
          </dl>
          <ErrorMessage error={recibir.error} />
        </Modal>
      )}
    </form>
  )
}
