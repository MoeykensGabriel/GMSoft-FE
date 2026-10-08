import { useEffect, useRef, useState } from 'react'
import { ApiError, Badge, Button, DataTable, ErrorMessage, Select, WEEKDAYS } from '../../core'
import type { Vehicle } from '../../vehicles'
import type { RouteCustomer, RouteFilters, RouteSnapshot } from '../types'
import { routePlanningService } from '../services/routePlanningService'
import { buildRouteSave, dropRow, hasChanges, moveRow, rowModified, toggleVisitDay } from '../utils/routeDraft'

/** Flecha fina para subir o bajar una fila; el nombre accesible lo pone el botón. */
function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={up ? undefined : 'rotate-180'}>
      <path d="M10 16V4" /><path d="M5 9l5-5 5 5" />
    </svg>
  )
}

export function RouteEditor({ initial, filters, vehicles, onDirty, onBusy, onSaved, reload }: {
  initial: RouteSnapshot; filters: RouteFilters; vehicles: Vehicle[]
  onDirty: (value: boolean) => void; onBusy: (value: boolean) => void
  onSaved: (snapshot: RouteSnapshot) => void; reload: () => Promise<RouteSnapshot>
}) {
  const [baseline, setBaseline] = useState(initial)
  const [rows, setRows] = useState(initial.items)
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  const [error, setError] = useState<unknown>(null)
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const dirty = hasChanges(rows, baseline.items)

  useEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  useEffect(() => { onBusy(pending); return () => onBusy(false) }, [pending, onBusy])
  useEffect(() => {
    if (!dirty && !pending) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, pending])
  useEffect(() => {
    if (!dirty && !pending) return
    // The current declarative BrowserRouter has no data-router blocker. Protect
    // ordinary panel links without replacing the router or altering history.
    const warnOnLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return
      const target = new URL(link.href)
      if (target.origin !== window.location.origin || target.pathname === window.location.pathname) return
      if (pending || !window.confirm('Tenés cambios sin guardar. Si salís, se van a descartar. ¿Querés continuar?')) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    document.addEventListener('click', warnOnLink, true)
    return () => document.removeEventListener('click', warnOnLink, true)
  }, [dirty, pending])

  function update(id: string, patch: Partial<RouteCustomer>) {
    if (lock.current) return
    setNotice('')
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))
  }

  function changeDay(row: RouteCustomer, day: number) {
    const days = toggleVisitDay(row.visitDays, day)
    if (!days) { setNotice(`${row.displayName} tiene que conservar al menos un día de visita.`); return }
    update(row.id, { visitDays: days })
  }

  function move(index: number, target: number) {
    if (lock.current) return
    setRows((current) => moveRow(current, index, target))
    setNotice(`${rows[index].displayName} pasó a la posición ${target + 1}.`)
  }

  function accept(snapshot: RouteSnapshot) {
    setBaseline(snapshot)
    setRows(snapshot.items)
    setError(null)
    setConflict(false)
  }

  async function save() {
    if (lock.current || !dirty || conflict) return
    lock.current = true
    setPending(true)
    setError(null)
    setNotice('')
    try {
      const snapshot = await routePlanningService.save(buildRouteSave(filters, baseline, rows))
      accept(snapshot)
      onSaved(snapshot)
      setNotice('Los cambios se guardaron. El recorrido está actualizado.')
    } catch (failure) {
      setError(failure)
      if (failure instanceof ApiError && failure.status === 409) setConflict(true)
    } finally { lock.current = false; setPending(false) }
  }

  async function reloadRoute() {
    if (lock.current || (dirty && !window.confirm('Al recargar se van a descartar tus cambios locales. ¿Querés continuar?'))) return
    lock.current = true
    setPending(true)
    try {
      accept(await reload())
      setNotice('Se recargó el recorrido. Los cambios locales se descartaron.')
    } catch (failure) { setError(failure) }
    finally { lock.current = false; setPending(false) }
  }

  return <section className="flex min-w-0 flex-col gap-3" aria-label="Edición del recorrido" aria-busy={pending}>
    <div className="ui-toolbar flex flex-wrap items-center gap-3">
      <Button disabled={!dirty || pending || conflict} onClick={save}>{pending ? 'Procesando…' : 'Guardar cambios'}</Button>
      <Button variant="danger" disabled={!dirty || pending} onClick={() => {
        setRows(baseline.items); setNotice('Se descartaron los cambios locales.')
        if (!conflict) setError(null)
      }}>Descartar cambios</Button>
      <Button variant="secondary" disabled={pending} onClick={reloadRoute}>Recargar recorrido</Button>
      <span className="text-sm text-muted">{rows.length} clientes · {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}</span>
    </div>
    <ErrorMessage error={error} />
    {conflict && <p role="alert" className="text-sm text-warning">El recorrido cambió en el servidor. Tus cambios siguen visibles. Usá «Recargar recorrido» para ver la lista actual; al recargar se descartan los cambios locales.</p>}
    <p role="status" aria-live="polite" className="text-sm">{notice}</p>
    {rows.length === 0 ? <p>No hay clientes de este camión en esa zona para ese día</p>
      : <>
        <p className="text-sm text-muted">Arrastrá desde el agarre o usá las flechas para subir y bajar. El orden es compartido con los otros días de visita.</p>
        <DataTable label="Clientes del recorrido" className="min-w-[80rem]">
          <thead><tr>
            <th scope="col">Ordenar</th><th scope="col">Pos</th><th scope="col">Cliente</th>
            <th scope="col">Dirección</th><th scope="col">Zona</th>
            {WEEKDAYS.map((day) => <th key={day.value} scope="col" className="text-center"><abbr className="no-underline" title={day.label}>{day.label.slice(0, 3)}</abbr></th>)}
            <th scope="col">Camión</th>
          </tr></thead>
          <tbody onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropAt(null)
          }}>{rows.map((row, index) => {
            const modified = rowModified(row, index, baseline.items)
            const leaves = row.vehicleId !== filters.vehicleId || !row.visitDays.includes(filters.day)
            const dropClass = dropAt === index ? 'inset 0 3px 0 var(--color-accent)'
              : dropAt === rows.length && index === rows.length - 1 ? 'inset 0 -3px 0 var(--color-accent)' : undefined
            return <tr key={row.id} style={{ boxShadow: dropClass }} className={dragId === row.id ? 'opacity-50' : ''}
              onDragOver={(event) => {
                if (!dragId || pending) return
                event.preventDefault(); event.dataTransfer.dropEffect = 'move'
                const rect = event.currentTarget.getBoundingClientRect()
                setDropAt(index + (event.clientY > rect.top + rect.height / 2 ? 1 : 0))
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (!dragId || dropAt === null || lock.current) return
                const from = rows.findIndex((item) => item.id === dragId)
                setRows(dropRow(rows, from, dropAt))
                setNotice('Orden actualizado. Guardá los cambios para aplicarlo.')
                setDragId(null); setDropAt(null)
              }}>
              <td><div className="flex items-center gap-1">
                <Button variant="secondary" className="cursor-grab px-2" disabled={pending} draggable={!pending}
                  aria-label={`Arrastrar a ${row.displayName}; también podés usar Subir y Bajar`}
                  onDragStart={(event) => {
                    if (lock.current) { event.preventDefault(); return }
                    event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', row.id)
                    setDragId(row.id)
                  }} onDragEnd={() => { setDragId(null); setDropAt(null) }}>⠿</Button>
                <div className="flex gap-1">
                  <Button variant="secondary" className="px-2" disabled={pending || index === 0} title="Subir"
                    aria-label={`Subir a ${row.displayName}`} onClick={() => move(index, index - 1)}><Arrow up /></Button>
                  <Button variant="secondary" className="px-2" disabled={pending || index === rows.length - 1} title="Bajar"
                    aria-label={`Bajar a ${row.displayName}`} onClick={() => move(index, index + 1)}><Arrow /></Button>
                </div>
              </div></td>
              <td>{index + 1}</td>
              <td><div className="flex flex-col items-start gap-1"><span className="font-semibold">{row.displayName}</span>
                {modified && <Badge tone="warning">Modificado</Badge>}
                {leaves && <span className="text-warning">Sale de esta lista al guardar</span>}
              </div></td>
              <td>{row.address}<span className="block text-muted">{row.phone}</span></td><td>{row.zoneName}</td>
              {WEEKDAYS.map((day) => <td key={day.value} className="text-center">
                <input type="checkbox" checked={row.visitDays.includes(day.value)} disabled={pending}
                  aria-label={`${day.label} para ${row.displayName}`} onChange={() => changeDay(row, day.value)} />
              </td>)}
              <td><Select label={`Camión de ${row.displayName}`} value={row.vehicleId} disabled={pending || vehicles.length === 0}
                className="min-w-44" onChange={(event) => update(row.id, { vehicleId: event.target.value })}>
                {!vehicles.some((vehicle) => vehicle.id === row.vehicleId) && <option value={row.vehicleId}>{row.vehicleName} · {row.vehicleLicensePlate}</option>}
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
              </Select></td>
            </tr>
          })}</tbody>
        </DataTable>
      </>}
  </section>
}
