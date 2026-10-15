import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMoney } from '../../core'
import type { VehiclePerformance } from '../services/vehiclePerformanceService'
import { abbreviatedMoney } from '../utils/format'


const SERIES_ORDER = ['Vendido', 'Cobrado', 'Quedó a cuenta']
export function VehiclePerformanceChart({ vehicles }: { vehicles: VehiclePerformance[] }) {
  return <div className="min-w-0 overflow-x-auto" role="region" aria-label="Vendido, cobrado y quedó a cuenta por camión. Detalle en la tabla comparativa." tabIndex={0}>
    <div style={{ width: '100%', minWidth: Math.max(280, vehicles.length * 105), height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={vehicles} margin={{ top: 12, right: 12, left: 0, bottom: 8 }} accessibilityLayer>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="vehicleId" tickFormatter={(id: string) => {
            const vehicle = vehicles.find((item) => item.vehicleId === id)
            // Nombre corto y patente: "Kangoo · AE456KT" se reconoce más rápido que la patente sola.
            if (!vehicle) return id
            const name = vehicle.vehicleName.split(' ').slice(-1)[0]
            return vehicle.licensePlate ? `${name} · ${vehicle.licensePlate}` : name
          }} interval={0} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
          <YAxis tickFormatter={abbreviatedMoney} width={75} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} />
          <Tooltip formatter={(value) => typeof value === 'number' ? formatMoney(value) : '—'}
            labelFormatter={(id) => {
              const vehicle = vehicles.find((item) => item.vehicleId === id)
              return vehicle ? `${vehicle.vehicleName} · ${vehicle.licensePlate}` : String(id)
            }} contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)', borderRadius: 4 }} />
          {/* En el mismo orden que las barras; Recharts las ordena alfabéticamente si no. */}
          <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={(item) => SERIES_ORDER.indexOf(String(item.value))} />
          <ReferenceLine y={0} stroke="var(--color-muted)" />
          <Bar dataKey="sold" name="Vendido" fill="var(--color-brand)" maxBarSize={32} />
          <Bar dataKey="collected" name="Cobrado" fill="var(--color-accent)" maxBarSize={32} />
          <Bar dataKey="onAccount" name="Quedó a cuenta" fill="var(--color-warning)" maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
}
