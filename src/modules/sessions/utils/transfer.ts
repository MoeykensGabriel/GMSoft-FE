export interface TransferStock { productId: string; productDetail: string; fullOnBoard: number }
export interface TransferLine { productId: string; productDetail: string; quantity: number }

/** Lo que se puede pasar: solo productos con llenos a bordo, en el orden en que vienen. */
export function transferableStock(stock: TransferStock[] | undefined): TransferStock[] {
  return (stock ?? []).filter((line) => line.fullOnBoard > 0)
}

/** Las líneas del pase: solo las que tienen cantidad, y nunca más de lo que hay a bordo. */
export function transferLines(stock: TransferStock[], quantities: Record<string, number>): TransferLine[] {
  return stock
    .map((line) => ({ productId: line.productId, productDetail: line.productDetail,
      quantity: Math.min(line.fullOnBoard, Math.max(0, Math.floor(quantities[line.productId] ?? 0))) }))
    .filter((line) => line.quantity > 0)
}

/** «3 Bidón 12 lts y 1 Bidón 20 lts». */
export function describeTransfer(lines: TransferLine[]): string {
  const parts = lines.map((line) => `${line.quantity} ${line.productDetail}`)
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`
}
