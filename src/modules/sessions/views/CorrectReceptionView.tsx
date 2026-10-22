import { zonesLabel } from '../../zones'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorMessage, Field, Page, PageHeader, Textarea, formatMoney, BackButton } from '../../core'
import { receptionQuery } from '../hooks/receptionQuery'
import { sessionService } from '../services/sessionService'
import type { ContainerState, CorrectReceptionRequest, Reception } from '../services/sessionService'

type Conteo = Record<string, { Full: string; Empty: string }>

/**
 * Corregir la recepción de una salida ya cerrada, cuando se anotó mal algo al recibir
 * el camión. Los campos vienen con lo que quedó anotado: se cambia solo lo que estaba
 * mal y se escribe por qué. No se pisa nada; el antes y el después quedan en la salida.
 */
export function CorrectReceptionView() {
  const { id = '' } = useParams()
  const sesion = useQuery({ queryKey: ['sessions', 'detail', id], queryFn: () => sessionService.getById(id) })
  const recepcion = useQuery(receptionQuery(id))

  if (sesion.isLoading || recepcion.isLoading) return <p className="p-6 text-muted">Cargando...</p>
  if (!sesion.data || !recepcion.data) return <p className="p-6 text-danger">No se encontró la salida.</p>

  if (sesion.data.status !== 'Closed') {
    return (
      <Page className="ui-card mx-auto flex max-w-3xl flex-col gap-3 p-6">
        <PageHeader title={<>Todavía en la calle</>} />
        <p className="text-sm text-muted">La recepción se corrige después de recibir el camión.</p>
        <Link to={`/panel/salidas/${id}`} className="text-sm text-ink underline">Ver la salida</Link>
      </Page>
    )
  }

  const s = sesion.data
  return (
    // Se rearma solo si otra corrección cambió la recepción, no en cada refresco.
    <CorrectionForm key={recepcion.data.corrections.length} sessionId={id} reception={recepcion.data}
      subtitle={`${s.driverName} · ${zonesLabel(s)} · ${s.vehicleName} (${s.vehicleLicensePlate})`} />
  )
}

function CorrectionForm({ sessionId, reception, subtitle }: { sessionId: string; reception: Reception; subtitle: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [kilometros, setKilometros] = useState(String(reception.kilometersAtClose ?? ''))
  const [monto, setMonto] = useState(reception.amountReceived === null ? '' : String(reception.amountReceived))
  const [conteo, setConteo] = useState<Conteo>(() => Object.fromEntries(reception.products.map((p) =>
    [p.productId, { Full: String(p.fullReturned), Empty: String(p.emptyReturned) }])))
  const [motivo, setMotivo] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  const corregir = useMutation({
    mutationFn: (body: CorrectReceptionRequest) => sessionService.correctReception(sessionId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/panel/salidas/${sessionId}`)
    },
  })

  const anotado = (productId: string, state: ContainerState) => {
    const p = reception.products.find((x) => x.productId === productId)!
    return state === 'Full' ? p.fullReturned : p.emptyReturned
  }

  const cambios = (): CorrectReceptionRequest => ({
    reason: motivo.trim(),
    kilometersAtClose: kilometros !== '' && Number(kilometros) !== reception.kilometersAtClose ? Number(kilometros) : null,
    amountReceived: reception.amountReceived !== null && monto !== '' && Number(monto) !== reception.amountReceived
      ? Number(monto) : null,
    returns: reception.products.flatMap((p) => (['Full', 'Empty'] as const)
      .filter((state) => Number(conteo[p.productId][state]) !== anotado(p.productId, state))
      .map((state) => ({ productId: p.productId, state, quantity: Number(conteo[p.productId][state]) }))),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setAviso(null)
    const body = cambios()
    if (body.kilometersAtClose === null && body.amountReceived === null && body.returns.length === 0) {
      setAviso('No cambiaste ningún dato: los números son iguales a los que ya estaban.')
      return
    }
    corregir.mutate(body)
  }

  const set = (productId: string, state: ContainerState, valor: string) =>
    setConteo((c) => ({ ...c, [productId]: { ...c[productId], [state]: valor } }))

  return (
    <form onSubmit={onSubmit} className="ui-card mx-auto flex max-w-3xl flex-col gap-5 p-6">
      <div>
        <BackButton to={`/panel/salidas/${sessionId}`} label="Volver a la salida" appearance="link" />
        <PageHeader title={<>Corregir recepción</>} />
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <p className="mt-2 text-sm text-muted">
          Cambiá solo lo que se anotó mal. Lo anterior no se borra: el cambio queda en la salida con el motivo.
        </p>
      </div>

      <Field label={`Kilometraje de vuelta (salió con ${reception.kilometersAtOpen} km)`} name="kilometersAtClose"
        type="number" min={reception.kilometersAtOpen} inputMode="numeric" required
        value={kilometros} onChange={(e) => setKilometros(e.target.value)} />

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-muted">Qué volvió en el camión</span>
        {reception.products.map((p) => (
          <div key={p.productId} className="ui-card bg-surface p-3">
            <span className="text-sm font-medium text-ink">{p.productDetail}</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([['Full', 'Llenos', p.fullMissing], ['Empty', 'Vacíos', p.emptyMissing]] as const).map(([state, etiqueta, faltaba]) => {
                const valor = conteo[p.productId][state]
                const antes = anotado(p.productId, state)
                // Lo que falta después de la corrección: cada unidad más que volvió es una menos que falta.
                const falta = faltaba - ((Number(valor) || 0) - antes)
                return (
                  <label key={state} className="flex flex-col gap-1">
                    <span className="text-xs text-muted">{etiqueta} · anotado {antes}</span>
                    <input type="number" min={0} inputMode="numeric" required value={valor}
                      aria-label={`${p.productDetail}: ${etiqueta.toLowerCase()} que volvieron`}
                      onChange={(e) => set(p.productId, state, e.target.value)} className="ui-input" />
                    {falta !== 0 && (
                      <span className={falta > 0 ? 'text-xs text-danger' : 'text-xs text-warning'}>
                        {falta > 0 ? `faltan ${falta}` : `sobran ${-falta}`}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {reception.amountReceived !== null ? (
        <Field label={`Plata rendida (se anotó ${formatMoney(reception.amountReceived)})`} name="amountReceived"
          type="number" min={0} step="0.01" inputMode="decimal" required
          value={monto} onChange={(e) => setMonto(e.target.value)} />
      ) : (
        <p className="text-sm text-muted">La plata todavía no se rindió: se carga en la liquidación de la salida.</p>
      )}

      <Textarea label="Motivo de la corrección" name="reason" required maxLength={500} rows={2}
        placeholder="Ej.: se contaron mal los vacíos de 20 lts"
        value={motivo} onChange={(e) => setMotivo(e.target.value)} />

      {aviso && <p role="alert" className="text-sm text-danger">{aviso}</p>}
      <ErrorMessage error={corregir.error} />

      <Button type="submit" disabled={corregir.isPending}>
        {corregir.isPending ? 'Guardando...' : 'Guardar corrección'}
      </Button>
    </form>
  )
}
