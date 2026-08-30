/**
 * Cliente HTTP del backend. Un solo lugar arma las llamadas: adjunta el token,
 * traduce los errores y avisa cuando la sesion caduco.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5142'

const TOKEN_KEY = 'gmsoft.token'

/**
 * El token va en localStorage. Es lo practico para un panel interno, pero conviene
 * saber el costo: cualquier script inyectado en la pagina puede leerlo. La
 * alternativa es una cookie HttpOnly, que necesita que el backend la emita.
 */
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** El backend responde ProblemDetails (RFC 7807) en todos los errores. */
export class ApiError extends Error {
  // Campos declarados y asignados a mano: el template activa erasableSyntaxOnly,
  // que prohibe las propiedades de constructor de TypeScript.
  readonly status: number
  readonly title: string
  readonly detail?: string
  /** Errores por campo, cuando la validacion rechaza el request. */
  readonly errors?: Record<string, string[]>

  constructor(
    status: number,
    title: string,
    detail?: string,
    errors?: Record<string, string[]>,
  ) {
    super(detail || title)
    this.status = status
    this.title = title
    this.detail = detail
    this.errors = errors
  }

  /** Todos los mensajes de validacion en una sola linea, para mostrar rapido. */
  get fieldMessages(): string[] {
    return this.errors ? Object.values(this.errors).flat() : []
  }
}

let onUnauthorized: (() => void) | null = null

/** La app registra aca que hacer cuando el token caduca o deja de valer. */
export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStorage.get()

  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 401 es token vencido o invalido: se cierra sesion. 403 NO, porque ahi el usuario
  // esta bien identificado y solo le falta permiso; desloguearlo seria mentirle.
  if (res.status === 401) {
    tokenStorage.clear()
    onUnauthorized?.()
  }

  if (res.status === 204) return undefined as T

  const texto = await res.text()
  const data = texto ? JSON.parse(texto) : null

  if (!res.ok) {
    throw new ApiError(res.status, data?.title ?? 'Error', data?.detail, data?.errors)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
}
