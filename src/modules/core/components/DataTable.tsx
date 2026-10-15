import { useLayoutEffect, useRef } from 'react'
import type { TableHTMLAttributes } from 'react'

/**
 * Tabla semántica con desplazamiento local; nunca ensancha la página en el celular.
 *
 * En el celular cada fila se muestra como una tarjeta, con el título de su columna al
 * lado de cada dato (`stack`, activo por defecto). Es la misma información: solo cambia
 * cómo se acomoda. Las tablas chicas de números se leen mejor como tabla y lo desactivan.
 */
export function DataTable({ label, children, className = '', stack = true, ...props }:
  TableHTMLAttributes<HTMLTableElement> & { label: string; stack?: boolean }) {
  const table = useRef<HTMLTableElement>(null)

  // Cada celda recibe el título de su columna para mostrarlo en la tarjeta (o el
  // data-label del encabezado, si el título tiene más texto del que conviene repetir). Corre en
  // cada render porque las filas cambian con los datos; tocar atributos no re-renderiza.
  useLayoutEffect(() => {
    if (!stack || !table.current) return
    const headers = [...table.current.querySelectorAll('thead tr:last-child th')].map((th) => th.getAttribute('data-label') ?? th.textContent?.trim() ?? '')
    for (const row of table.current.querySelectorAll('tbody tr, tfoot tr')) {
      let column = 0
      for (const cell of row.children) {
        const label = headers[column] ?? ''
        if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label)
        column += (cell as HTMLTableCellElement).colSpan || 1
      }
    }
  })

  return <div className={`ui-card min-w-0 overflow-x-auto ${stack ? 'ui-table-stack-wrap' : ''}`} role="region" aria-label={label} tabIndex={0}>
    <table ref={table} {...props} className={`ui-table ${stack ? 'ui-table-stack' : ''} ${className}`}>
      <caption className="sr-only">{label}</caption>
      {children}
    </table>
  </div>
}
