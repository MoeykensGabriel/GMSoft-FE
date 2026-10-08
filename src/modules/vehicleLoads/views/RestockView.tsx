import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, Button, ErrorMessage, LinkButton, Page, PageHeader, Textarea, formatDateTime } from '../../core'
import { productService } from '../../products'
import { sessionService, StockOnBoardPanel } from '../../sessions'
import { LoadEditor } from '../components/LoadEditor'
import type { LoadLine } from '../components/LoadEditor'
import { LoadConfirmModal } from '../components/LoadConfirmModal'
import type { LoadConfirmLine } from '../components/LoadConfirmModal'
import { VehicleAssignmentSummary } from '../components/VehicleAssignmentSummary'
import { useRestockWrite } from '../hooks/useRestockWrite'

export function RestockView() {
  const { id = '' } = useParams()
  return <RestockForm key={id} sessionId={id} />
}

function RestockForm({ sessionId }: { sessionId: string }) {
  const session = useQuery({ queryKey: ['sessions', 'detail', sessionId], queryFn: () => sessionService.getById(sessionId) })
  const products = useQuery({ queryKey: ['products', 'published'], queryFn: () => productService.listPublished() })
  const [items, setItems] = useState<LoadLine[]>([])
  const [notes, setNotes] = useState('')
  // El resumen también queda congelado si se actualiza el catálogo o el stock mientras está abierto.
  const [review, setReview] = useState<{ openedAt: Date; lines: LoadConfirmLine[] } | null>(null)
  const write = useRestockWrite(sessionId)
  const back = <LinkButton to={`/panel/salidas/${sessionId}`}>Volver</LinkButton>

  if (write.isSuccess && write.data) return <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
    <PageHeader title="Recarga registrada" />
    <p role="status">Recarga registrada el {formatDateTime(write.data.occurredAt, BUSINESS_TIME_ZONE)} (hora de Argentina).</p>
    <div className="flex flex-wrap gap-3">
      <Button disabled={session.data?.status !== 'Open'} onClick={() => {
        write.startAnother(); setItems([]); setNotes(''); setReview(null)
      }}>Registrar otra recarga</Button>
      {back}
    </div>
  </Page>

  if (!session.data) return <Page className="p-6">
    {session.isPending ? <p role="status">Cargando salida...</p> : <ErrorMessage error={session.error} />}
    {back}
  </Page>

  const s = session.data
  const published = products.data?.items ?? []
  const valid = items.length > 0 && items.every((line) => Number.isInteger(line.quantity) && line.quantity > 0 && published.some((p) => p.id === line.productId)) && notes.length <= 500
  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Recarga en ruta" actions={back} />
    <VehicleAssignmentSummary vehicleName={s.vehicleName} licensePlate={s.vehicleLicensePlate} driverNames={[s.driverName]} />
    <p>Zona: {s.zoneName}</p>
    <StockOnBoardPanel stock={s.stock} cerrada={s.status === 'Closed'} />
    <ErrorMessage error={session.error} />
    {s.status === 'Closed' && <p role="status">Esta salida ya está cerrada. No se pueden registrar nuevas recargas.</p>}
    <p className="text-muted">Anotá solo los llenos que suben. Los vacíos se cuentan juntos en la recepción final.</p>
    <form className="flex flex-col gap-4" onSubmit={(event) => {
      event.preventDefault()
      if (!valid || write.isPending || write.locked || s.status !== 'Open' || products.isError) return
      setReview({ openedAt: new Date(), lines: items.map((line) => ({ ...line,
        productDetail: published.find((p) => p.id === line.productId)!.detail,
        // En ruta las ventas pueden cambiar el saldo durante la revisión: mostramos solo esta tanda.
        totalOnBoard: line.quantity,
      })) })
    }}>
      <ErrorMessage error={products.error} />
      <fieldset disabled={write.locked || s.status !== 'Open' || Boolean(review)} className="flex flex-col gap-4">
        <LoadEditor productos={published} valor={items} onChange={setItems} />
        <Textarea label="Notas (opcional)" maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </fieldset>
      <p className="text-right font-medium">Total a recargar: {items.reduce((sum, line) => sum + line.quantity, 0)} unidades</p>
      <Button type="submit" className="self-end" disabled={!valid || write.locked || Boolean(review) || products.isPending || products.isError || s.status !== 'Open'}>Confirmar</Button>
    </form>
    {review && <LoadConfirmModal restock vehicleName={s.vehicleName} licensePlate={s.vehicleLicensePlate}
      driverNames={[s.driverName]} routeDays={s.routeDays} lines={review.lines} openedAt={review.openedAt}
      notes={notes.trim()} sending={write.isPending} error={write.error}
      backDisabled={write.locked && !write.canCorrect}
      notice={write.isError && !write.canCorrect ? 'No pudimos confirmar el resultado. Conservamos los datos: presioná Confirmar recarga para reintentar sin duplicarla.' : undefined}
      onBack={() => { if (write.locked) write.correct(); setReview(null) }}
      onConfirm={() => { void write.send({ items, notes: notes.trim() || null }) }} />}
  </Page>
}
