import { Link } from 'react-router-dom'
import { formatDateTime } from '../../core'
import type { Session } from '../services/sessionService'

/** La salida en curso: con que salio, donde reparte y que tiene a bordo ahora. */
export function CurrentSessionView({ sesion }: { sesion: Session }) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Salida en curso</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {sesion.zoneName} · {sesion.vehicleName} ({sesion.vehicleLicensePlate})
        </p>
        <p className="text-sm text-neutral-500">
          Abierta {formatDateTime(sesion.openedAt)} · {sesion.kilometersAtOpen} km
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700">A bordo</span>

        {sesion.stock.length === 0 ? (
          <p className="text-sm text-neutral-500">Saliste sin carga.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sesion.stock.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <span className="text-neutral-700">{l.productDetail}</span>
                <span className="text-neutral-900">
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
        className="rounded-md bg-green-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-800"
      >
        Registrar visita
      </Link>

      <p className="text-xs text-neutral-500">
        Cuando volvés, la oficina cuenta lo que traés y cierra la salida.
      </p>
    </div>
  )
}
