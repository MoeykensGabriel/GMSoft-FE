import { ApiError } from '../lib/api'

interface Props {
  error: unknown
  /** Que decir cuando el error no vino de la API (se cayo la red, por ejemplo). */
  fallback?: string
}

/**
 * El error de una operacion contra la API, en un solo lugar.
 *
 * Existe porque el mensaje que importa es facil de perder: cuando la validacion
 * rechaza el request, el "por que" viene en `errors`, campo por campo, y no en
 * `detail`. Mostrar solo `detail` deja al usuario con un "Ocurrieron uno o mas
 * errores de validacion" que no le dice que corregir.
 */
export function ErrorMessage({ error, fallback = 'No se pudo conectar con el servidor.' }: Props) {
  if (!error) return null

  const apiError = error instanceof ApiError ? error : null
  const porCampo = apiError?.fieldMessages ?? []

  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {porCampo.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {porCampo.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      ) : (
        <p>{apiError ? (apiError.detail ?? apiError.title) : fallback}</p>
      )}
    </div>
  )
}
