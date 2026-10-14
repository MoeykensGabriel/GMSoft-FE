import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  /** Al cambiar (por ejemplo, la ruta) se vuelve a intentar mostrar la pantalla. */
  resetKey?: string
}

/**
 * Si una pantalla se rompe al dibujarse, muestra un aviso en su lugar en vez de dejar
 * toda la app en blanco: el menú sigue funcionando y se puede ir a otra página.
 */
export class ScreenErrorBoundary extends Component<Props, { error: Error | null; resetKey?: string }> {
  state: { error: Error | null; resetKey?: string } = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: { error: Error | null; resetKey?: string }) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Pantalla con error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold text-ink">Esta pantalla tuvo un problema</h1>
        <p className="text-muted">No se perdió nada de lo que ya estaba registrado. Probá de nuevo o elegí otra página del menú.</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="navigation" onClick={() => this.setState({ error: null })}>Reintentar</Button>
          <Button type="button" variant="secondary" onClick={() => window.location.reload()}>Recargar la página</Button>
        </div>
      </div>
    )
  }
}
