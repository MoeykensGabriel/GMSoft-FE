import { DataTable, formatMoney } from '../../core'
import type { SummaryMoney, SummaryProduct, SummaryStock } from '../services/dailySummaryService'
import { SummaryDifference } from './SummaryDifference'

export function DailySummaryMoneyTable({ money, isClosed, label }: {
  money: SummaryMoney
  isClosed: boolean
  label: string
}) {
  return <DataTable label={label}>
    <thead><tr><th scope="col">Dinero</th><th scope="col" className="text-right">Importe</th></tr></thead>
    <tbody>
      <tr><th scope="row" className="font-normal">Efectivo a rendir</th><td className="text-right tabular-nums">{formatMoney(money.cashExpected)}</td></tr>
      <tr><th scope="row" className="font-normal">Efectivo declarado</th><td className="text-right tabular-nums">
        {money.cashDeclared === null ? (isClosed ? 'Todavía no se rindió' : 'Pendiente · Todavía no se rindió') : formatMoney(money.cashDeclared)}
      </td></tr>
      <tr><th scope="row" className="font-normal">Diferencia de efectivo</th>
        <SummaryDifference value={money.cashDifference} isClosed={isClosed} money />
      </tr>
      <tr><th scope="row" className="font-normal">Transferencia (informativo)</th><td className="text-right tabular-nums">{formatMoney(money.transfer)}</td></tr>
      <tr><th scope="row" className="font-normal">Tarjeta (informativo)</th><td className="text-right tabular-nums">{formatMoney(money.card)}</td></tr>
    </tbody>
  </DataTable>
}

function StockCells({ stock, isClosed }: { stock: SummaryStock; isClosed: boolean }) {
  return <>
    <td className="text-right tabular-nums">{stock.fullLoaded}</td>
    <td className="text-right tabular-nums">{stock.fullSold}</td>
    <td className="text-right tabular-nums">{stock.fullReturned}</td>
    <SummaryDifference value={stock.fullDifference} isClosed={isClosed} />
    <td className="border-l border-line text-right tabular-nums">{stock.emptyCollected}</td>
    <td className="text-right tabular-nums">{stock.emptyReturned}</td>
    <SummaryDifference value={stock.emptyDifference} isClosed={isClosed} />
  </>
}

export function DailySummaryStockTable({ products, totals, isClosed, label, provisional = false }: {
  products: SummaryProduct[]
  totals: SummaryStock
  isClosed: boolean
  label: string
  provisional?: boolean
}) {
  const differenceTitle = isClosed ? 'Diferencia' : provisional ? 'Saldo provisional' : 'A bordo'
  return <DataTable label={label} className="min-w-[58rem]">
    <colgroup><col /></colgroup><colgroup span={4} /><colgroup span={3} />
    <thead>
      <tr>
        <th scope="col" rowSpan={2}>Producto</th>
        <th scope="colgroup" colSpan={4} className="text-center">Envases llenos</th>
        <th scope="colgroup" colSpan={3} className="border-l border-line text-center">Envases vacíos</th>
      </tr>
      <tr>
        <th scope="col" className="text-right">Cargados</th>
        <th scope="col" className="text-right">Vendidos</th>
        <th scope="col" className="text-right">Rendidos</th>
        <th scope="col" className="text-right">{differenceTitle}</th>
        <th scope="col" className="border-l border-line text-right">Contabilizados</th>
        <th scope="col" className="text-right">Rendidos</th>
        <th scope="col" className="text-right">{differenceTitle}</th>
      </tr>
    </thead>
    <tbody>
      {products.length === 0 && <tr><td colSpan={8} className="text-muted">Todavía no hay movimientos de productos.</td></tr>}
      {products.map((product) => <tr key={product.productId}>
        <th scope="row" className="font-normal">{product.productDetail}</th>
        <StockCells stock={product.stock} isClosed={isClosed} />
      </tr>)}
    </tbody>
    <tfoot><tr className="bg-accent-soft font-semibold">
      <th scope="row">Totales</th><StockCells stock={totals} isClosed={isClosed} />
    </tr></tfoot>
  </DataTable>
}
