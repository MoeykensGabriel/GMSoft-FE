/** Los módulos extra que puede tener una instalación (PLANES.md). El backend dice cuáles en GET /api/modules. */
export type ModuleId = 'control'

/** `module`: la pantalla es de un módulo extra y solo aparece si la instalación lo tiene. */
export interface Item { to: string; label: string; end?: boolean; module?: ModuleId; children?: Item[] }
export interface Group { id: string; label: string; items: Item[] }

// El menú se agrupa por tarea para no crecer hacia abajo con cada pantalla nueva.
export const groups: Group[] = [
  { id: 'clientes', label: 'Clientes', items: [
    { to: '/panel/clientes', label: 'Clientes' },
    { to: '/panel/recorridos', label: 'Recorridos' },
    { to: '/panel/bajas', label: 'Bajas pedidas' },
    { to: '/panel/promociones', label: 'Promociones' },
  ] },
  { id: 'reparto', label: 'Reparto', items: [
    // En el orden del día: de la agenda de la mañana a los números de la vuelta.
    { to: '/panel/agenda', label: 'Organizar reparto x zona' },
    { to: '/panel/salidas', label: 'Salidas' },
    { to: '/panel/liquidacion', label: 'Liquidación' },
    { to: '/panel/rendiciones', label: 'Rendiciones' },
    { to: '/panel/resumen-diario', label: 'Resumen diario' },
    { to: '/panel/hoja-de-ruta', label: 'Hoja de ruta' },
    { to: '/panel/estadisticas', label: 'Estadísticas', module: 'control' },
  ] },
  { id: 'carga', label: 'Administrar carga', items: [
    // Todo lo que sube o baja del camión, en el orden en que pasa.
    { to: '/panel/carga', label: 'Cargar' },
    { to: '/panel/recargas', label: 'Recargar' },
    { to: '/panel/pases', label: 'Pase entre camiones' },
    { to: '/panel/recepcion', label: 'Recibir' },
  ] },
  { id: 'empresa', label: 'Empresa', items: [
    { to: '/panel/ventas', label: 'Ventas' },
    { to: '/panel/configuracion', label: 'Configuración', children: [
      { to: '/panel/configuracion/horario-laboral', label: 'Horario laboral' },
      { to: '/panel/configuracion/actividad-clientes', label: 'Actividad de clientes' },
      { to: '/panel/configuracion/promociones', label: 'Promociones' },
      { to: '/panel/configuracion/capacidad-vehiculo', label: 'Capacidad por vehículo' },
    ] },
    { to: '/panel/vehiculos', label: 'Vehículos' },
    { to: '/panel/control-vehiculos', label: 'Control de vehículos', module: 'control' },
    { to: '/panel/choferes', label: 'Choferes' },
    { to: '/panel/control-en-ruta', label: 'Control en ruta' },
    { to: '/panel/control-choferes', label: 'Control de choferes', module: 'control' },
    { to: '/panel/control-sesiones', label: 'Control de sesiones', module: 'control' },
    { to: '/panel/catalogo', label: 'Productos' },
    { to: '/panel/zonas', label: 'Zonas de reparto' },
  ] },
]

/** El menú de una instalación: sin las pantallas de los módulos que no contrató. */
export function menuFor(enabled: readonly string[], all: Group[] = groups): Group[] {
  return all.map((group) => ({ ...group, items: group.items.filter((item) => !item.module || enabled.includes(item.module)) }))
}
