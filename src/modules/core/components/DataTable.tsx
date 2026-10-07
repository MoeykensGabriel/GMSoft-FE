import type { TableHTMLAttributes } from 'react'

/** Tabla semántica con desplazamiento local; nunca ensancha la página en el celular. */
export function DataTable({ label, children, className = '', ...props }: TableHTMLAttributes<HTMLTableElement> & { label: string }) {
  return <div className="ui-card min-w-0 overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
    <table {...props} className={`ui-table ${className}`}>
      <caption className="sr-only">{label}</caption>
      {children}
    </table>
  </div>
}
