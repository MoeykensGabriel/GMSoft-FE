export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'navigation'

const variants: Record<ActionVariant, string> = {
  primary: 'border-success bg-success text-white hover:bg-success-dark',
  secondary: 'border-line bg-surface text-brand hover:bg-accent-soft',
  danger: 'border-danger bg-danger text-white hover:bg-danger-dark',
  navigation: 'border-brand bg-brand text-white hover:bg-brand-dark',
}

/** Botones y enlaces de acción comparten aspecto y conservan su semántica HTML. */
export function actionStyles(variant: ActionVariant, className = '') {
  return `ui-action inline-flex items-center justify-center gap-2 rounded border px-4 py-2 text-sm font-semibold leading-snug text-center disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`
}
