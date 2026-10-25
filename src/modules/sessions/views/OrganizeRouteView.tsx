import { orderedZones } from '../../zones'
import type { OrderedZone } from '../../zones'
import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ApiError, BackButton, Button, ErrorMessage, Modal, Page } from '../../core'
import { useCurrentSession } from '../hooks/useCurrentSession'
import { routeOrderService } from '../services/routeOrderService'
import type { DriverRouteCustomer, DriverRouteSnapshot } from '../services/routeOrderService'
import { routeOrderChanges } from '../utils/routeOrderChanges'

export function OrganizeRouteView() {
  const session = useCurrentSession()
  return <Page className="mx-auto flex max-w-3xl flex-col gap-3 p-3">
    {session.data?.status === 'Open' ? <RouteWorkspace key={session.data.id} sessionId={session.data.id} zones={orderedZones(session.data)} />
      : <><BackButton to="/reparto" label="Volver a la hoja" />
        {session.isError ? <><ErrorMessage error={session.error} /><Button onClick={() => void session.refetch()}>Reintentar</Button></>
          : <p role="status">{session.isPending ? 'Cargando tu salida…' : 'Necesitás una salida abierta para organizar el recorrido.'}</p>}</>}
  </Page>
}

type ZoneSnapshot = DriverRouteSnapshot & OrderedZone

const loadZones = (sessionId: string, zones: OrderedZone[]) => Promise.all(zones.map(async (zone) => ({ ...zone, ...await routeOrderService.get(sessionId, zone.zoneId) })))

function RouteWorkspace({ sessionId, zones }: { sessionId: string; zones: OrderedZone[] }) {
  const query = useQuery({
    queryKey: ['sessions', 'route-order', sessionId, zones], queryFn: () => loadZones(sessionId, zones),
    staleTime: Infinity, gcTime: 0, retry: false,
    refetchOnMount: 'always', refetchOnWindowFocus: false, refetchOnReconnect: false,
  })
  if (!query.data) return <>
    <BackButton to="/reparto" label="Volver a la hoja" />
    <h1 className="text-2xl font-semibold">Organizar recorrido</h1>
    {query.isError ? <><ErrorMessage error={query.error} /><Button onClick={() => void query.refetch()}>Reintentar</Button></>
      : <p role="status">Cargando recorrido…</p>}
  </>
  return <RouteOrderEditor sessionId={sessionId} initial={query.data} />
}

function RouteOrderEditor({ sessionId, initial }: { sessionId: string; initial: ZoneSnapshot[] }) {
  const navigate = useNavigate()
  const cache = useQueryClient()
  const [baseline, setBaseline] = useState(initial)
  const [rows, setRows] = useState(initial)
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<unknown>(null)
  const changes = rows.flatMap((zone) => routeOrderChanges(baseline.find((item) => item.zoneId === zone.zoneId)!.items, zone.items).map((change) => ({ ...change, zoneName: zone.zoneName })))
  const dirty = changes.length > 0
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!dirty && !busy) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy])

  function back() {
    if (lock.current) return
    if (dirty) setLeaving(true)
    else navigate('/reparto')
  }

  function moved(zoneId: string, { active, over }: DragEndEvent) {
    if (!over || active.id === over.id || lock.current || conflict) return
    setRows((current) => current.map((zone) => {
      if (zone.zoneId !== zoneId) return zone
      const from = zone.items.findIndex((row) => row.id === active.id)
      const to = zone.items.findIndex((row) => row.id === over.id)
      return from < 0 || to < 0 ? zone : { ...zone, items: arrayMove(zone.items, from, to) }
    }))
  }

  async function reload() {
    const snapshot = await loadZones(sessionId, initial)
    setBaseline(snapshot)
    setRows(snapshot)
    setConflict(false)
    cache.setQueryData(['sessions', 'route-order', sessionId, initial.map(({ zoneId, zoneName }) => ({ zoneId, zoneName }))], snapshot)
  }

  async function retryReload() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(null)
    try { await reload() } catch (failure) { setError(failure) }
    finally { lock.current = false; setBusy(false) }
  }

  async function save() {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(null); setNotice('')
    try {
      // Cada zona tiene su versión. Si una falla, las ya guardadas quedan como base para reintentar.
      for (const zone of rows) {
        const original = baseline.find((item) => item.zoneId === zone.zoneId)!
        if (!routeOrderChanges(original.items, zone.items).length) continue
        const saved = await routeOrderService.save(sessionId, zone.items.map((row) => row.id), original.version, zone.zoneId)
        setBaseline((current) => current.map((item) => item.zoneId === zone.zoneId ? { ...zone, ...saved } : item))
      }
      await Promise.all(['customers', 'sessions', 'session', 'route-planning'].map((key) =>
        cache.invalidateQueries({ queryKey: [key], refetchType: 'none' })))
      navigate('/reparto', { replace: true, state: { routeSaved: true } })
    } catch (failure) {
      setConfirming(false)
      if (failure instanceof ApiError && failure.status === 409) {
        setNotice('El recorrido cambió mientras ordenabas. Volvé a cargarlo.')
        setConflict(true)
        try { await reload() } catch (reloadError) { setError(reloadError) }
      } else if (!(failure instanceof ApiError)) {
        setNotice('No pudimos guardar: revisá la señal y volvé a intentar. Conservamos el orden en pantalla.')
      } else setError(failure)
    } finally { lock.current = false; setBusy(false) }
  }

  return <>
    <BackButton onClick={back} label="Volver a la hoja" />
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-canvas py-3">
      <h1 className="text-xl font-semibold">Organizar recorrido</h1>
      <Button className="min-h-11" disabled={!dirty || busy || conflict} onClick={() => setConfirming(true)}>Guardar</Button>
    </div>
    <p className="text-sm text-muted">Mantené apretadas las tres rayas para mover un cliente. Con teclado, usá espacio y las flechas.</p>
    {notice && <p role="status" className="ui-card p-3">{notice}</p>}
    <ErrorMessage error={error} />
    {conflict && <Button className="min-h-11" disabled={busy} onClick={() => void retryReload()}>Volver a cargar el recorrido</Button>}
    {rows.map((zone) => <section key={zone.zoneId} className="flex flex-col gap-2">
      {rows.length > 1 && <h2 className="font-semibold text-danger">{zone.zoneName} · {zone.items.length} clientes</h2>}
      {!zone.items.length && <p>No hay clientes en esta zona.</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => moved(zone.zoneId, event)} autoScroll
        accessibility={{ screenReaderInstructions: { draggable: 'Para mover el cliente, presioná espacio. Usá las flechas para cambiar su lugar y espacio para soltarlo. Escape cancela.' },
          announcements: {
            onDragStart: ({ active }) => `Moviendo ${zone.items.find((row) => row.id === active.id)?.displayName}.`,
            onDragOver: ({ over }) => over ? `Posición ${zone.items.findIndex((row) => row.id === over.id) + 1} de ${zone.items.length}.` : undefined,
            onDragEnd: ({ over }) => over ? `Posición ${zone.items.findIndex((row) => row.id === over.id) + 1}.` : 'Movimiento cancelado.',
            onDragCancel: () => 'Movimiento cancelado.',
          } }}>
        <SortableContext items={zone.items.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2" aria-label={`Orden del recorrido ${zone.zoneName}`}>
            {zone.items.map((row, index) => <SortableRow key={row.id} row={row} position={index + 1} disabled={busy || conflict} />)}
          </ol>
        </SortableContext>
      </DndContext>
    </section>)}
    {confirming && <Modal title="Confirmar nuevo orden" onClose={() => setConfirming(false)} busy={busy}
      footer={<><Button className="min-h-11" variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Volver a ordenar</Button>
        <Button className="min-h-11" disabled={busy} onClick={() => void save()}>{busy ? 'Guardando…' : 'Confirmar'}</Button></>}>
      <p>{changes.length === 1 ? '1 cliente cambió de lugar' : `${changes.length} clientes cambiaron de lugar`}</p>
      <ul className="max-h-[45vh] overflow-y-auto">{changes.map((change) =>
        <li key={change.id} className="min-h-11 border-b border-line py-3">{rows.length > 1 && `${change.zoneName} · `}{change.displayName}: {change.from} → {change.to}</li>)}</ul>
    </Modal>}
    {leaving && <Modal title="Tenés cambios sin guardar" onClose={() => setLeaving(false)}
      footer={<><Button className="min-h-11" variant="secondary" onClick={() => setLeaving(false)}>Seguir ordenando</Button>
        <Button className="min-h-11" variant="danger" onClick={() => navigate('/reparto')}>Salir sin guardar</Button></>}>
      <p>Si volvés a la hoja, se descarta el orden que armaste.</p>
    </Modal>}
  </>
}

function SortableRow({ row, position, disabled }: { row: DriverRouteCustomer; position: number; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, disabled })
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 20 : undefined }}
    className={`ui-card flex min-h-16 items-center gap-3 p-3 ${isDragging ? 'shadow-lg' : ''}`}>
    <span className="w-7 shrink-0 text-center font-semibold tabular-nums">{position}</span>
    <div className="min-w-0 flex-1"><p className="break-words font-semibold">{row.displayName}</p><p className="break-words text-sm text-muted">{row.address}</p></div>
    <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} disabled={disabled}
      aria-label={`Mover a ${row.displayName}`} className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded border border-line text-ink focus-visible:outline-2 focus-visible:outline-brand">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
  </li>
}
