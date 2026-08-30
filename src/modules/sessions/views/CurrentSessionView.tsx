import { Link } from 'react-router-dom'
import { formatDateTime } from '../../core'
import type { Session } from '../services/sessionService'

/** La salida en curso: con que salio, donde reparte y que tiene a bordo ahora. */
export function CurrentSessionView({ sesion }: { sesion: Session }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Salida en curso</h1>
        <p className="mt-1 text-sm text-slate-600">
          {sesion.zoneName} · {sesion.vehicleName} ({sesion.vehicleLicensePlate})
        </p>
        <p className="text-sm text-slate-500">
          Abierta {formatDateTime(sesion.openedAt)} · {sesion.kilometersAtOpen} km
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">A bordo</span>

        {sesion.stock.length === 0 ? (
          <p className="text-sm text-slate-500">Saliste sin carga.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sesion.stock.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{l.productDetail}</span>
                <span className="text-slate-900">
                  {l.fullOnBoard} llenos
                  {l.emptyOnBoard > 0 && ` · ${l.emptyOnBoard} vacíos`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="/reparto/visita"
        className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
      >
        Registrar visita
      </Link>

      <Link
        to="/reparto/cierre"
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        Cerrar salida
      </Link>
    </div>
  )
}
